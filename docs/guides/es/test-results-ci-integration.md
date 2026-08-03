# Enviar resultados de pruebas automatizadas a Veriqorn

Use esta guia para que cada ejecucion de pruebas automatizadas sea visible en Veriqorn. El trabajo de pruebas genera el directorio `allure-results`; el ultimo paso de CI lo empaqueta y lo envia a la plataforma.

## Elija un patron de integracion

| Patron | Recomendado para | Funcionamiento |
|---|---|---|
| Carga directa desde CI | La mayoria de equipos | Agregue un paso de carga despues del comando de pruebas. |
| Script o runner existente | Equipos con herramientas propias | Ejecute el mismo comando `curl` al generar los resultados. |
| Pipeline de Test Rerun | Reejecutar pruebas seleccionadas desde Veriqorn | Configure [Test Rerun](test-rerun-setup.md); su trabajo de CI carga los resultados en el lanzamiento original. |

Los dos primeros patrones crean un lanzamiento nuevo por ejecucion. Para una reejecucion, use `parentRunId` como se describe en la guia Test Rerun.

## Antes de empezar

- La plataforma esta en ejecucion y el runner de CI puede acceder a ella.
- El framework de pruebas escribe resultados de Allure en `allure-results/`.
- Guarde las credenciales del trabajo solo en el almacen de secretos de CI. No incluya credenciales, cookies ni archivos de resultados en el repositorio.

## Cargar despues de las pruebas

El endpoint de importacion normalizado acepta un archivo de resultados Allure o un archivo ZIP. Ejecute este paso despues de las pruebas; use `if: always()` o su equivalente para informar tambien las pruebas fallidas.

```bash
zip -r allure-results.zip allure-results/

curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/imports/allure-jobs" \
  -b "$VERIQORN_COOKIE_FILE" \
  -F "file=@allure-results.zip" \
  -F "runName=$CI_RUN_NAME" \
  -F "sourceKind=ci_archive" \
  -F "branch=$CI_BRANCH" \
  -F "environment=$CI_ENVIRONMENT"
```

Reemplace `default` por el ID de su proyecto. `runName` es la etiqueta mostrada en Veriqorn.

Para la configuracion inicial, cree el archivo de cookies mediante una solicitud de sesion:

```bash
curl --fail-with-body -c "$VERIQORN_COOKIE_FILE" \
  -X POST "$VERIQORN_URL/api/v1/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VERIQORN_EMAIL\",\"password\":\"$VERIQORN_PASSWORD\"}"
```

Use una cuenta dedicada no personal y guarde su contrasena en el almacen de secretos de CI.

## Ejemplo de GitHub Actions

Agregue los secretos `VERIQORN_URL`, `VERIQORN_EMAIL` y `VERIQORN_PASSWORD` en la configuracion del repositorio u organizacion.

```yaml
- name: Run tests
  run: npm test
  continue-on-error: true

- name: Upload Allure results to Veriqorn
  if: always()
  env:
    VERIQORN_URL: ${{ secrets.VERIQORN_URL }}
    VERIQORN_EMAIL: ${{ secrets.VERIQORN_EMAIL }}
    VERIQORN_PASSWORD: ${{ secrets.VERIQORN_PASSWORD }}
  run: |
    curl --fail-with-body -c veriqorn.cookies \
      -X POST "$VERIQORN_URL/api/v1/auth/session" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$VERIQORN_EMAIL\",\"password\":\"$VERIQORN_PASSWORD\"}"
    zip -r allure-results.zip allure-results/
    curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/imports/allure-jobs" \
      -b veriqorn.cookies \
      -F "file=@allure-results.zip" \
      -F "runName=${{ github.workflow }} #${{ github.run_number }}" \
      -F "sourceKind=ci_archive" \
      -F "branch=${{ github.ref_name }}"
```

Para GitLab CI, Jenkins, Azure Pipelines o un runner self-hosted, use los mismos comandos en `after_script`, una accion posterior a la compilacion o el ultimo paso del pipeline.

## Verificar y solucionar problemas

Abra **Lanzamientos** cuando termine el trabajo de CI. Deberia aparecer un lanzamiento nuevo con el nombre, rama y pruebas importadas.

| Sintoma | Que revisar |
|---|---|
| La carga se omite despues de una prueba fallida | Haga el paso incondicional (`if: always()`, `after_script` o equivalente). |
| Falta `allure-results` | Configure el reporter de pruebas y confirme que el directorio exista antes de comprimirlo. |
| Respuesta 401 o 403 | Revise las credenciales de CI y que el runner pueda acceder a la URL de la plataforma. |
| El lanzamiento aparece en otro proyecto | Reemplace `default` por el ID del proyecto correcto. |
