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
- Production login is interactive: the user signs in and authorizes in the
  browser, then pastes the one-time code into the CLI prompt.
- Unwrapped `user.*` endpoints use `user request`. User and signed-in-device
  writes require confirmation by default; Agent writes explicitly pass `--yes`.

## Commands

```bash
fnos-cli --host <host> --port <port> login
fnos-cli logout
fnos-cli user request user.checkNewUser --json '{"user":"<new-user>"}' --yes
```
