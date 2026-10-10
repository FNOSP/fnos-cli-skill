---
name: trim-docker
description: Inspect and manage Docker images, containers, Compose projects and long-running lifecycle operations.
---

# Docker

Read `../reference/dockermgr.md` for the API contract. Observe with `docker stats`,
`image ls` and `container ls` before making changes.

## Rules

- `container ls` lists running containers only. Use `--all` or `container inspect <id>`
  to check stopped/created containers or whether a container still exists.
- `container top` requires a running container; inspect `State.Running=true` first.
- Pulling images and stopping/restarting containers can take longer than read requests.
- `image pull` and `container create/update/start/stop/restart/kill` require `--yes`.
  Agent/noninteractive deletion also passes `--yes`; `--force` does not replace it.
- `container update` may return a new ID; older firmware requires follow-up resource
  and network checks. Use the ID returned by the command for later operations.
- Image references and container IDs are different identifiers.
- Unwrapped `appcgi.dockermgr.*` endpoints use `docker request` with explicit
  `--yes`. Probe read-only state before system/network/Compose writes.

## Commands

```bash
fnos-cli docker stats
fnos-cli docker image ls
fnos-cli docker image pull <imageRef> --yes
fnos-cli docker container ls
fnos-cli docker container ls --all
fnos-cli docker compose ls
fnos-cli docker request appcgi.dockermgr.networkList --json '{}' --yes
```
