# Inteligencia de Cobertura

La Inteligencia de Cobertura proporciona una vista a nivel de proyecto de la calidad de cobertura de tests utilizando unidades conscientes del codigo, senales de evidencia y puntuacion ponderada — sin requerir trazabilidad estricta de requisito a test.

## Requisitos previos

- Licencia AI Pro activa ([ver guia de activacion](./ai-pro-license.md))
- Indexado de repositorios configurado ([ver guia de indexado](./ai-repository-indexing.md)) — recomendado pero no obligatorio

## Conceptos

### Unidades de cobertura

En lugar de medir la cobertura solo por cantidad de tests, el sistema define **unidades de cobertura** — elementos significativos que deberian ser probados:

| Tipo | Ejemplo | Formato de clave |
|------|---------|------------------|
| `api_endpoint` | CI Upload Allure Results | `POST:/upload/ci/allure-results` |
| `ui_flow` | Launch detail page | `launches.open-details` |
| `domain_operation` | Notification dispatch | `notifications.dispatch-on-run-complete` |

Cada unidad tiene un `moduleKey` (area funcional), un flag `isCritical` y un `owner` opcional.

### Senales de evidencia

Cada unidad se evalua contra 6 senales, cada una normalizada a `[0..1]`:

| Senal | Que mide |
|-------|----------|
| `codePresence` | La unidad existe en el inventario de codigo actual |
| `testPresence` | Al menos un test automatizado esta mapeado a la unidad |
| `executionFreshness` | Los tests mapeados fueron ejecutados recientemente |
| `executionStability` | Los tests mapeados son estables (baja tasa de flakiness/fallos) |
| `assertionDepth` | Existen aserciones tanto de camino feliz como de error/negativo |
| `incidentLink` | Incidentes o defectos vinculados a esta unidad |

### Formula de puntuacion

Cobertura por unidad:

```
effectiveCoverage = 0.25×codePresence + 0.30×testPresence
                  + 0.20×executionFreshness + 0.15×executionStability
                  + 0.10×assertionDepth
```

Puntuacion a nivel de proyecto (ajustada por riesgo):

```
projectCoverageScore = 100 × Σ(unitCoverage × riskWeight) / Σ(riskWeight)
```

### Confianza

Cada unidad tambien tiene una puntuacion de confianza basada en la completitud de la evidencia, la precision del mapeo y la actualidad de los datos. Esto indica cuanto confiar en el numero de cobertura:

- **Alta** (>=75%) — evidencia solida, puntuacion fiable
- **Media** (50–74%) — evidencia parcial, direccionalmente util
- **Baja** (<50%) — evidencia limitada, usar como punto de partida

## Primeros pasos

### 1. Abrir la pagina de Cobertura

Navega a **Coverage** en la barra lateral (visible solo con licencia Pro), o accede a:

```
/projects/{projectId}/coverage
```

### 2. Reconstruir el inventario

Haz clic en **Rebuild Inventory**. Esto:

- Cataloga todas las unidades de cobertura desde la superficie de API de la plataforma, flujos de UI y operaciones de dominio
- Consulta el historial reciente de ejecuciones de tests para el proyecto activo
- Calcula las senales de evidencia para cada unidad basandose en coincidencia heuristica de nombres de tests

### 3. Revisar el panel de control

Despues de la reconstruccion, veras:

- **Coverage Score** — porcentaje general de cobertura del proyecto
- **Units** — cuantas unidades tienen cobertura adecuada
- **Confidence** — que tan fiable es la puntuacion
- **Gaps** — numero de unidades con cobertura insuficiente

### 4. Explorar el desglose por modulos

La seccion **Module Breakdown** muestra la cobertura por area funcional (upload, auth, dashboard, etc.), para que puedas identificar que modulos necesitan atencion.

### 5. Revisar las principales brechas

La seccion **Top Coverage Gaps** lista las unidades ordenadas por prioridad:

- **Critical** — baja cobertura + alto peso de riesgo (funcionalidad critica, sin tests)
- **High** — por debajo del umbral + riesgo significativo
- **Medium/Low** — por debajo del umbral, menor riesgo

Haz clic en una brecha para expandirla y ver los detalles de la unidad (ID, peso de riesgo, cobertura efectiva).

### 6. Generar recomendaciones con IA

Haz clic en **Generate Recommendations** para obtener sugerencias asistidas por IA sobre que probar a continuacion. Cada recomendacion incluye:

- **Priority** — alineada con la severidad de la brecha
- **Risk reason** — por que esta unidad es de alto riesgo
- **Coverage reason** — que falta (sin tests, aserciones debiles, ejecucion obsoleta)
- **Suggested scenario** — un esquema Given/When/Then para un nuevo test
- **Estimated impact** — mejora proyectada en cobertura y confianza

## Referencia de la API

Todos los endpoints requieren autenticacion JWT y una licencia Pro activa.

### Reconstruir inventario

```bash
POST /test-coverage/inventory/rebuild?projectId={id}
```

### Obtener inventario

```bash
GET /test-coverage/inventory?projectId={id}
```

### Obtener resumen de cobertura

```bash
GET /test-coverage/summary?projectId={id}
```

Respuesta:

```json
{
  "projectCoverageScore": 42.5,
  "totalUnits": 28,
  "coveredUnits": 12,
  "projectConfidence": 0.58,
  "confidenceBand": "medium",
  "generatedAt": "2025-06-15T10:30:00Z"
}
```

### Obtener desglose por modulos

```bash
GET /test-coverage/modules?projectId={id}
```

### Obtener brechas de cobertura

```bash
GET /test-coverage/gaps?projectId={id}
```

### Generar recomendaciones

```bash
POST /test-coverage/recommendations/generate?projectId={id}
```

### Obtener recomendaciones almacenadas

```bash
GET /test-coverage/recommendations?projectId={id}
```

## Personalizar los pesos de puntuacion

Los pesos por defecto pueden sobreescribirse a traves de Settings:

```bash
curl -X POST http://localhost:3001/settings/testCoverageScoringWeights \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": {
      "codePresence": 0.15,
      "testPresence": 0.40,
      "executionFreshness": 0.20,
      "executionStability": 0.15,
      "assertionDepth": 0.10
    }
  }'
```

Despues de cambiar los pesos, reconstruye el inventario y vuelve a consultar el resumen — las puntuaciones reflejaran la nueva ponderacion.

## Limitaciones actuales

- **Las unidades de cobertura son definidas por la plataforma** — el catalogo cubre la superficie propia de QA Report Platform (APIs, flujos de UI, operaciones de dominio). La definicion de unidades personalizadas esta planificada.
- **El mapeo de tests es heuristico** — los tests se asocian a las unidades mediante coincidencia de palabras clave en los nombres de los tests. Las anotaciones explicitas de test a unidad estan planificadas.
- **Sin actualizaciones incrementales** — reconstruir el inventario re-escanea todo. Las actualizaciones incrementales de evidencia estan planificadas.
- **Las recomendaciones son basadas en plantillas** — cuando no hay un LLM configurado, los escenarios usan plantillas estructuradas. Con un LLM conectado, se generan sugerencias mas ricas en lenguaje natural.

## Referencia completa del contrato

Consulta las formulas detalladas de puntuacion, pesos de riesgo y modelo de confianza en:

```
docs/contracts/test-coverage-intelligence-contract.md
```
