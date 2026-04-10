# Re-indexación Automática de Código

La re-indexación automática mantiene su índice de código actualizado detectando nuevos commits en la rama principal y activando la indexación incremental. Hay dos mecanismos disponibles: **webhooks** para proveedores Git y **polling** para repositorios locales o de red.

## Requisitos previos

- Licencia AI Pro activa ([ver guía de activación](./ai-pro-license.md))
- Al menos un repositorio configurado ([ver guía de indexación](./ai-repository-indexing.md))
- Para webhooks: su instancia de la plataforma debe ser accesible desde el proveedor Git

## Paso 1. Habilitar auto-indexación

### Vía UI de configuración

1. Abra **Settings > Auto-Indexing**
2. Active **Enable automatic re-indexing**
3. Seleccione un modo: **Webhook** / **Polling** / **Both**
4. Establezca el nombre de la **rama principal** (por defecto: `main`)
5. Para polling, configure el **intervalo** en minutos (por defecto: 5)
6. Haga clic en **Save Configuration**

### Vía API

```bash
curl -X PUT http://localhost:3001/ai-analysis/auto-index/config \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "enabled": true,
    "mode": "both",
    "pollIntervalMinutes": 5,
    "mainBranch": "main"
  }'
```

## Paso 2. Configurar webhooks

### GitHub

1. En su repositorio: **Settings > Webhooks > Add webhook**
2. Payload URL: `https://your-server/webhooks/github`
3. Content type: `application/json`
4. Genere un secreto en la plataforma e ingréselo en GitHub
5. Seleccione **Just the push event**

### GitLab

1. En su proyecto: **Settings > Webhooks**
2. URL: `https://your-server/webhooks/gitlab`
3. Ingrese el token secreto
4. Marque **Push events**

### Bitbucket

1. **Settings > Webhooks > Add webhook**
2. URL: `https://your-server/webhooks/bitbucket`
3. Trigger: **Repository push**

### Azure DevOps

1. **Project Settings > Service Hooks > Create subscription**
2. Servicio: **Web Hooks**, Trigger: **Code pushed**
3. URL: `https://your-server/webhooks/azure-devops`

## Paso 3. Integración CI/CD (alternativa)

Para casos donde los webhooks no son posibles, use el endpoint genérico con clave API:

```bash
curl -X POST https://your-server/webhooks/generic \
  -H "Authorization: Bearer qarp_su_clave" \
  -H "Content-Type: application/json" \
  -d '{"branch": "main", "commitSha": "'$GITHUB_SHA'"}'
```

### Ejemplo para GitHub Actions

```yaml
- name: Trigger re-indexing
  if: github.ref == 'refs/heads/main'
  run: |
    curl -s -X POST ${{ secrets.QA_PLATFORM_URL }}/webhooks/generic \
      -H "Authorization: Bearer ${{ secrets.QA_PLATFORM_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"branch": "main", "commitSha": "${{ github.sha }}"}'
```

## Cómo funciona

### Cola de indexación

- Solo se ejecuta un trabajo a la vez
- Las solicitudes duplicadas para el mismo repositorio se ignoran
- Los errores se registran pero no bloquean la cola
- El SHA del último commit indexado se guarda después de una indexación exitosa

## Monitoreo

```bash
curl http://localhost:3001/ai-analysis/auto-index/status \
  -b "auth_token=<jwt>"
```

## Verificación de webhooks

| Proveedor | Método | Encabezado |
|-----------|--------|------------|
| GitHub | HMAC-SHA256 | `X-Hub-Signature-256` |
| GitLab | Comparación de tokens | `X-Gitlab-Token` |
| Bitbucket | Sin firma | — |
| Azure DevOps | Auth básica o secreto | `Authorization` |

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| Webhook no recibido | Plataforma inaccesible | Verifique firewall, DNS y HTTPS |
| "Invalid webhook signature" | Secreto no coincide | Regenere el secreto |
| Polling no se activa | Modo no incluye "poll" | Verifique la configuración |
| "Repository not configured" | URL no coincide | Verifique URL en Settings > AI Analysis |

## Guías relacionadas

- [Indexación de repositorios](./ai-repository-indexing.md)
- [Repositorios multi-fuente](./ai-multi-source-repositories.md)
- [Servidor MCP](./ai-mcp-server.md)
