# Public release manifest

The public website reads the latest product version from this file in the
`veriqorn-install` repository:

```text
releases/latest.json
```

Publish it from the private platform release workflow after the Docker images
have been released. It must contain only public information:

```json
{
  "version": "v0.1.0",
  "releasedAt": "2026-08-03",
  "releaseNotesUrl": "https://github.com/veriqorn/veriqorn-install/blob/master/releases/v0.1.0.md"
}
```

Store the public, customer-facing release notes alongside it as
`releases/v0.1.0.md`. Do not copy private repository URLs, internal issue
references, security details, or implementation notes into either file.

The workflow in the private platform repository needs a narrowly scoped token
with write access to the public `veriqorn-install` repository. It should update
the versioned markdown file and `releases/latest.json` in one commit, then push
to the default branch. The site immediately displays its built-in version and
uses the manifest on subsequent page loads, so a failed publication does not
hide the current version.
