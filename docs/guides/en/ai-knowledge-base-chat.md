# Knowledge Base Chat

The Knowledge Base Chat lets you ask questions about your indexed codebase in a conversational interface. It combines the platform's hybrid retrieval pipeline (BM25 + vector similarity + symbol graph) with your configured LLM to provide context-aware answers with inline code references.

## Prerequisites

- AI Pro license active ([see activation guide](./ai-pro-license.md))
- `retrieval` feature token in your license
- At least one repository indexed ([see indexing guide](./ai-repository-indexing.md))
- LLM connection configured ([see LLM setup](./ai-llm-connection.md))

## Accessing Code Chat

1. Open the sidebar and click **Code Chat** (available when a project is selected)
2. Click **New Chat** to start a conversation
3. Type your question and press **Ctrl+Enter** to send

## How it works

When you send a message, the platform:

1. **Retrieves** relevant code chunks using the hybrid retrieval pipeline (top 10 results)
2. **Builds** a system prompt with the retrieved code context (file paths + snippets)
3. **Includes** your conversation history (last 20 messages) for continuity
4. **Streams** the LLM response in real-time via SSE (Server-Sent Events)
5. **Saves** the assistant's response with code references for future access

## Features

### Real-time streaming

Responses stream token-by-token as the LLM generates them. You can stop generation at any time with the **Stop** button.

### Code references

Each assistant response includes collapsible code reference cards showing:
- File path from the indexed repository
- Relevance score (percentage)
- Code snippet used as context

### Conversation management

- **Auto-title**: The first message automatically becomes the conversation title
- **Multiple conversations**: Switch between conversations in the sidebar
- **Delete**: Remove conversations you no longer need
- **Project-scoped**: Conversations are scoped to the active project

## API endpoints

All endpoints require JWT authentication (`auth_token` cookie).

### Create conversation

```bash
curl -X POST http://localhost:3001/chat/conversations \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "projectId": 1, "title": "Auth flow questions" }'
```

### List conversations

```bash
curl http://localhost:3001/chat/conversations?projectId=1 \
  -b "auth_token=<jwt>"
```

### Send message (non-streaming)

```bash
curl -X POST http://localhost:3001/chat/conversations/1/messages \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "content": "How does the authentication middleware work?" }'
```

### Send message (streaming)

```bash
curl -X POST http://localhost:3001/chat/conversations/1/messages/stream \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "content": "Explain the test execution flow" }'
```

The streaming endpoint returns Server-Sent Events:

```
data: {"type":"chunk","content":"The test"}
data: {"type":"chunk","content":" execution flow"}
data: {"type":"done","message":{...}}
```

## Example questions

- "How does the file upload service handle large files?"
- "What validation is applied to test result imports?"
- "Explain the notification dispatch logic"
- "Where is the JWT token verified?"
- "What happens when a test run completes?"

## Tips for better results

- **Be specific**: "How does the Allure import parse labels?" works better than "How does import work?"
- **Reference files**: "What does `ai-analysis-retrieval.service.ts` do?" helps the retrieval pipeline
- **Ask follow-ups**: The conversation history is included, so follow-up questions have full context
- **Index first**: Make sure relevant code is indexed before asking questions about it

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "AI Analysis Pro is required" | Missing Pro license or `retrieval` feature | Activate license with retrieval token |
| Empty or generic answers | Code not indexed or query too vague | Run indexing, then ask more specific questions |
| Streaming not working | SSE blocked by proxy | Check that reverse proxy allows `text/event-stream` |
| Slow responses | Large context or slow LLM | Reduce `topK` or use a faster model |

## Related guides

- [Repository Indexing](./ai-repository-indexing.md) — index your code first
- [LLM Connection](./ai-llm-connection.md) — configure the AI provider
- [MCP Server](./ai-mcp-server.md) — query from your IDE instead
