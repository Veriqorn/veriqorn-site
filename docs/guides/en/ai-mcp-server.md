# MCP Server for IDE Integration

The platform exposes an MCP (Model Context Protocol) server that lets developers query the indexed codebase directly from Claude Code, VS Code, and other MCP-compatible tools. This reduces token usage by leveraging the pre-indexed code instead of re-reading files on every session.

## Prerequisites

- AI Pro license active ([see activation guide](./ai-pro-license.md))
- At least one repository indexed ([see indexing guide](./ai-repository-indexing.md))
- LLM connection configured for `ask_about_code` tool ([see LLM setup](./ai-llm-connection.md))

## Step 1. Create an API key

MCP clients authenticate via API keys (not browser cookies).

### Via Settings UI

1. Open **Settings > API Keys**
2. Click **Create API Key**
3. Enter a name (e.g., "Claude Code")
4. Optionally set an expiration date
5. **Copy the key immediately** — it is shown only once

### Via API

```bash
curl -X POST http://localhost:3001/profile/api-keys \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "name": "Claude Code" }'
```

Response:

```json
{
  "id": 1,
  "key": "qarp_a1b2c3d4e5f6...",
  "keyPrefix": "qarp_a1b2c3",
  "name": "Claude Code",
  "createdAt": "2026-04-08T10:00:00Z"
}
```

## Step 2. Connect from your IDE

### Claude Code / Claude Desktop

Add to your MCP configuration (`settings.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "qa-platform": {
      "url": "http://your-server:3001/mcp/sse",
      "headers": {
        "Authorization": "Bearer qarp_your_api_key_here"
      }
    }
  }
}
```

### VS Code (with MCP extension)

Configure the MCP server in your extension settings with the same URL and authorization header.

## Available tools

Once connected, the following tools are available:

### `search_code`

Semantic search over the indexed codebase. Returns relevant code snippets with file paths and relevance scores.

```
Input: { "query": "JWT token validation", "topK": 5 }
```

### `ask_about_code`

RAG-powered Q&A. Retrieves relevant code context and generates an AI answer using your configured LLM.

```
Input: { "question": "How does the notification system work?" }
```

### `get_file_context`

Get indexed context for a specific file or symbol.

```
Input: { "filePath": "src/services/auth.service.ts", "symbol": "validateToken" }
```

### `list_indexed_files`

Browse all indexed files, optionally filtered by path prefix.

```
Input: { "prefix": "src/controllers/" }
```

## Transport protocol

The MCP server uses HTTP+SSE transport:

- `GET /mcp/sse` — opens an SSE connection, receives an `endpoint` event with the message URL
- `POST /mcp/message?sessionId=xxx` — sends JSON-RPC requests

Heartbeat pings are sent every 30 seconds to keep the connection alive.

## API key management

### List keys

```bash
curl http://localhost:3001/profile/api-keys \
  -b "auth_token=<jwt>"
```

### Revoke a key

```bash
curl -X DELETE http://localhost:3001/profile/api-keys/1 \
  -b "auth_token=<jwt>"
```

## Security

- API keys are hashed with SHA-256 before storage — the raw key is never persisted
- Keys can have optional expiration dates
- Each key is scoped to the user who created it
- `lastUsedAt` is updated on each use for audit purposes
- Revoked keys are immediately rejected

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Authentication failed" | Invalid or expired API key | Create a new key in Settings > API Keys |
| No tools available | Server not responding | Check the URL is correct and the platform is running |
| Empty search results | Code not indexed | Run indexing first (Settings > AI Analysis) |
| Timeout errors | Slow network or large codebase | Check `AI_ANALYSIS_QDRANT_TIMEOUT_MS` env variable |

## Related guides

- [Repository Indexing](./ai-repository-indexing.md) — index your code first
- [Knowledge Base Chat](./ai-knowledge-base-chat.md) — web-based chat alternative
- [Auto-Indexing](./ai-auto-indexing.md) — keep the index fresh automatically
