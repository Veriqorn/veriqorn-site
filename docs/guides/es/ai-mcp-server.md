# Servidor MCP para Integración con IDE

La plataforma expone un servidor MCP (Model Context Protocol) que permite a los desarrolladores consultar el código indexado directamente desde Claude Code, VS Code y otras herramientas compatibles con MCP. Esto reduce el consumo de tokens aprovechando el código pre-indexado en lugar de releer archivos en cada sesión.

## Requisitos previos

- Licencia AI Pro activa ([ver guía de activación](./ai-pro-license.md))
- Al menos un repositorio indexado ([ver guía de indexación](./ai-repository-indexing.md))
- Conexión LLM configurada para la herramienta `ask_about_code` ([ver configuración LLM](./ai-llm-connection.md))

## Paso 1. Crear una clave API

Los clientes MCP se autentican mediante claves API (no cookies de navegador).

### Vía UI de configuración

1. Abra **Settings > API Keys**
2. Haga clic en **Create API Key**
3. Ingrese un nombre (ej: "Claude Code")
4. Opcionalmente establezca una fecha de expiración
5. **Copie la clave inmediatamente** — solo se muestra una vez

### Vía API

```bash
curl -X POST http://localhost:3001/profile/api-keys \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "name": "Claude Code" }'
```

## Paso 2. Conectar desde su IDE

### Claude Code / Claude Desktop

Agregue a su configuración MCP:

```json
{
  "mcpServers": {
    "qa-platform": {
      "url": "http://your-server:3001/mcp/sse",
      "headers": {
        "Authorization": "Bearer qarp_su_clave_api"
      }
    }
  }
}
```

## Herramientas disponibles

### `search_code`

Búsqueda semántica sobre el código indexado. Retorna fragmentos relevantes con rutas de archivos y puntuaciones de relevancia.

### `ask_about_code`

Preguntas y respuestas basadas en RAG. Recupera contexto de código y genera una respuesta usando su LLM.

### `get_file_context`

Obtiene contexto indexado para un archivo o símbolo específico.

### `list_indexed_files`

Lista todos los archivos indexados con filtrado opcional por prefijo de ruta.

## Seguridad

- Las claves API se hashean con SHA-256 antes de almacenarse
- Las claves pueden tener fecha de expiración
- Cada clave está vinculada al usuario que la creó
- Las claves revocadas se rechazan inmediatamente

## Gestión de claves

```bash
# Listar claves
curl http://localhost:3001/profile/api-keys -b "auth_token=<jwt>"

# Revocar clave
curl -X DELETE http://localhost:3001/profile/api-keys/1 -b "auth_token=<jwt>"
```

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| "Authentication failed" | Clave inválida o expirada | Cree una nueva clave en Settings > API Keys |
| Herramientas no disponibles | Servidor no responde | Verifique la URL y que la plataforma esté ejecutándose |
| Resultados de búsqueda vacíos | Código no indexado | Ejecute la indexación primero |

## Guías relacionadas

- [Indexación de repositorios](./ai-repository-indexing.md)
- [Chat de base de conocimiento](./ai-knowledge-base-chat.md) — alternativa web
- [Auto-indexación](./ai-auto-indexing.md) — mantener el índice actualizado
