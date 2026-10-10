---
name: trim-shared
description: Sign in, select connection targets or profiles, troubleshoot sessions and connections, validate devices, and apply common safety rules.
---

# Connections and authentication

Start with `../SKILL.md` and `../reference/_index.md`.
Device validation follows `../reference/workflows/device-validation.md`.

## Rules

- The default loopback target is `http://localhost:5666`.
- Global `--profile <name>` selects an independent session profile.
- With `--scheme auto` and no explicit port, loopback defaults to `http:5666`,
  remote IPs to `https:5667`, and remote domains to `https:443`.
- An explicit `--port` takes precedence; the CLI then resolves only the scheme.
- Omitted connection options reuse the saved host, port, scheme and TLS settings.
  Profile fallback, login writes and logout cleanup affect only the selected profile.
- Self-signed HTTPS may need explicit `--tls-insecure`; remote plain HTTP needs
  explicit `--allow-insecure-http`.
- Sessions default to platform secure storage. Use `TRIM_CLI_SESSION_STORAGE=file`
  only for isolated tests or CI. `TRIM_CLI_SESSION_STORAGE=ask-file` explicitly
  asks the user before a lower-trust file fallback after secure-storage failure.
- OAuth PKCE is the login flow. The user handles credentials and 2FA in the browser.
- Production login is a single interactive `login`: the user opens the link,
  signs in, authorizes, and pastes the one-time code into the CLI. The Agent does
  not enter credentials, approve access or read browser codes.
- For DSH, log in on the same Host, system user and configuration environment,
  with the same `--profile`. Sessions do not automatically transfer to remote
  browsers, SSH shells or containers. macOS background Keychain access may need approval.
- Access tokens refresh near expiry; `login --refresh` can request refresh.
- Refresh checks writable session storage first; failed preflight preserves the
  old session and sends no refresh. Concurrent processes reuse newer profile
  sessions rather than overwriting rotated tokens.
- Connection failures should identify the attempted `host:port`.
- Profile names are nonempty and contain only ASCII letters, digits, `_`, `-`, `.`.
- Input guards reject control characters, empty values and excessive lengths instead of silently rewriting them.
- `raw` omits `--yes` only for built-in audited read-only endpoints. Other and
  unknown endpoints require it; endpoint names alone do not establish read-only behavior.

## Commands

The user runs login in their own interactive terminal:

```bash
fnos-cli --profile home --host <host> --port <port> login
fnos-cli --profile home --host <host> --port <port> login --no-open
fnos-cli --host <host> --scheme https --tls-insecure login
fnos-cli --profile home system info
fnos-cli --profile home raw appcgi.system.getInfo --json '{"language":"zh-CN"}'
fnos-cli --profile home raw appcgi.network.ssh.switch --json '{"enable":true}' --yes
fnos-cli --profile home logout
```
