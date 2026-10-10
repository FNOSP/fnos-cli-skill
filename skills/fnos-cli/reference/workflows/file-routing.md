# File paths and shared-directory routing

Select the command first, then read `../file.md` for field details.

## 1. Match the intent

| Intent | Preferred command | Path and semantic rule |
| --- | --- | --- |
| List currently visible directories | `fnos-cli file ls` | Both no argument and `/` omit `path`; this does not promise all volumes |
| List a concrete directory | `fnos-cli file ls /vol{n}/...` | Keep aggregate roots separate from canonical paths |
| Search the current user's files | `fnos-cli file search <key>` | Let the CLI probe and derive the current-user directory |
| Search a specified directory | `fnos-cli file search <key> /vol{n}/...` | Use concrete canonical paths |
| Upload a local file | `fnos-cli file upload /vol{n}/... <localFile> --yes` | The remote argument is a directory, not a final filename |
| Search files shared with me | `fnos-cli file search-others <key>` | Distinct from shared-directory listing |
| Inspect a shared directory | `fnos-cli file share info <path>` | Not share-link management |
| List visible shared directories | `fnos-cli file share list [uid]` | Not file search |
| Inspect ACLs | `fnos-cli file acl get <path>` | Permission data, not shared-directory state |
| Create/delete/copy/move files | `file mkdir/rm/cp/mv` | Concrete paths and explicit `--yes` |

## 2. Resolve paths

1. Writes require concrete canonical `/vol{n}/...` paths.
2. `file ls` and `file ls /` both omit `path`; neither explicitly requests aggregate root `/`.
3. Search without a path lets the CLI probe the current-user directory via `file.ls`.
4. Every explicit search path must be `/vol{n}/...`.
5. For files shared by others, choose `search-others` or `share list-others` as appropriate.

## 3. Important distinctions

- Shared directories use `file share.*`, not share links.
- `file search-others` returns matching files, not a shared-directory list.
- ACL queries report permissions, not share status.
- `file cp` / `file mv` take a destination directory, not a final filename.
- Upload `uploadName` is an HTTP upload/resume path, not necessarily the visible filename.

## 4. Stop and ask

Clarify writes with only `/`, relative or ambiguous paths; requests for share
links when only shared-directory APIs are documented; mixed noncanonical search
paths; and assumptions that the current-user directory is a fixed value.

For fields read [file.md](../file.md). For uploads read
[file-upload-validation.md](file-upload-validation.md). Resolve path semantics
before constructing a payload.
