# Public release manifest

The public website reads the latest product version from this file in the
`veriqorn` repository:

```text
docs/releases/latest.json
```

Publish it from the Community release workflow after the Docker images
have been released. It must contain only public information:

```json
{
  "version": "v0.2.28",
  "releasedAt": "2026-08-03",
  "releaseNotesUrl": "https://github.com/Veriqorn/veriqorn/blob/main/docs/releases/v0.2.28.md"
}
```

Store the public, customer-facing release notes alongside it as
`docs/releases/v0.2.28.md`. Do not copy private repository URLs, internal issue
references, security details, or implementation notes into either file.

The Community release commit updates the versioned markdown file and
`docs/releases/latest.json` before the release tag is pushed. The site displays
its built-in version if the manifest cannot be fetched.
