# Chat de Base de Conocimiento

El Chat de Base de Conocimiento permite hacer preguntas sobre su código indexado en una interfaz conversacional. Combina el pipeline de búsqueda híbrida de la plataforma (BM25 + similitud vectorial + grafo de símbolos) con su LLM configurado para proporcionar respuestas contextuales con referencias de código en línea.

## Requisitos previos

- Licencia AI Pro activa ([ver guía de activación](./ai-pro-license.md))
- Token de función `retrieval` en su licencia
- Al menos un repositorio indexado ([ver guía de indexación](./ai-repository-indexing.md))
- Conexión LLM configurada ([ver configuración LLM](./ai-llm-connection.md))

## Acceso a Code Chat

1. Abra la barra lateral y haga clic en **Code Chat** (disponible cuando se selecciona un proyecto)
2. Haga clic en **New Chat** para iniciar una conversación
3. Escriba su pregunta y presione **Ctrl+Enter** para enviar

## Cómo funciona

Cuando envía un mensaje, la plataforma:

1. **Recupera** fragmentos de código relevantes usando el pipeline de búsqueda híbrida (top 10 resultados)
2. **Construye** un prompt del sistema con el contexto del código (rutas de archivos + fragmentos)
3. **Incluye** su historial de conversación (últimos 20 mensajes) para continuidad
4. **Transmite** la respuesta del LLM en tiempo real vía SSE (Server-Sent Events)
5. **Guarda** la respuesta del asistente con referencias de código

## Características

### Transmisión en tiempo real

Las respuestas se transmiten token por token mientras el LLM las genera. Puede detener la generación en cualquier momento con el botón **Stop**.

### Referencias de código

Cada respuesta del asistente incluye tarjetas de referencia colapsables:
- Ruta del archivo del repositorio indexado
- Puntuación de relevancia (porcentaje)
- Fragmento de código utilizado como contexto

### Gestión de conversaciones

- **Auto-título**: El primer mensaje se convierte automáticamente en el título
- **Múltiples conversaciones**: Cambie entre conversaciones en la barra lateral
- **Eliminar**: Elimine conversaciones que ya no necesite
- **Alcance por proyecto**: Las conversaciones están vinculadas al proyecto activo

## Endpoints de API

Todos los endpoints requieren autenticación JWT (cookie `auth_token`).

### Crear conversación

```bash
curl -X POST http://localhost:3001/chat/conversations \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "projectId": 1, "title": "Preguntas sobre autenticación" }'
```

### Enviar mensaje (streaming)

```bash
curl -X POST http://localhost:3001/chat/conversations/1/messages/stream \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "content": "¿Cómo funciona el middleware de autenticación?" }'
```

## Consejos para mejores resultados

- **Sea específico**: "¿Cómo el import de Allure analiza las etiquetas?" funciona mejor que "¿Cómo funciona el import?"
- **Referencie archivos**: "¿Qué hace `ai-analysis-retrieval.service.ts`?" ayuda al pipeline de búsqueda
- **Haga preguntas de seguimiento**: El historial de conversación se incluye en el contexto

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| "AI Analysis Pro is required" | Sin licencia Pro o token `retrieval` | Active la licencia con token retrieval |
| Respuestas vacías o genéricas | Código no indexado o consulta muy general | Ejecute la indexación, luego pregunte más específicamente |
| Streaming no funciona | SSE bloqueado por proxy | Verifique que el proxy permite `text/event-stream` |

## Guías relacionadas

- [Indexación de repositorios](./ai-repository-indexing.md)
- [Conexión LLM](./ai-llm-connection.md)
- [Servidor MCP](./ai-mcp-server.md) — consultas desde su IDE
