# Modulo de IA — Vision general

QA Report Platform incluye un modulo de IA opcional que agrega analisis inteligente de fallos, puntuacion de cobertura de pruebas basada en codigo y recomendaciones automatizadas de brechas.

## Ediciones

| Funcionalidad | Basic (OSS) | Pro |
|---------------|-------------|-----|
| Ingesta de Allure y lanzamientos | Si | Si |
| Dashboard y analiticas | Si | Si |
| Notificaciones (Slack/Telegram/Webhook) | Si | Si |
| Multi-proyecto y control de acceso | Si | Si |
| Reejecucion selectiva de pruebas | Si | Si |
| Analisis de fallos con IA | - | Si |
| Indexacion y recuperacion de repositorios | - | Si |
| Conectores de evidencia (Kibana/Sentry/Grafana) | - | Si |
| Inteligencia de cobertura | - | Si |

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│                  Frontend                        │
│  Settings UI · Failure Panel · Coverage Page     │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│                  Backend                         │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Edition Gate │→ │ Indexing · Retrieval      │  │
│  │ (License)    │  │ Connectors · Analysis     │  │
│  └──────────────┘  │ Coverage Intelligence     │  │
│                    └──────────────────────────┘  │
│                         │                        │
│                    ┌────▼─────┐                   │
│                    │ Settings │  (PostgreSQL)     │
│                    └──────────┘                   │
└──────────────────────────────────────────────────┘
```

## Guias

1. [Activar licencia Pro](./ai-pro-license.md) — habilitar funcionalidades de IA
2. [Conexion LLM](./ai-llm-connection.md) — conectar un proveedor de LLM
3. [Indexacion de repositorios](./ai-repository-indexing.md) — indexar su base de codigo
4. [Auto-indexacion](./ai-auto-indexing.md) — re-indexacion automatica en commits
5. [Chat de base de conocimiento](./ai-knowledge-base-chat.md) — haga preguntas sobre su codigo
6. [Servidor MCP](./ai-mcp-server.md) — consulte codigo desde Claude Code / VS Code
7. [Conectores de evidencia](./ai-evidence-connectors.md) — conectar Kibana, Sentry, Grafana
8. [Inteligencia de cobertura](./ai-coverage-intelligence.md) — configurar la puntuacion de cobertura de pruebas
9. [Configuracion de AI Vector DB (PostgreSQL + Qdrant)](./ai-vector-db-setup.md) — instalar y configurar el almacenamiento de recuperacion vectorial
10. [Arquitectura de recuperacion hibrida](../architecture/ai-retrieval-hybrid-architecture.md) — limites de etapas, interfaces conectables, modelo de migracion
11. [Despliegue de recuperacion hibrida](../rollout/ai-hybrid-retrieval-rollout.md) — habilitacion por etapas y procedimiento de rollback

## Inicio rapido

```bash
# 1. Set environment variables in backend .env
AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project

# 2. Configure license via API or Settings UI
POST /settings/aiAnalysisLicense
{ "value": { "payload": {...}, "signature": "..." } }

# 3. Verify capabilities
GET /ai-analysis/capabilities
# → { "licensed": true, "features": { "analysis": { "enabled": true }, ... } }

# 4. Index your repositories
POST /ai-analysis/index/repositories

# 5. Open Coverage Intelligence page in UI
# → /projects/{projectId}/coverage
```

## Operaciones de recuperacion (Vector + Fallback)

Despliegue recomendado para Pro self-hosted:
1. Comience con `aiAnalysisVectorProvider=lexical-fallback`.
2. Re-indexe los repositorios despues de habilitar los metadatos de chunks con reconocimiento de codigo.
3. Cambie a un proveedor de vectores soportado en staging (`memory`, `in-memory`, `local-ann`).
4. Valide la relevancia de la recuperacion y la latencia bajo cargas de trabajo con pruebas fallidas.
5. Monitorice la proporcion de fallback y las advertencias antes del despliegue en produccion.

Stack de recuperacion hibrida actual:
- Canal lexico BM25
- Canal ANN/vectorial (incluyendo `qdrant`)
- Canales de pistas de ruta/simbolo
- Canal de expansion de grafo de simbolos
- Etapa de reranking opcional
- Reciprocal Rank Fusion (RRF) para la fusion de canales

Valores por defecto de seguridad:
- Las operaciones ANN vectoriales estan protegidas por timeouts del proveedor.
- Ante errores/timeouts del proveedor o coincidencias ANN vacias, la recuperacion retorna automaticamente al modo lexico deterministico.
- Los logs de recuperacion registran el modo del proveedor, uso de fallback y conteos de candidatos/coincidencias para diagnostico.

Rollback:
- Establezca `aiAnalysisVectorProvider=lexical-fallback`.
- Re-ejecute la indexacion si el esquema del indice cambio entre versiones.
