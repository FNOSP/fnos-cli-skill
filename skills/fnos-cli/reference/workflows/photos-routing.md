# Photo task routing

Use for library statistics, filtered search, AI semantic search and sampled previews.
Read the Photos reference after selecting a command.

## 1. Authentication

Photos reuses the current profile's proxy session. Without a valid session, the
user runs interactive `fnos-cli login`, opens the link, signs in, authorizes
and pastes the one-time code into the CLI. The Agent does not enter credentials,
approve access or read browser codes.

For multiple devices, select `--profile`, `--host` and `--port` explicitly.
Sessions are not interchangeable across devices.

## 2. Scenarios

### Library scope and size

```bash
fnos-cli photos folders
```

Summarize returned photo/video counts per scanned folder. Photos indexes only
folders added to scanning; filesystem image counts are not library index counts.

### Filtered search and counts

```bash
fnos-cli photos search Beijing --limit 20
fnos-cli photos search IMG --filter file_type=photo --limit 20
```

Report the response's `total` as the full match count; `list` is the returned
sample. For previews, choose a few representative results and call
`photos preview <id> --size m`, rather than fetching every original.

### Natural-language AI search

Check readiness before searching:

```bash
fnos-cli photos request post /api/v1/magic-search/ready --yes
fnos-cli photos request post /api/v1/magic-search/do \
  --json '{"keyword":"sunset at the beach","antiFilters":[]}' --yes
```

AI search is a separate endpoint from filtered `photos search`. It usually
returns `response.data.list` without a stable `total`; report only the number
returned. If the model is missing, not ready or incompatible with the query
language, report the business error. A filename-search fallback is not an AI result.

`photos request` preserves the raw envelope and can exit 0 even when
`response.code != 0`. Both calls require `httpStatus` in `200..299` and
`response.code == 0`. Select result IDs from `response.data.list` for previews.

### Sampled previews

```bash
fnos-cli photos preview <id> --size m
fnos-cli photos preview <id> --size o
```

Prefer medium previews; use `--size o` only when the user asks for originals.

## 3. Counts and links

| Result | Meaning | Caveat |
| --- | --- | --- |
| Filtered search `total` | All matches | Not the current `list` length |
| AI `list` length | Returned count | Not an exact total without `total` |
| `previewUrl` | Thumbnail, original or video preview | Browser usually needs a signed-in fnOS cookie |

Keep secure-store tokens private and preserve the CLI's sensitive-URI redaction.

## 4. Stop and clarify

Clarify exact-count requests when AI results lack `total`, public-preview
requests without browser authentication, and preview-only tasks that would
fetch every original. Stop on non-2xx `httpStatus` or nonzero `response.code`.

Read [photos.md](../photos.md) for fields/filters/AI endpoints and
[device-validation.md](device-validation.md) for device differences.
