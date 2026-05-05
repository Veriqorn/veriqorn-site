# Indexado de Repositorios

El indexado de repositorios escanea el codigo fuente de tu proyecto, aplica fragmentacion con reconocimiento de AST (heuristica) para archivos de codigo y construye un catalogo de busqueda. Este catalogo se utiliza para:

- **Analisis de fallos** — encontrar codigo relevante cuando un test falla
- **Inteligencia de cobertura** — mapear tests a unidades de cobertura conscientes del codigo

## Requisitos previos

- Licencia AI Pro activa ([ver guia de activacion](./ai-pro-license.md))
- Token de funcionalidad `indexing` en tu licencia

## Paso 1. Establecer la raiz del monorepo

Indica a la plataforma donde se encuentra tu codigo fuente:

```env
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project
```

Este es el directorio base desde el cual se resuelven las rutas relativas de los repositorios. Si no se establece, se utiliza por defecto el directorio de trabajo del proceso backend.

En una instalacion self-hosted con Docker, configure este valor en el entorno del despliegue del contenedor backend. Debe apuntar al directorio del servidor donde los repositorios fuente estan disponibles para indexacion.

## Paso 2. Registrar repositorios

Los repositorios definen el alcance de lo que se indexa. Registralos a traves de la interfaz de Settings o la API:

### A traves de la interfaz de Settings

1. Abre **Settings > AI Analysis**
2. En la seccion **Repository Context**, haz clic en **Add Repository**
3. Completa los campos:
   - **ID** — identificador unico (por ejemplo, `backend`, `frontend`)
   - **Name** — nombre legible
   - **Path/URL** — ruta relativa desde la raiz del monorepo (por ejemplo, `backend/src`)
4. Guarda los cambios

### A traves de la API

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      { "id": "backend", "name": "Backend", "url": "backend/src" },
      { "id": "frontend", "name": "Frontend", "url": "frontend" },
      { "id": "tests", "name": "E2E Tests", "url": "test" }
    ]
  }'
```

## Paso 3. Ejecutar el indexado

### A traves de la API

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

Con parametros personalizados:

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "repositoryIds": ["backend"],
    "chunkSizeChars": 1500,
    "chunkOverlapChars": 200,
    "maxFileSizeBytes": 500000
  }'
```

### Respuesta

```json
{
  "status": "ready",
  "generatedAt": "2025-06-15T10:30:00Z",
  "repositories": [
    {
      "repositoryId": "backend",
      "repositoryName": "Backend",
      "status": "indexed",
      "indexedFiles": 87,
      "skippedFiles": 3,
      "chunkCount": 142,
      "errors": []
    }
  ],
  "totalChunks": 142,
  "totalIndexedFiles": 87,
  "totalSkippedFiles": 3,
  "catalogKey": "aiAnalysisIndexCatalog"
}
```

## Parametros de indexado

| Parametro | Valor por defecto | Rango | Descripcion |
|-----------|-------------------|-------|-------------|
| `chunkSizeChars` | 1200 | 200–4000 | Caracteres por fragmento |
| `chunkOverlapChars` | 180 | 0–(chunkSize-1) | Solapamiento entre fragmentos adyacentes |
| `maxFileSizeBytes` | 200,000 | 1,024–2,000,000 | Omitir archivos mayores a este tamano |

## Que se indexa

**Extensiones de archivo incluidas:**
`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.json`, `.yml`, `.yaml`, `.md`, `.sql`, `.ps1`, `.sh`

**Directorios ignorados:**
`node_modules`, `.git`, `.next`, `.turbo`, `dist`, `build`, `coverage`, `artifacts`, `allure-results`, `uploads`, `temp`

**Limite por repositorio:** 2,000 archivos como maximo.

## Ver el catalogo del indice

```bash
curl http://localhost:3001/ai-analysis/index/catalog \
  -b "auth_token=<jwt>"
```

Devuelve el catalogo completo con metadatos de fragmentos por archivo, util para depuracion.

A partir del EPIC-603, los metadatos del catalogo tambien incluyen:

- `schemaVersion`
- `chunkingMode` (`char-window` o `ast-heuristic`)
- Campos de resumen semantico (`summary`, `summaryVersion`)
- Grafo de simbolos (`symbolGraph.nodes`, `symbolGraph.edges`)

## Re-indexado

Ejecuta `POST /ai-analysis/index/repositories` de nuevo en cualquier momento. El catalogo se reemplaza completamente en cada ejecucion. No hay indexado incremental — cada ejecucion re-escanea todo el alcance.

**Cuando re-indexar:**
- Despues de cambios significativos en el codigo
- Despues de agregar nuevos repositorios
- Despues de cambiar los parametros de fragmentacion

## Recuperacion

Una vez indexado, el catalogo es utilizado automaticamente por:

- `POST /ai-analysis/failures/analyze` — encuentra codigo relevante para el contexto del fallo
- `POST /ai-analysis/retrieve/evidence` — busqueda directa de evidencia

### Probar la recuperacion

```bash
curl -X POST http://localhost:3001/ai-analysis/retrieve/evidence \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "query": "upload allure results timeout",
    "topK": 5,
    "minScore": 0.1
  }'
```

### Parametros de recuperacion

| Parametro | Valor por defecto | Maximo | Descripcion |
|-----------|-------------------|--------|-------------|
| `topK` | 5 | 25 | Numero de resultados a devolver |
| `minScore` | 0.08 | - | Umbral minimo de relevancia (0–1) |
| `repositoryIds` | todos | - | Filtrar por repositorios especificos |
| `filePathPrefixes` | ninguno | - | Filtrar por directorios especificos |
| `stageOverrides` | ninguno | - | Activar/desactivar etapas por solicitud: `bm25`, `vector`, `graphExpansion`, `rerank`, `summaries` |

La respuesta de recuperacion ahora incluye:

- `stageFlags` — flags de tiempo de ejecucion resueltos para las etapas de recuperacion
- `stageTimingsMs` — diagnosticos de tiempo de ejecucion por etapa

## Proveedor de vectores

Por defecto, la recuperacion utiliza un **fallback lexico** (coincidencia basada en tokens).

Proveedores de tiempo de ejecucion disponibles actualmente:
- `memory`
- `in-memory`
- `local-ann`
- `qdrant`

Configura el proveedor a traves de setting/API:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "memory" }'
```

Para planificacion en produccion con topologia Qdrant y PostgreSQL, consulta:
- [Configuracion de AI Vector DB (PostgreSQL + Qdrant)](./ai-vector-db-setup.md)

Ejemplo de despliegue gradual (con comportamiento de fallback seguro):

```env
AI_ANALYSIS_VECTOR_PROVIDER=qdrant
```

Cuando un proveedor configurado no esta disponible, el sistema recurre automaticamente a la coincidencia lexica y agrega una advertencia a la respuesta.
