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
- For supported Connect device subdomains, CLI HTTP requests automatically include
  `mode=relay`; other targets do not receive this cookie.
- Self-signed HTTPS may need explicit `--tls-insecure`; remote plain HTTP needs
  explicit `--allow-insecure-http`.
- Sessions default to platform secure storage. Use `TRIM_CLI_SESSION_STORAGE=file`
  only for isolated tests or CI. `TRIM_CLI_SESSION_STORAGE=ask-file` explicitly
  asks the user before a lower-trust file fallback after secure-storage failure.
- OAuth PKCE is the login flow. The user handles credentials and 2FA in the browser.
- Agent login follows `../reference/oauth.md`: generate the link with
  `login --authorize-only`, wait for the user's browser authorization and returned
  code, then exchange it with `login --code`. The user needs no terminal.
- For DSH, log in on the same Host, system user and configuration environment,
  with the same `--profile`. Sessions do not automatically transfer to remote
  browsers, SSH shells or containers. macOS background Keychain access may need approval.
- Access tokens refresh near expiry; `login --refresh` can request refresh.
- When token exchange returns a device access code, the CLI keeps it in the selected
  session and sends the required headers on protected requests. Do not ask the
  user to paste that device code into chat; a gateway challenge requires login again.
- Refresh checks writable session storage first; failed preflight preserves the
  old session and sends no refresh. Concurrent processes reuse newer profile
  sessions rather than overwriting rotated tokens.
- Connection failures should identify the attempted `host:port`.
- Profile names are nonempty and contain only ASCII letters, digits, `_`, `-`, `.`.
- Input guards reject control characters, empty values and excessive lengths instead of silently rewriting them.
- `raw` omits `--yes` only for built-in audited read-only endpoints. Other and
  unknown endpoints require it; endpoint names alone do not establish read-only behavior.

## Commands

The Agent runs the two login calls separately, waiting for the user-provided code
between them and keeping the same target and profile:

```bash
fnos-cli --profile home --host <host> --port <port> login --authorize-only
fnos-cli --profile home --host <host> --port <port> login --code '<code>'
fnos-cli --profile home system info
```

Other commands, only when needed for the user's task (not onboarding steps):

```bash
fnos-cli --profile home raw appcgi.system.getInfo --json '{"language":"zh-CN"}'
fnos-cli --profile home raw appcgi.network.ssh.switch --json '{"enable":true}' --yes
fnos-cli --profile home logout
```
