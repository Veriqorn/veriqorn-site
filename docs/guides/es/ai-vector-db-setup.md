# Configuracion de AI Vector DB (PostgreSQL + Qdrant)

Esta guia describe como configurar el almacenamiento de datos para la recuperacion con IA en QA Report Platform:

- **PostgreSQL** — la base de datos principal de la plataforma (configuraciones, catalogos, metadatos).
- **Qdrant** — una base de datos vectorial para recuperacion ANN/semantica (opcion orientada a produccion).

---

## 1) Que se almacena y donde

| Componente | Que almacena | Donde se utiliza |
|---|---|---|
| PostgreSQL | configuraciones del sistema, licencia, catalogo de indices | `settings`, `index/repositories`, `index/catalog` |
| Qdrant | vectores densos de chunks e indice ANN | `retrieve/evidence`, `failures/analyze` |

Claves de configuracion principales:
- `aiAnalysisRepositories`
- `aiAnalysisVectorProvider`
- `aiAnalysisIndexCatalog`
- `aiAnalysisLicense`

---

## 2) Requisitos previos

1. El backend (`http://localhost:3001`) y el frontend (`http://localhost:3000`) estan en ejecucion.
2. Se ha activado una licencia AI Pro (como minimo las funcionalidades `indexing` y `retrieval`).
3. `AI_ANALYSIS_MONOREPO_ROOT` esta configurado (la raiz del codigo fuente para la indexacion).

Consulte tambien:
- [Vision general del modulo de IA](./ai-module-overview.md)
- [Indexacion de repositorios](./ai-repository-indexing.md)
- [Activacion de la licencia Pro](./ai-pro-license.md)

---

## 3) PostgreSQL y supuestos de despliegue

Esta guia publica asume que la plataforma ya esta desplegada mediante el flujo self-hosted soportado.

Si utilizo `veriqorn-install/docker-compose.yml`, PostgreSQL ya esta incluido y el backend ya se conecta al servicio interno `postgres`. No se requiere configuracion adicional de PostgreSQL para esta guia.

Esta pagina no cubre flujos de desarrollo local basados en codigo fuente ni workflows internos de depuracion.

---

## 4) Instalar Qdrant

### Inicio rapido con Docker

```bash
docker volume create qdrant_storage

docker run -d \
  --name qa-qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant:v1.10.1
```

Verificacion de estado:

```bash
curl http://localhost:6333/healthz
```

Respuesta esperada:

```json
{"status":"ok"}
```

---

## 5) Configurar la recuperacion con IA

### 5.1 Especificar repositorios para indexacion

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      { "id": "backend", "name": "Backend", "url": "backend/src" },
      { "id": "frontend", "name": "Frontend", "url": "frontend" }
    ]
  }'
```

### 5.2 Elegir un proveedor de vectores

El servicio actualmente soporta los siguientes proveedores:
- `memory`
- `in-memory`
- `local-ann`
- `qdrant`

Ejemplo:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "memory" }'
```

Ejemplo para Qdrant:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "qdrant" }'
```

Si Qdrant o la red no estan disponibles, la recuperacion cambiara automaticamente a un fallback deterministico y agregara una advertencia en `warnings`.

### 5.2.1 Variables de entorno para el adaptador de Qdrant

```env
AI_ANALYSIS_QDRANT_URL=http://127.0.0.1:6333
AI_ANALYSIS_QDRANT_API_KEY=
AI_ANALYSIS_QDRANT_TIMEOUT_MS=3000
AI_ANALYSIS_QDRANT_COLLECTION_PREFIX=qa_report_ai
```

### 5.3 Ejecutar la indexacion

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

### 5.4 Verificar la recuperacion

```bash
curl -X POST http://localhost:3001/ai-analysis/retrieve/evidence \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "query": "timeout in payment retry middleware",
    "topK": 5,
    "minScore": 0.08
  }'
```

Campos clave a verificar en la respuesta:
- `vectorProvider`
- `fallbackUsed`
- `warnings`
- `rankingReasons`
- `scoreBreakdown`

---

## 6) Por que se eligio Qdrant (y no otra base de datos)

A continuacion se presenta la justificacion arquitectonica dedicada.

### Razones principales

1. **Amigable para self-hosting**
   - Facil de ejecutar (un solo contenedor), huella operacional simple.
   - Bien adaptado para despliegues on-prem y requisitos de residencia de datos.

2. **Fuerte enfoque en busqueda vectorial**
   - Qdrant fue disenado desde cero para ANN/HNSW, en lugar de ser un "complemento" de una base de datos OLTP.
   - Rendimiento predecible bajo cargas de trabajo de recuperacion.

3. **Filtrado de payload junto con vectores**
   - Filtrado conveniente de metadatos (repositorio, ruta, lenguaje, etiquetas) dentro de la misma consulta que realiza la busqueda por similitud.

4. **Escenario de rollback transparente**
   - En nuestra arquitectura, los problemas con el proveedor de vectores no causan que la recuperacion falle — en su lugar, retorna al fallback lexico.
   - Esto reduce el riesgo operacional durante el despliegue.

5. **Equilibrio entre funcionalidad, simplicidad y costo**
   - Para el escenario Pro self-hosted, ofrece un buen equilibrio sin una dependencia obligatoria de SaaS gestionado.

### Comparacion breve de alternativas

| Opcion | Ventajas | Limitaciones en nuestro contexto |
|---|---|---|
| **Qdrant** | Especializacion en ANN, filtros de payload, self-hosting simple | Requiere mantener un servicio vectorial separado |
| **pgvector (PostgreSQL)** | Una sola base de datos para todo, facil de comenzar | OLTP + busqueda vectorial intensa en un mismo footprint puede ser mas dificil de escalar |
| **OpenSearch kNN** | Ecosistema de stack potente | Mas pesado de operar para nuestro caso de uso |
| **Weaviate** | Capacidades ricas de ML | Huella operacional mayor de la necesaria en esta etapa |
| **Gestionado (Pinecone, etc.)** | Operaciones minimas | Dependencia de proveedor y requisitos de almacenamiento de datos externo |

---

## 7) Recomendacion practica de despliegue

1. Comience con `memory`/`local-ann` en staging.
2. Verifique la calidad de recuperacion y la latencia.
3. Despliegue Qdrant e incluyalo en el plan de despliegue.
4. En produccion, monitorice `fallbackUsed` y `warnings`.
5. Si ocurre degradacion, revierta rapidamente al fallback lexico mediante `aiAnalysisVectorProvider`.

Esto se alinea con el modelo actual para introducir de forma segura la recuperacion con IA en la plataforma.

---

## 8) Algoritmo de fragmentacion: como se divide el codigo

La implementacion actual utiliza un enfoque hibrido:

- **Fragmentacion heuristica con reconocimiento de AST** para TS/JS (division por limites de declaracion)
- **Fallback de ventana de caracteres** para otros archivos/casos

Flujo de trabajo basico:
1. El texto del archivo se normaliza para los saltos de linea (`\r\n` -> `\n`) y se recorta.
2. Para TS/JS, el indexador primero busca bloques de declaracion estructurales.
3. Si la ruta con reconocimiento de AST no es aplicable, se utiliza la fragmentacion por ventana de caracteres:
   - tamano de ventana = `chunkSizeChars`
   - paso = `chunkSizeChars - chunkOverlapChars`
4. Cada bloque no vacio se convierte en un chunk.

Ejemplo:
- `chunkSizeChars = 1200`
- `chunkOverlapChars = 180`
- paso = `1020`

Esto proporciona superposicion de contexto para que los fragmentos importantes en los limites de los chunks no se pierdan.

### Como se garantiza la estabilidad del indice

Se genera un `chunkId` deterministico para cada chunk basado en:
- `repositoryId`
- `filePath`
- `chunkIndex`
- `sha1` del propio chunk

Esto significa que dado el mismo codigo de entrada y parametros de indexacion, obtendra identificadores de chunk identicos.

### Que metadatos se adjuntan a un chunk

Ademas del texto, se almacenan los siguientes:
- `language` (determinado por la extension del archivo),
- `pathTokens` (tokens de ruta/segmento),
- `symbolHints` (pistas de simbolos: clases/funciones/llamadas),
- `chunkingMode`, `astEntityType`, `astEntityName`,
- `summary`, `summaryVersion`,
- `sha1`, `charCount`.

Estos campos se utilizan durante las etapas de ranking y explicabilidad.

Adicionalmente, el catalogo incluye un `symbolGraph` (nodos/aristas) para el canal de recuperacion por expansion de grafo.

---

## 9) Como funciona el ordenamiento y procesamiento de datos de recuperacion

A continuacion se presenta el pipeline de extremo a extremo para `POST /ai-analysis/retrieve/evidence`:

1. **Normalizacion de la consulta**
   - Conversion a minusculas y tokens.
   - Validacion de `topK`, `minScore`.

2. **Filtrado de candidatos**
   - Por `repositoryIds` y `filePathPrefixes` (si se proporcionan).

3. **Reconstruccion del texto del chunk**
   - Para los metadatos filtrados, el servicio lee el archivo y reconstruye el chunk por `chunkIndex`.

4. **Etapa BM25**
   - Relevancia lexica ponderada (BM25).

5. **Etapa vectorial (si el proveedor esta habilitado)**
   - Upsert de embeddings de candidatos.
   - Busqueda ANN sobre la consulta.
   - Timeouts en operaciones vectoriales + fallback de seguridad.
   - Si el proveedor no responde, no esta soportado o devuelve resultados vacios — se activa el fallback lexico.

6. **Canales de pistas y grafo**
   - Impulsos de `pathHints`/`symbolHints`,
   - expansion de grafo mediante `symbolGraph`.

7. **Fusion RRF**
   - Reciprocal Rank Fusion combina todos los canales activos.

8. **Reranker opcional**
   - Etapa adicional de reranking (proveedor heuristico/http).

9. **Umbral y explicabilidad**
   - Filtrado por `minScore`.
   - Generacion de:
     - `rankingReasons[]`
     - `scoreBreakdown { lexical/bm25, vector, pathBoost, symbolBoost, graphBoost, fusion, rerank, final }`

10. **Ordenamiento deterministico**
   - Primero por puntuacion (descendente),
   - luego desempates: `repositoryId` -> `filePath` -> `chunkIndex`.

11. **Observabilidad**
   - La respuesta incluye `stageFlags` y `stageTimingsMs`.

Esto es importante para la reproducibilidad: dados los mismos datos de entrada, el ordenamiento es estable.

---

## 10) Es cierto que construir un algoritmo universal para todos los proyectos es dificil?

**Respuesta corta: si, lo es.**

La razon es que la relevancia depende en gran medida de:
- el lenguaje (TS/Java/Python/Go, etc.),
- el framework (Spring/Nest/React, etc.),
- el estilo arquitectonico (monolito/microservicios),
- el estilo de codificacion del equipo (convenciones de nomenclatura, tamano de archivos, profundidad de abstracciones).

Por lo tanto, un chunker/ranker "ideal" es tipicamente **configurable** en lugar de universal.

Lo que se puede hacer de forma universal:
- proporcionar una linea base segura,
- garantizar la explicabilidad,
- agregar metricas de calidad y ajuste iterativo.

Asi es exactamente como esta disenado el modulo actual.

---

## 11) Como ajustar la recuperacion para su proyecto

A continuacion se presentan las palancas practicas de ajuste.

### 11.1 Parametros de fragmentacion

- Aumente `chunkSizeChars` (ej. 1400-2000) si:
  - el codigo frecuentemente se extiende en bloques largos,
  - el contexto importante no cabe en 1200 caracteres.

- Aumente `chunkOverlapChars` (ej. 220-320) si:
  - muchas coincidencias relevantes se pierden en los limites de los chunks.

- Disminuya el tamano del chunk (800-1100) si:
  - los archivos son muy densos,
  - los resultados son frecuentemente demasiado "difusos" en cobertura tematica.

### 11.2 Configuracion de busqueda

- `topK`:
  - interfaz de triaje tipicamente 5-8,
  - para diagnostico profundo 10-15.

- `minScore`:
  - aumente (ej. a 0.12-0.18) para reducir el ruido,
  - disminuya (0.05-0.08) si se estan perdiendo chunks relevantes.

### 11.3 Alcance del repositorio

- Mantenga `aiAnalysisRepositories` preciso (sin directorios innecesarios).
- Excluya areas ruidosas (`generated`, artefactos temporales, codigo de terceros).

### 11.4 Pistas de senales de fallo

- Cuanto mejores sean los `pathHints` y `symbolHints`, mejor sera el ranking.
- Para stack traces no estandar, es util enriquecer/normalizar las reglas del parser.

### 11.5 Evaluar la calidad despues de cada iteracion de ajuste

Utilice el arnes de evaluacion:
- `precision`
- `rootCausePrecision`
- `recallAtK`
- `rankingStability`
- `ndcgAtK`
- `mrr`
- `averageLatencyMs`

El ajuste se considera exitoso si `recallAtK`/`precision` mejoraron mientras que `rankingStability` no se degradó significativamente.

### 11.6 Estrategia recomendada

1. Establezca una linea base con casos de fallo reales.
2. Cambie un parametro a la vez.
3. Ejecute la evaluacion sobre el mismo conjunto de datos.
4. Consolide los cambios solo cuando haya una mejora medible.
