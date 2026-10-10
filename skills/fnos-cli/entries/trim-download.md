---
name: trim-download
description: List, search, create and control download tasks; inspect task files, statistics and state transitions.
---

# Downloads

Read `../reference/download.md` for command signatures and endpoint fields.
Use for URI, magnet and torrent tasks, save directories, priorities and task retries.

## Rules

- Creating tasks uses `download add-uri <uri> <saveDir>` or
  `download add-path <path> <saveDir>`; save directories are concrete `/vol{n}/...` paths.
- `download stat` reports aggregate statistics, not one file's metadata.
- `download pause|resume|retry|rm <id...>` affects existing tasks and does not infer paths.
- Task creation and control require explicit `--yes`.
- Paths in `download info` / `download files` directly reflect fnOS volume
  definitions; use the returned paths rather than deriving replacements.
- Unwrapped `appcgi.downloadcenter.*` endpoints use `download request`; omit
  `req` and `reqid` from JSON.

## Commands

```bash
fnos-cli download ls
fnos-cli download ls installer
fnos-cli download info <id>
fnos-cli download files <id>
fnos-cli download add-uri https://example.com/file.iso /vol1/download --yes
fnos-cli download add-path /vol1/source.torrent /vol1/download --yes
fnos-cli download pause <id...> --yes
fnos-cli download resume <id...> --yes
fnos-cli download retry <id...> --yes
fnos-cli download rm <id...> --yes
fnos-cli download stat
fnos-cli download request appcgi.downloadcenter.tracker.query --json '{}' --yes
```
