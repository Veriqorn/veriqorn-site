# Veriqorn Site

Standalone public marketing site and documentation portal for Veriqorn.

## Stack
- Bun
- React + Vite
- TanStack Router
- Tailwind CSS

## Run Locally
```bash
bun install
bun run dev
```

## Build
```bash
bun run build
bun run preview
```

## Repository Layout
- `src/` - application routes and UI
- `public/` - static assets such as `robots.txt` and `sitemap.xml`
- `docs/guides/` - public markdown guides bundled into the site build

## Environment Variable
Set the public site URL for canonical and Open Graph links:

```bash
VITE_SITE_URL=https://your-domain.example
```

If not set, the site falls back to `https://qa-report-platform.dev`.

## Deployment
Recommended targets: Vercel or Cloudflare Pages.

Suggested settings:
- Build command: `bun install && bun run build`
- Output directory: `dist`
- Root directory: repository root

After deployment, keep `public/sitemap.xml` and `public/robots.txt` aligned with the public domain.

## Related Repositories
- Product source code: `https://github.com/veriqorn/veriqorn-platform`
- Public installation assets: `https://github.com/veriqorn/veriqorn-install`

## License
Apache-2.0