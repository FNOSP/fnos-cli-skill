---
name: trim-log
description: Browse and filter logs, enumerate modules, clear or export logs, configure archives, and copy or cancel diagnostic logs.
---

# Logs

Read `../reference/log.md` for log structures and command parameters.

## Rules

- Choose explicit `level`, `module` and `locale` values for filtering and export.
- Legacy `log.*` and `appcgi.eventlogger.common.*` (`logger`) coexist; keep their results separate.
- `logger export` can be large; confirm writable output storage.
  `logger archive set` changes policy; confirm the intended configuration first.
- `diagnostic-log export --output-dir` is a mounted device-side path, such as
  `/vol1/<dir>` or `/vol00/<mount>/<dir>`.
- Inspect state with paged `logger list` before clearing or changing archives.
- Clearing, exporting, archive settings and diagnostic task control require explicit `--yes`.

## Commands

```bash
fnos-cli logger list --page <n> --page-size <n> --level <n> --module <n> --locale <locale>
fnos-cli logger modules --locale <locale>
fnos-cli logger clear --level <level> --module <module> --yes
fnos-cli logger export --level <level> --module <module> --locale <locale> --yes
fnos-cli logger archive set --switch <0|1> --file-path <path> --size-gt <n> --date-unit <n> --date-before <n> --yes
fnos-cli logger archive query
fnos-cli diagnostic-log export --output-dir /vol1/<dir> --srv-type 0,1,2 --yes
fnos-cli diagnostic-log stop --task-id <taskId> --yes
```
