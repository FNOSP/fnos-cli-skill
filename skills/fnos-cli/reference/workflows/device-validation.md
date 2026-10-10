# Device validation

Use this workflow for interactive OAuth, minimal probes and read-after-write verification.

## 1. User authorization

Production validation uses interactive OAuth PKCE:

1. The user runs `fnos-cli --profile <profile> --host <host> --port <port> login`
   in their own interactive terminal.
2. The CLI displays an authorization link and waits.
3. The user opens the link, signs in and approves access in the browser.
4. The user copies the one-time code into the CLI's `Authorization code` prompt.
5. The CLI exchanges the code and saves the selected profile's session.

The Agent does not collect credentials, approve access, read browser codes or
pass codes as arguments. Add `--no-open` if the browser cannot open automatically;
the remaining steps are unchanged. Authorization URLs omit `redirect_uri`.

For DSH, the login terminal must share the DSH Host, system user, configuration
environment and `--profile`. Remote browsers, SSH shells and containers do not
automatically inherit that session. macOS background Keychain access may need
system approval.

## 2. Minimal read-only probes

Before any write:

1. Confirm interactive login established the intended profile's session; do not
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
