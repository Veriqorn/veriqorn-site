# Veriqorn Site

Public marketing site and documentation portal for Veriqorn.

## Stack

- Bun
- React + Vite
- TanStack Router
- Tailwind CSS

## Local Development

```bash
bun install
bun run dev
```

## Production Build

```bash
bun run build
bun run preview
```

## Repository Layout

- `src/` — application source code
- `public/` — static assets, `robots.txt`, `sitemap.xml`
- `docs/guides/` — localized markdown guides rendered by the site

## Environment Variables

Use `VITE_SITE_URL` to define the canonical production URL used for SEO metadata:

```bash
VITE_SITE_URL=https://your-domain.example
```

If not set, the site falls back to `https://veriqorn.dev`.

## Vercel Settings

- Framework Preset: `Vite`
- Build Command: `bun install && bun run build`
- Output Directory: `dist`
- Root Directory: repository root

After deployment, update the production domain in `public/sitemap.xml` and `public/robots.txt` if needed.

## License

This repository is licensed under Apache-2.0.
