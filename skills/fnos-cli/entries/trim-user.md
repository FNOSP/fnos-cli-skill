---
name: trim-user
description: Inspect users, groups, signed-in devices and current permissions, manage users, or choose the correct authenticated profile.
---

# Users and permissions

Read `../reference/user.md` and `../reference/workflows/device-validation.md`.

## Rules

- Most device operations require a signed-in session.
- Device validation uses only the current profile's OAuth session. Select a
  different profile explicitly when switching identities.
- OAuth PKCE login leaves credentials and 2FA to the user; never construct
  password, 2FA or manual access-token login commands.
- When authorization is needed, read `../reference/oauth.md`. The Agent generates
  a link with `login --authorize-only`; the user authorizes in the browser and
  sends the one-time code back; the Agent exchanges it with `login --code` in the
  same environment, profile and connection options. Verify token persistence and
  a read-only request before continuing. The user needs no terminal; ordinary
  interactive `login` remains available when the user explicitly chooses it.
- Unwrapped `user.*` endpoints use `user request`. User and signed-in-device
  writes require confirmation by default; Agent writes explicitly pass `--yes`.

## Commands

```bash
fnos-cli --profile home --host <host> --port <port> login --authorize-only
```

After the user sends the code, follow the OAuth guide to complete authorization:

```bash
fnos-cli --profile home --host <host> --port <port> login --code '<code>'
```

Other user commands (not login steps):

```bash
fnos-cli logout
fnos-cli user request user.checkNewUser --json '{"user":"<new-user>"}' --yes
```
