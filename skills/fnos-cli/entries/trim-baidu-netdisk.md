---
name: trim-baidu-netdisk
description: Check Baidu Netdisk authorization, quota, cloud files, saved shares, NAS transfers and scheduled synchronization.
---

# Baidu Netdisk

Use for cloud file browsing/search/metadata, file changes, saving shares to NAS,
upload/download tasks, and scheduled sync. Read `../reference/baidu-netdisk.md`
for full commands, fields and errors; `trim-shared.md` covers fnOS profiles.

## Rules

- Run `baidu-netdisk status` first. If unauthorized, the user completes authorization
  in the NAS Baidu Netdisk app. The CLI does not perform Baidu OAuth.
- Cloud paths start with `/`; NAS paths are concrete `/vol{n}/...` paths. Keep them distinct.
- File, transfer and sync changes require explicit `--yes`.
- Successful `upload` means task submission only; `data: null` is normal. Check
  `task list --state running`, then `--state completed` for the final result.
- `status=6`, `failCode=42610` means insufficient cloud space. Free or expand space before retrying.
- `info --dlink` returns a sensitive temporary URL; CLI output redacts `dlink`.
- The final `move` / `copy` argument is the destination directory; earlier arguments are sources.
- Prefer `share-save --all`. To select known share IDs, repeat `--fsid` instead;
  `--all` and `--fsid` are mutually exclusive.
- Share extraction codes are detected automatically or supplied with `--password`.
  Keep share shortcodes, extraction codes, `spwd` and intermediate task IDs out of replies and logs.

## Commands

```bash
fnos-cli baidu-netdisk status
fnos-cli baidu-netdisk quota
fnos-cli baidu-netdisk ls / --limit 80
fnos-cli baidu-netdisk search <keyword> --dir / --recursive
fnos-cli baidu-netdisk info <fsid...>
fnos-cli baidu-netdisk mkdir /backup --yes
fnos-cli baidu-netdisk upload /backup /vol1/1000/data --yes
fnos-cli baidu-netdisk download /vol1/1000/downloads <fsid...> --yes
fnos-cli baidu-netdisk share-save '<shareUrlWithPassword>' /vol1/1000/downloads --all --yes
fnos-cli baidu-netdisk task list --transfer download
fnos-cli baidu-netdisk sync list
```
