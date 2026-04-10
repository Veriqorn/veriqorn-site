# Conexion LLM

El modulo de IA utiliza un LLM para las explicaciones del analisis de fallos y las recomendaciones de cobertura. Sin un LLM configurado, el sistema opera en **modo de fallback deterministico** — aun devuelve resultados estructurados utilizando coincidencia lexica y puntuacion heuristica, pero sin explicaciones en lenguaje natural.

## Proveedores soportados

| Proveedor | Ejemplos de modelos | Notas |
|-----------|---------------------|-------|
| OpenAI | `gpt-4.1-mini`, `gpt-4o` | Requiere API key |
| Anthropic | `claude-sonnet-4-20250514` | Requiere API key |
| Google Gemini | `gemini-2.5-pro` | Requiere API key |
| Azure OpenAI | Nombre de su despliegue | Requiere URL de endpoint + API key |
| Local (Ollama) | `llama3`, `codellama` | Self-hosted, no requiere API key |
| Local (LM Studio) | Cualquier modelo cargado | Self-hosted, no requiere API key |
| API personalizada | Cualquier compatible con OpenAI | Requiere URL de endpoint |

## Configuracion mediante la interfaz de Settings

1. Abra **Settings** en la barra lateral
2. Vaya a la pestana **AI Analysis**
3. En la seccion **LLM connection**, seleccione su **Provider** del menu desplegable
4. Complete:
   - **Model** — el identificador del modelo (ej. `gpt-4.1-mini`)
   - **API Key** — su API key del proveedor (deje vacio para modelos locales)
   - **Endpoint URL** — requerido para Azure, Ollama, LM Studio o APIs personalizadas
5. Configure las casillas de **Analysis scope** para controlar para que se utiliza el LLM:
   - Resumir pruebas fallidas
   - Sugerir causas raiz probables
   - Generar pasos de remediacion
   - Incluir analisis de pruebas inestables (flaky)
6. Haga clic en **Save LLM Settings**
7. Haga clic en **Test Connection** para verificar que el LLM es accesible — el resultado muestra la latencia y el nombre del modelo

## Configuracion mediante API

```bash
# Save full LLM connection settings
curl -X POST http://localhost:3001/settings/aiLlmConnection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": {
      "provider": "openai",
      "model": "gpt-4.1-mini",
      "apiKey": "sk-...",
      "endpointUrl": "",
      "analysisScope": {
        "summarizeFailedTests": true,
        "suggestRootCauses": true,
        "generateRemediation": false,
        "flakyTestAnalysis": false
      }
    }
  }'

# Test the connection
curl -X POST http://localhost:3001/ai-analysis/llm/test-connection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>"
```

## Configuracion de LLM local (Ollama)

Si prefiere ejecutar un modelo local:

```bash
# 1. Install Ollama (https://ollama.ai)
# 2. Pull a model
ollama pull llama3

# 3. Ollama runs on http://localhost:11434 by default
# 4. In Settings UI, select "Local (Ollama/LM Studio)"
#    - Endpoint URL: http://localhost:11434
#    - Model: llama3
```

## Configuracion de LLM local (LM Studio)

[LM Studio](https://lmstudio.ai/) es una aplicacion de escritorio para ejecutar LLMs de codigo abierto localmente con un servidor API integrado compatible con OpenAI.

### 1. Instalar y descargar un modelo

1. Descargue LM Studio desde [lmstudio.ai](https://lmstudio.ai/) (Windows, macOS, Linux)
2. Abra la aplicacion, vaya a la pestana **Discover**
3. Busque y descargue un modelo — opciones recomendadas para analisis de QA:
   - `Qwen2.5-Coder-7B-Instruct` — buen equilibrio entre velocidad y calidad para analisis de codigo
   - `Mistral-7B-Instruct` — proposito general, rapido
   - `CodeLlama-13B-Instruct` — mayor comprension de codigo, requiere mas RAM
   - `Llama-3-8B-Instruct` — solido en general

### 2. Iniciar el servidor local

1. Vaya a la pestana **Developer** (o **Local Server** en versiones anteriores)
2. Cargue el modelo descargado
3. Haga clic en **Start Server**
4. Por defecto, el servidor se ejecuta en `http://localhost:1234`
5. Verifique que esta en ejecucion:

```bash
curl http://localhost:1234/v1/models
# Should return a JSON list with your loaded model
```

### 3. Configurar en QA Report Platform

**Mediante la interfaz de Settings:**

1. Abra **Settings > AI Analysis**
2. Seleccione proveedor: **Local (Ollama / LM Studio)**
3. Configure:
   - **Endpoint URL:** `http://localhost:1234`
   - **Model:** el identificador del modelo de la respuesta de `/v1/models` (ej. `qwen2.5-coder-7b-instruct`)
   - **API Key:** deje vacio (no requerido para servidor local)
4. Haga clic en **Save LLM Settings**
5. Haga clic en **Test Connection** para verificar — deberia mostrar exito con el nombre del modelo y la latencia

**Mediante API:**

```bash
curl -X POST http://localhost:3001/settings/aiLlmConnection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": {
      "provider": "local",
      "model": "qwen2.5-coder-7b-instruct",
      "apiKey": "",
      "endpointUrl": "http://localhost:1234"
    }
  }'
```

### Consejos

- **Requisitos de RAM:** Los modelos de 7B necesitan ~8 GB de RAM, los modelos de 13B necesitan ~16 GB. Tengalo en cuenta si ejecuta la plataforma simultaneamente.
- **Aceleracion por GPU:** LM Studio utiliza automaticamente su GPU si esta disponible (CUDA/Metal). Esto mejora drasticamente los tiempos de respuesta.
- **Ventana de contexto:** Para analisis de fallos con contexto de codigo, se recomienda un modelo con al menos 4K de ventana de contexto. La mayoria de los modelos modernos soportan 8K+.
- **Nota sobre Docker:** Si la plataforma se ejecuta en Docker y LM Studio se ejecuta en el host, use `http://host.docker.internal:1234` como URL de endpoint en lugar de `localhost`.

## Fallback deterministico

Cuando no hay un LLM configurado, el sistema sigue funcionando:

- **Analisis de fallos** — devuelve resultados clasificados por evidencia desde el indice de codigo con hipotesis heuristicas de causa raiz
- **Puntuacion de cobertura** — completamente deterministico, no utiliza LLM
- **Recomendaciones de cobertura** — genera esquemas de escenarios basados en plantillas a partir del analisis de brechas

El campo model en las respuestas de la API mostrara `deterministic-fallback-v1` cuando opera sin un LLM.

## Verificar la conexion

Despues de la configuracion, ejecute un analisis de prueba:

```bash
curl -X POST http://localhost:3001/ai-analysis/failures/analyze \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "runId": 1,
    "resultId": "test-uuid",
    "failureMessage": "Expected 200 but got 500"
  }'
```

El campo `model` en la respuesta confirma que modelo fue utilizado.
