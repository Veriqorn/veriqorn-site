# Site dependency audit ? 2026-11-08

Registry snapshot and work started 2026-11-07; verification completed 2026-11-08.
Only stable npm latest releases were selected. Transitive packages follow their
parents' compatible ranges, with explicitly documented security overrides.
Bun is pinned to 1.4.4; Node.js 26 LTS is pinned to 26.13.0 in .node-version and CI.
Product/SDK release numbers and published release metadata are unchanged.

## Result

- bun run audit: 0 known advisories; 219 packages checked.
- bun outdated: no outdated direct dependencies.
- Frozen installation, TypeScript project build and Vite production build pass.
- Added CI to enforce the frozen install, audit and production build.

React/react-dom and their type packages were upgraded together. Router, icons,
Vite, Tailwind and its Vite adapter were checked as one compatible dependency
graph. Existing large-chunk build warning remains.

@tailwindcss/typography 0.5.20 pins postcss-selector-parser 6.0.10, which has a
known complexity advisory. The override uses the compatible repaired 6.1.5
release rather than forcing the unrelated 7.x major. Production build passes
with that override.

Node 26 LTS is supported by the site's hosting provider; see
[Vercel's Node 26 announcement](https://vercel.com/changelog/node-js-26-lts-is-now-generally-available-on-vercel).

No hosting configuration, publication, production release metadata or deployment
was changed. This audit covers known advisories in the npm dependency graph.
See [the complete current dependency inventory](dependency-inventory-2026-11-08.json).

## Updated declarations

| Manifest | Dependency | Before | After |
| --- | --- | --- | --- |
| package.json | @tanstack/react-router | 1.170.33 | 1.170.46 |
| package.json | lucide-react | 1.42.0 | 1.70.0 |
| package.json | react | 19.2.8 | 19.3.1 |
| package.json | react-dom | 19.2.8 | 19.3.1 |
| package.json | tailwind-merge | 3.6.0 | 3.7.0 |
| package.json | @tailwindcss/vite | ^4.3.3 | ^4.3.5 |
| package.json | @types/node | 26.5.0 | 26.6.6 |
| package.json | @types/react | 19.2.18 | 19.3.0 |
| package.json | @types/react-dom | 19.2.7 | 19.3.0 |
| package.json | @vitejs/plugin-react | 6.1.1 | 6.2.1 |
| package.json | tailwindcss | ^4.3.3 | ^4.3.5 |
| package.json | vite | 8.2.2 | 8.3.6 |

## Upstream references

- [Vite releases](https://vite.dev/releases)
- [Bun audit](https://bun.com/docs/install/audit)
- [PostCSS parser advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)
