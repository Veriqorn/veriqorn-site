# Configuración de repositorios multi-fuente

QA Report Platform permite indexar código desde múltiples fuentes para el análisis con IA: rutas locales, carpetas de red y repositorios Git remotos (GitHub, GitLab, Bitbucket, Azure DevOps).

---

## 1) Tipos de fuente compatibles

| Tipo | Descripción | Autenticación |
|---|---|---|
| **Local Path** | Ruta relativa en el servidor | No |
| **Network Path** | Ruta UNC o carpeta de red | No |
| **GitHub** | Repositorio público o privado | Token para privados |
| **GitLab** | Repositorio público o privado | Token para privados |
| **Bitbucket** | Repositorio público o privado | Token para privados |
| **Azure DevOps** | Repositorio Git en Azure DevOps | Token obligatorio |

---

## 2) Configuración por UI

1. Abra **Settings > AI Analysis > Repository context**.
2. Haga clic en **Add repository**.
3. Seleccione el **Source type**.
4. Complete los campos (URL, token, branch, subfolder).
5. Haga clic en **Save Changes**.
6. Ejecute **Index Repositories**.

---

## 3) Configuración por API

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      {
        "id": "github-backend",
        "name": "Backend (GitHub)",
        "sourceType": "github",
        "url": "https://github.com/myorg/backend",
        "authToken": "ghp_xxxxxxxxxxxx",
        "branch": "main"
      }
    ]
  }'
```

---

## 4) Seguridad

- Los tokens se **cifran en la base de datos** (AES-256-GCM).
- Los tokens solo se inyectan en la URL de clonación en memoria.
- Las credenciales no se escriben en disco ni en logs.

---

## Guías relacionadas

- [Descripción del módulo AI](./ai-module-overview.md)
- [Indexación de repositorios](./ai-repository-indexing.md)
- [Configuración de Qdrant](./ai-vector-db-setup.md)
