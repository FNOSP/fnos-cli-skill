---
name: trim-network
description: Manage network service switches, including enabling or disabling SSH, and check write confirmation requirements.
---

# Networking

Read `../reference/network.md` for fields and `trim-shared.md` for connections
and sessions.

## Rules

- Enabling SSH is security-sensitive and requires explicit user authorization.
- After confirming authorization, Agent commands pass `--yes` explicitly.
- Exactly one of `--enable` and `--disable` is required.

## Commands

```bash
fnos-cli network ssh switch --enable --yes
fnos-cli network ssh switch --disable --yes
```
