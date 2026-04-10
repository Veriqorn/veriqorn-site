# LLM Connection

The AI module uses an LLM for failure analysis explanations and coverage recommendations. Without an LLM configured, the system operates in **deterministic fallback mode** — it still returns structured results using lexical matching and heuristic scoring, but without natural-language explanations.

## Supported providers

| Provider | Model examples | Notes |
|----------|---------------|-------|
| OpenAI | `gpt-4.1-mini`, `gpt-4o` | Requires API key |
| Anthropic | `claude-sonnet-4-20250514` | Requires API key |
| Google Gemini | `gemini-2.5-pro` | Requires API key |
| Azure OpenAI | Your deployment name | Requires endpoint URL + API key |
| Local (Ollama) | `llama3`, `codellama` | Self-hosted, no API key needed |
| Local (LM Studio) | Any loaded model | Self-hosted, no API key needed |
| Custom API | Any OpenAI-compatible | Requires endpoint URL |

## Configuration via Settings UI

1. Open **Settings** in the sidebar
2. Go to the **AI Analysis** tab
3. In the **LLM connection** section, select your **Provider** from the dropdown
4. Fill in:
   - **Model** — the model identifier (e.g. `gpt-4.1-mini`)
   - **API Key** — your provider API key (leave empty for local models)
   - **Endpoint URL** — required for Azure, Ollama, LM Studio, or custom APIs
5. Configure **Analysis scope** checkboxes to control what the LLM is used for:
   - Summarize failed tests
   - Suggest likely root causes
   - Generate remediation steps
   - Include flaky test analysis
6. Click **Save LLM Settings**
7. Click **Test Connection** to verify the LLM is reachable — the result shows latency and model name

## Configuration via API

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

## Local LLM setup (Ollama)

If you prefer to run a local model:

```bash
# 1. Install Ollama (https://ollama.ai)
# 2. Pull a model
ollama pull llama3

# 3. Ollama runs on http://localhost:11434 by default
# 4. In Settings UI, select "Local (Ollama/LM Studio)"
#    - Endpoint URL: http://localhost:11434
#    - Model: llama3
```

## Local LLM setup (LM Studio)

[LM Studio](https://lmstudio.ai/) is a desktop app for running open-source LLMs locally with a built-in OpenAI-compatible API server.

### 1. Install and download a model

1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai/) (Windows, macOS, Linux)
2. Open the app, go to the **Discover** tab
3. Search for and download a model — recommended options for QA analysis:
   - `Qwen2.5-Coder-7B-Instruct` — good balance of speed and quality for code analysis
   - `Mistral-7B-Instruct` — general-purpose, fast
   - `CodeLlama-13B-Instruct` — stronger code understanding, needs more RAM
   - `Llama-3-8B-Instruct` — solid all-around

### 2. Start the local server

1. Go to the **Developer** tab (or **Local Server** in older versions)
2. Load your downloaded model
3. Click **Start Server**
4. By default the server runs at `http://localhost:1234`
5. Verify it's running:

```bash
curl http://localhost:1234/v1/models
# Should return a JSON list with your loaded model
```

### 3. Configure in QA Report Platform

**Via Settings UI:**

1. Open **Settings > AI Analysis**
2. Select provider: **Local (Ollama / LM Studio)**
3. Set:
   - **Endpoint URL:** `http://localhost:1234`
   - **Model:** the model identifier from `/v1/models` response (e.g. `qwen2.5-coder-7b-instruct`)
   - **API Key:** leave empty (not required for local server)
4. Click **Save LLM Settings**
5. Click **Test Connection** to verify — should show success with model name and latency

**Via API:**

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

### Tips

- **RAM requirements:** 7B models need ~8 GB RAM, 13B models need ~16 GB. Keep this in mind if running alongside the platform.
- **GPU acceleration:** LM Studio automatically uses your GPU if available (CUDA/Metal). This dramatically improves response times.
- **Context window:** For failure analysis with code context, a model with at least 4K context window is recommended. Most modern models support 8K+.
- **Docker note:** If the platform runs in Docker and LM Studio runs on the host, use `http://host.docker.internal:1234` as the endpoint URL instead of `localhost`.

## Deterministic fallback

When no LLM is configured, the system still works:

- **Failure analysis** — returns evidence-ranked results from the code index with heuristic root-cause hypotheses
- **Coverage scoring** — fully deterministic, does not use LLM
- **Coverage recommendations** — generates template-based scenario outlines from gap analysis

The model field in API responses will show `deterministic-fallback-v1` when operating without an LLM.

## Verifying the connection

After configuration, trigger a test analysis:

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

The `model` field in the response confirms which model was used.
