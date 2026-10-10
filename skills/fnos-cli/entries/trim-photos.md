---
name: trim-photos
description: Browse photo folders, search photos, inspect details, and obtain thumbnail or original preview links.
---

# Photos

Photos reuses the current profile's system OAuth session through the native
Photos HTTP API proxy. Read `../reference/photos.md` for fields and
`../reference/workflows/photos-routing.md` for statistics, AI search and sampled previews.

## Rules

- Complete OAuth `login` first; Photos needs no separate app login or signature.
- `--filter` and `--exclude-filter` take repeatable `name=value` arguments.
- Preview sizes are `xxs`, `xs`, `s`, `m` and `o` (original).
- Preview URLs are absolute, but the browser usually still needs a signed-in fnOS cookie.
- Natural-language AI search uses `magic-search`, not an alias of `photos search`.
  Without a stable `total`, report only the returned result count.
- Unwrapped endpoints use `photos request`; non-GET requests require confirmation by default.
- Inspect both `httpStatus` and `response.code`, not only the CLI exit code.

## Commands

```bash
fnos-cli photos folders
fnos-cli photos search IMG --limit 20
fnos-cli photos search Beijing --filter file_type=photo
fnos-cli photos info <photoId>
fnos-cli photos preview <photoId> --size m
fnos-cli photos preview <photoId> --size o --open
```
