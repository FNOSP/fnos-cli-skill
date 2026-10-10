---
name: trim-app
description: Manage installed applications, App Center installation, FPK packages, updates, application entries and lifecycle operations.
---

# App Center

Manage fnOS apps: list, inspect, install, install FPKs, update, start,
stop and uninstall. See `../reference/app-center.md` for endpoints and fields;
use `trim-shared.md` for connection or session failures.

## Rules

- Writes, including installation, updates and lifecycle changes, require explicit `--yes`.
- Only flows without UI decisions run automatically. License approval requires
  `--accept-license`; dependency changes and running dependent apps require App
  Center UI. Supply explicit `--custom-parameters` for custom wizard input.
- `app install` / `app update` create and poll a download task, then start and
  wait for the installation/update task. `--dry-run` only downloads/parses the
  package, reads info and runs safety guards; it does not start installation.
- Preflight local FPKs with `app install-fpk <file> --volume-id <id> --dry-run --yes`.
  This uploads/parses the FPK and checks guards without installing it.
- NAS FPKs use `--remote-path /vol.../demo.fpk`: a concrete NAS FPK path, at most 10GB.
- Upload error `20001` means unavailable storage; check that `--volume-id` exists,
  is mounted and healthy.
- Supply `--source-id` for a new app when known; updates resolve `sourceID` from
  the installed list.
- Prefer explicit `--volume-id`. Otherwise the CLI uses App Center's default
  download/install volume, and refuses when no usable default exists.
- `--custom-parameters '<jsonArray>'` maps to `customParameters`;
  `--api-scope '<jsonObject>'` maps to `systemParameters.apiScope`. Missing required
  custom wizard input stops the command and directs the user to App Center UI.
- `--cancel-on-failure` attempts the matching cancel endpoint on task failure and
  includes its result in the error.
- `app openapi ...` manages application user authorization paths; additions need
  `--yes` and concrete `/vol...` paths.
- `app entry list`, `app desktop list` and `app sac app-store-list` use
  `appcgi.sac.entry.v1.*` WebSocket CGI, not legacy entry REST.
- Desktop entry writes without named commands use `raw` with explicit `--yes`.
- `app config set-sys` rejects invalid default volumes, update windows, cloud
  policies and boolean settings before sending. `autoCreateDesktopIcon` is sent
  only with `--allow-desktop-icon-field` after backend compatibility is confirmed.
- Apps start after installation by default; use `--no-start` to leave them stopped.

## Commands

```bash
fnos-cli --host <host> --port <port> app list
fnos-cli --host <host> --port <port> app status <appName>
fnos-cli app entry list
fnos-cli app desktop list
fnos-cli app sac app-store-list
fnos-cli app install <appName> --version <version> --source-id <sourceID> --volume-id <volumeId> --dry-run --yes
fnos-cli app install <appName> --version <version> --volume-id <volumeId> --custom-parameters '[{"key":"port","value":8080}]' --api-scope '{"API.User.FileAccess":true}' --yes
fnos-cli app install <appName> --version <version> --volume-id <volumeId> --accept-license --cancel-on-failure --yes
fnos-cli app install-fpk <localFile.fpk> --volume-id <volumeId> --dry-run --yes
fnos-cli app install-fpk --remote-path /vol1/1000/demo.fpk --volume-id <volumeId> --dry-run --yes
fnos-cli app update <appName> --version <version> --volume-id <volumeId> --dry-run --yes
fnos-cli app openapi add-user-auth-path <appName> /vol1/1000/docs --yes
fnos-cli app start <appName> --yes
fnos-cli app stop <appName> --yes
fnos-cli app uninstall <appName> --yes
```
