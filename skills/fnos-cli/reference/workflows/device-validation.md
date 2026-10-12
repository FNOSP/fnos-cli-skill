# Device validation

Use this workflow for Agent-assisted OAuth, minimal probes and read-after-write verification.

## 1. User authorization

Follow `../oauth.md` for Agent-assisted OAuth PKCE:

1. The Agent runs `fnos-cli --profile <profile> --host <host> --port <port> login --authorize-only`.
2. Share the returned authorization link with the user; wait for their reply.
3. The user opens the link, signs in and approves access in the browser.
4. The user sends the one-time code back to the Agent, without opening a terminal.
5. The Agent runs `login --code '<code>'` with the same profile and connection
   options, then checks token persistence and a read-only request.

Keep credentials and consent in the user's browser. Only exchange the code the
user explicitly supplies; do not repeat it in replies or save it in extra logs.
Authorization URLs omit `redirect_uri`.

For DSH, both login calls and subsequent requests must share the DSH Host, system
user, configuration environment and `--profile`. Remote browsers, SSH shells and containers do not
automatically inherit that session. macOS background Keychain access may need
system approval.

## 2. Minimal read-only probes

Before any write:

1. Confirm the code exchange established the intended profile's session; do not
   preconfigure or rotate accounts as part of validation.
2. Run one or two read-only commands for the target module to check connectivity
   and permissions.
3. For files, prefer `file ls` or a read-only search.
4. For storage, use `storage pools` / `storage disks`.
5. For Docker, use `docker stats` or `docker container ls`.

Confirm the device target, session and sufficient current-user permissions.

## 3. Write sequence

1. Probe the closest relevant read-only state.
2. Perform one authorized, explainable and reversible write.
3. Immediately read the resulting state.
4. Clean up temporary resources when appropriate.

Keep unrelated writes out of the same validation run.

## 4. Read-after-write verification

Use at least one relevant check:

- Files: `ls`, `search` or `share list`.
- Storage: `pools`, `disks` or `removable`.
- Docker: `image ls`, `container ls` or `compose ls`.
- Users: `user list` or `group list`.

Only claim success when the before/after states can be compared objectively.

## 5. Stop and ask

Stop when OAuth or code exchange fails, the target host is missing, a write may
affect production data/services, or responses conflict with documented
constraints and suggest firmware differences.

Read the module reference once the command is selected. Resolve unknown
profiles, permissions and device state before proceeding.
