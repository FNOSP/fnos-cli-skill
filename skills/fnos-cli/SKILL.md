---
name: fnos-cli
description: Use fnos-cli to sign in to and manage fnOS devices, including files, photos, applications, Docker, downloads, logs, monitoring, networking, storage, users, and Baidu Netdisk. Use when the user mentions fnOS, Feiniu OS, or a mainland China device. Excludes Media APIs and international-edition devices.
---

# fnOS

## CLI setup

This Skill matches `@fnnas-labs/fnos-cli@0.2.5` and requires Node.js 18+.
Check `fnos-cli --version` before use. Install the matching version if needed:

```bash
npm install -g @fnnas-labs/fnos-cli@0.2.5
```

Without a global installation, replace `fnos-cli` with
`npx -y --package=@fnnas-labs/fnos-cli@0.2.5 fnos-cli`.
Installing a Skill does not install the CLI or sign in to a device.
The user completes OAuth in an interactive terminal; the Agent never enters credentials or authorization codes.


The command-line client for fnOS. It uses the HTTP API proxy for
system services and native applications: authentication, files, photos, apps,
Docker, downloads, logs, monitoring, networking, power, storage, and users.

Examples assume `fnos-cli` is available on PATH. An integration may provide
an explicit package-local launcher instead; follow that integration's instructions.

## Task routing

Choose the most specific entry, then follow its reference or workflow. For a
product-specific task not listed below, inspect the descriptions in `entries/`.

| Task | Entry |
| --- | --- |
| Sign in, sessions, connection failures, profiles | `entries/trim-shared.md`, `reference/_index.md` |
| Files, finder, shares, ACLs, uploads and downloads | `entries/trim-file.md`, `reference/workflows/file-routing.md` |
| Photo search, AI search, details and previews | `entries/trim-photos.md`, `reference/workflows/photos-routing.md` |
| Apps, Docker, downloads, logs and monitoring | Matching file in `entries/`, `reference/_index.md` |
| Storage writes | `entries/trim-storage.md`, `reference/workflows/storage-dangerous-ops.md` |
| Users, groups and permissions | `entries/trim-user.md`, `reference/user.md` |
| Device validation | `reference/workflows/device-validation.md` |

## Safety rules

- Media APIs are outside this Skill's scope; use the documented capabilities only.
- Authentication uses OAuth 2.0 Authorization Code + PKCE. The user handles NAS
  credentials and 2FA in their browser; never collect passwords or old tokens.
- OAuth uses `client_id=YJNMPJUGA9` and the CLI's required `trim.*` scopes. See
  `reference/oauth.md` for the full list. Authorization URLs omit `redirect_uri`.
- Production login is interactive: the CLI displays a link and waits while the
  user signs in, approves access, copies the one-time code, and pastes it into the
  CLI's `Authorization code` prompt. The Agent does not fill credentials, approve
  access, read browser codes, or pass codes in command arguments.
- Run login in the actual execution environment. DSH requires the same Host,
  system user, configuration environment and profile as the user's login terminal.
  Remote browsers, SSH shells and containers do not automatically share sessions.
- Sessions hold access/refresh tokens, expiry and OAuth device information. Store
  secrets only in platform secure storage or an explicitly selected file backend;
  keep them out of ordinary output, logs and third-party messages.
- Tokens refresh near expiry. HTTP 401 from `/ogh/ac/w` or `/ogh/ac/h/*` triggers
  one refresh and one retry. Repeated 401 or refresh failure requires a new OAuth
  login, not a retry loop or a legacy authentication fallback.
- Refresh first checks that the profile's session store is writable. Concurrent
  refreshes reuse an already-written newer token.
- Missing module scopes, including legacy `file photo` grants, require login
  again; refresh cannot add scopes.
- `logout` removes the profile's session and OAuth pending file. It does not
  claim to revoke server-side tokens.
- Remote plain HTTP requires `--allow-insecure-http`; self-signed HTTPS requires
  `--tls-insecure`.
- Agent and noninteractive writes explicitly pass `--yes`. High-risk storage
  writes also require the relevant password precheck.

## Connection options

```text
--host <host>                 NAS host; defaults to localhost
--port <port>                 Explicit port takes precedence
--profile <name>              Independent session profile
--scheme auto|http|https      Transport; defaults to auto
--allow-insecure-http         Allow remote plain HTTP
--tls-insecure                Allow self-signed HTTPS
```

Without explicit connection options, the CLI reuses the profile's saved host,
port, scheme and TLS settings. Defaults are `http://localhost:5666` for loopback,
HTTPS 5667 for remote IPs, and HTTPS 443 for domain names.

## Authentication

The user runs these commands in their own interactive terminal:

```bash
fnos-cli --profile home --host <host> --port <port> --scheme https login
fnos-cli --profile home login --refresh
fnos-cli --profile home logout
```

`login` displays the authorization link, attempts to open a browser, and waits
for the user to paste a one-time code. `login --no-open` keeps the same flow
without opening the browser automatically. For a remote plain HTTP device:

```bash
fnos-cli --profile home --host <host> --port 5666 --scheme http --allow-insecure-http login --no-open
```

## Common read-only commands

```bash
fnos-cli --profile home system info
fnos-cli --profile home file ls /vol1
fnos-cli --profile home file ls-dir /vol1
fnos-cli --profile home file usage 1
fnos-cli --profile home photos folders
fnos-cli --profile home photos search <keyword> --limit 20
fnos-cli --profile home app list
fnos-cli --profile home docker image ls
fnos-cli --profile home download ls
fnos-cli --profile home monitor cpu
fnos-cli --profile home monitor beep-supported
fnos-cli --profile home storage pools
fnos-cli --profile home user info
```

## Raw requests

Use `raw` for system services without a named command, and `photos request` for
the native Photos HTTP API. Only audited read-only endpoints built into the CLI
may omit `--yes`; every other endpoint, including unknown endpoints, requires
confirmation and explicit `--yes`. Paths and request bodies are still validated.
Check both HTTP status and business response code/final state, not just exit code.

## Output

Named commands output JSON plans or business data. Photos search `total` is the
match count. AI search may report an exact total only when the response provides
a stable total; otherwise report the returned count. Preview URLs usually still
require a signed-in browser cookie.

`file ls-dir` collects directory chunks into a JSON array. `file usage` collects
capacity categories into a JSON array; repeated categories keep their last
result instead of being added together.

## References

- Index: `reference/_index.md`
- OAuth contract: `reference/oauth.md`
- Photos API: `reference/photos.md`
- Connections and validation: `entries/trim-shared.md`, `reference/workflows/device-validation.md`
