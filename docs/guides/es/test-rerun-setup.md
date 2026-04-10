# Re-ejecucion de Tests — Guia de Configuracion

QA Report Platform permite re-ejecutar tests fallidos o seleccionados directamente desde la pagina de un launch. Los nuevos resultados reemplazan a los anteriores **en la misma ejecucion** — no se crean launches secundarios separados.

Esta guia explica como configurar el pipeline de re-ejecucion de extremo a extremo.

---

## Requisitos previos

- El backend de la plataforma esta en ejecucion y las migraciones estan aplicadas (la tabla `test_rerun_job` debe existir).
- Al menos un proyecto con resultados de tests importados (para tener un launch desde el cual re-ejecutar).
- Un sistema de CI (GitHub Actions, GitLab CI, Jenkins, etc.) que pueda recibir triggers por webhook — **o** un agente local de re-ejecucion de tests.

---

## Paso 1 — Abrir la configuracion de Re-ejecucion

1. Ve a **Settings** en la barra lateral izquierda.
2. Haz clic en **Test Rerun** en la navegacion de ajustes.
3. Selecciona el **proyecto** que deseas configurar en el desplegable "Project scope" (los ajustes se almacenan por proyecto).

---

## Paso 2 — Crear un perfil de ejecucion

Cada proyecto necesita al menos un perfil de ejecucion que indique a la plataforma *como* disparar tus tests.

### Campos del perfil

| Campo | Descripcion | Ejemplo |
|-------|-------------|---------|
| **Profile name** | Etiqueta legible | `Playwright CI Rerun` |
| **Framework** | Framework de testing utilizado en el proyecto | `playwright`, `junit` o `testng` |
| **Execution mode** | Como la plataforma dispara la re-ejecucion | `ci-webhook` o `agent` |
| **Trigger mode** | Ejecutar solo los tests seleccionados o el pipeline completo | `tests_only` o `full_pipeline` |
| **Command template** | Comando shell con marcadores de posicion (ver abajo) | `npx playwright test --grep "{{selectorExpression}}"` |
| **CI trigger URL** | URL del webhook en la que escucha tu CI (para el modo `ci-webhook`) | `https://ci.example.com/api/trigger` |
| **Enabled** | Interruptor para habilitar/deshabilitar el perfil | activado |
| **Active profile** | Boton de seleccion — que perfil usar cuando existen varios | seleccionado |

### Marcadores de posicion del command template

| Marcador | Se reemplaza con | Ejemplo de salida |
|----------|------------------|-------------------|
| `{{selectorExpression}}` | Expresion compatible con regex que une todos los nombres/IDs de tests seleccionados | `Login test\|Logout test` |
| `{{selectorArgs}}` | Argumentos separados por espacios | `--grep "Login test" --grep "Logout test"` |

### Ejemplos de perfiles

**Playwright (CI webhook):**
```
Profile name:     Playwright Rerun
Framework:        playwright
Execution mode:   ci-webhook
Trigger mode:     tests_only
Command template: npx playwright test --grep "{{selectorExpression}}"
CI trigger URL:   https://ci.example.com/api/pipelines/trigger
```

**JUnit (CI webhook):**
```
Profile name:     JUnit Rerun
Framework:        junit
Execution mode:   ci-webhook
Trigger mode:     tests_only
Command template: mvn test -Dtest="{{selectorExpression}}"
CI trigger URL:   https://jenkins.example.com/job/rerun/buildWithParameters
```

Haz clic en **Save rerun settings** despues de completar el perfil.

---

## Paso 3 — Configurar tu CI para aceptar el webhook

Cuando haces clic en "Rerun" en la interfaz, la plataforma envia una solicitud `POST` a tu **CI trigger URL** con el siguiente cuerpo JSON:

```json
{
  "projectId": "my-project",
  "parentRunId": 42,
  "executionProfileId": "profile-uuid",
  "framework": "playwright",
  "triggerMode": "tests_only",
  "command": "npx playwright test --grep \"Login test|Logout test\"",
  "commandArgs": ["--grep", "Login test|Logout test"],
  "selectors": [
    { "kind": "testName", "value": "Login test", "testResultId": "uuid-1" },
    { "kind": "testName", "value": "Logout test", "testResultId": "uuid-2" }
  ]
}
```

Tu pipeline de CI debe:

1. Analizar el campo `command` y ejecutarlo (ejecutar los tests).
2. Recopilar los resultados de Allure.
3. Subir los resultados de vuelta a la plataforma **con `parentRunId`** para que se fusionen en la ejecucion original.

### Subir resultados de vuelta (ejemplo de script CI)

```bash
# After tests finish and allure-results/ directory is ready:

zip -r allure-results.zip allure-results/

curl -X POST "https://your-platform.com/upload/ci/allure-results?projectId=my-project" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -F "file=@allure-results.zip" \
  -F "runName=Rerun" \
  -F "parentRunId=42" \
  -F "projectId=my-project"
```

Detalle clave: **`parentRunId`** indica al endpoint de subida que debe importar los resultados en el launch existente en lugar de crear uno nuevo. Los resultados anteriores para los tests re-ejecutados (coincidentes por nombre de test) se reemplazan automaticamente.

### Ejemplo con GitHub Actions

```yaml
name: Test Rerun
on:
  repository_dispatch:
    types: [test-rerun]

jobs:
  rerun:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: ${{ github.event.client_payload.command }}
        continue-on-error: true

      - name: Upload results to platform
        run: |
          cd allure-results && zip -r ../allure-results.zip . && cd ..
          curl -X POST "${{ secrets.QA_PLATFORM_URL }}/upload/ci/allure-results?projectId=${{ github.event.client_payload.projectId }}" \
            -H "Cookie: access_token=${{ secrets.QA_PLATFORM_TOKEN }}" \
            -F "file=@allure-results.zip" \
            -F "runName=Rerun" \
            -F "parentRunId=${{ github.event.client_payload.parentRunId }}" \
            -F "projectId=${{ github.event.client_payload.projectId }}"
```

Para este ejemplo, establece la **CI trigger URL** en el perfil como:
```
https://api.github.com/repos/OWNER/REPO/dispatches
```
Y agrega las cabeceras de autorizacion en el campo CI Headers o usa `ciHeaders` en la API de ajustes.

---

## Paso 4 — Re-ejecutar tests desde la interfaz

1. Abre la pagina de detalle de un launch (**Launches** > haz clic en una ejecucion).
2. Cambia a la pestana **Tests**.
3. Selecciona los tests a re-ejecutar:
   - **Test individual**: haz clic en el icono de re-ejecucion junto al resultado del test.
   - **Tests seleccionados**: marca varios tests con las casillas de verificacion y luego haz clic en "Rerun selected".
   - **Todos los fallidos/rotos**: haz clic en "Rerun failed & broken".
4. Aparece un banner de progreso en la parte superior de la pagina mostrando el estado del trabajo de re-ejecucion.
5. Cuando el CI sube los resultados con `parentRunId`, los resultados de los tests en el launch actual se **actualizan automaticamente** — la pagina se refresca para mostrar los nuevos resultados.

---

## Como funciona (flujo de datos)

```
 UI: click "Rerun"
       |
       v
 Backend: create rerun job (status: queued)
       |
       v
 Backend: POST webhook to CI trigger URL
       |  (payload includes parentRunId, command, selectors)
       v
 CI: runs the command, produces allure-results
       |
       v
 CI: uploads ZIP to /upload/ci/allure-results
       |  with parentRunId in the form data
       v
 Backend: deletes old results (by test name) from parent run
 Backend: imports new results into the same run
       |
       v
 UI: polls rerun job status, refreshes page on completion
```

---

## Modos de ejecucion

### ci-webhook (recomendado)

La plataforma envia una solicitud POST a tu CI trigger URL. Tu CI ejecuta los tests y sube los resultados. Esta es la configuracion mas comun para equipos con pipelines de CI existentes.

### agent

La plataforma envia el comando a un servicio de agente local de re-ejecucion de tests (configurado a traves de la variable de entorno `TEST_RERUN_AGENT_ENDPOINT` en el backend). El agente ejecuta el comando localmente y sube los resultados. Util para desarrollo local o configuraciones on-premise sin CI compatible con webhooks.

Establece la variable de entorno en el backend:
```
TEST_RERUN_AGENT_ENDPOINT=http://localhost:4000/execute
```

---

## Solucion de problemas

| Sintoma | Causa | Solucion |
|---------|-------|----------|
| Error "Failed to start rerun job" en la interfaz | La tabla `test_rerun_job` no existe | Reinicia el backend — las migraciones se ejecutan automaticamente al iniciar |
| El trabajo de re-ejecucion permanece en estado "queued" | No hay perfil de ejecucion configurado o la CI trigger URL esta vacia | Ve a Settings > Test Rerun y configura un perfil con CI trigger URL |
| El estado del trabajo de re-ejecucion es "failed" con "CI webhook returned HTTP 4xx" | El CI rechazo el webhook | Verifica la CI trigger URL, las cabeceras de autorizacion y la configuracion del pipeline de CI |
| Los nuevos resultados aparecen en un launch separado | El CI subio los resultados sin `parentRunId` | Actualiza el script de CI para incluir `-F "parentRunId=..."` en la llamada de subida |
| "Agent endpoint is not configured" | Usando el modo `agent` sin la variable de entorno `TEST_RERUN_AGENT_ENDPOINT` | Establece la variable de entorno o cambia al modo `ci-webhook` |

---

## Referencia de la API (para scripts de integracion CI)

### Subida con fusion en ejecucion padre

```
POST /upload/ci/allure-results?projectId=<projectId>
Content-Type: multipart/form-data

Form fields:
  file          - Archivo ZIP con los allure-results
  runName       - Nombre para mostrar (se usa solo al crear una nueva ejecucion)
  parentRunId   - (opcional) ID de la ejecucion existente para fusionar
  projectId     - ID del proyecto
  environment   - (opcional) Etiqueta de entorno
  branch        - (opcional) Nombre de la rama
  tags          - (opcional) Array JSON de etiquetas
```

Cuando se proporciona `parentRunId`:
- No se crea una nueva ejecucion.
- Los resultados de tests anteriores con nombres coincidentes se eliminan de la ejecucion padre.
- Los nuevos resultados se importan en la ejecucion padre.

Cuando se omite `parentRunId`:
- Se crea una nueva ejecucion (comportamiento estandar de subida).
