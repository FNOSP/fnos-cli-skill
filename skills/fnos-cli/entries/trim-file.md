---
name: trim-file
description: List and search files, upload local files, inspect shared directories and ACLs, or determine current-user and NAS path semantics.
---

# Files

Read `../reference/workflows/file-routing.md` to choose the command, then
`../reference/file.md` for endpoint fields.

## Rules

- Both `file ls` and `file ls /` omit the request's `path`.
- Writes require a concrete `/vol{n}/...` path by default.
- `file share.*` manages shared directories, not share links.
- `file search-others` searches files shared with the current user; it is not a shared-directory listing.
- `file upload` takes a remote directory; the CLI appends the local filename.
- `file check-upload` may allocate a temporary placeholder; both upload and preflight require `--yes`.
- `file fav add/del` changes the current user's favorites and requires `--yes`.

## Commands

```bash
fnos-cli file ls
fnos-cli file ls /vol1/downloads
fnos-cli file search <key>
fnos-cli file upload /vol1/1000/uploads ./local-file.txt --overwrite rename --yes
fnos-cli file share list
fnos-cli file acl get /vol1/1000/docs
```
