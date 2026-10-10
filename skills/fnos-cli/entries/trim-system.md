---
name: trim-system
description: Inspect static system identity, model, versions, volumes, hardware and power schedules, or reboot and power off a device.
---

# System and power

Read `../reference/sysinfo.md` and `../reference/power.md`. Query the matching
`system` commands individually for hardware, volumes and power plans.

## Rules

- Static identity/configuration belongs here; CPU and memory runtime metrics use `trim-monitor.md`.
- Named `system` commands are read-only; generic `system request` requires
  confirmation or explicit `--yes` by default.
- `power reboot` / `power poweroff` interrupt services. Confirm the target and
  user authorization before passing `--yes`.
- `system request` allows only `appcgi.sysinfo.*`; omit `req` and `reqid` from JSON.
- Generic requests authenticate with the saved session; sign in to the target first.
- Machine type and version fields vary with CLI/firmware. Treat current
  `system info` output as authoritative; report unexpected or empty fields as
  possible version differences rather than inventing values.

## Commands

```bash
fnos-cli system info
fnos-cli system trim-version
fnos-cli system kernel-version
fnos-cli system host-name
fnos-cli system machine-id
fnos-cli system uptime
fnos-cli system all-vols
fnos-cli system vols
fnos-cli system docker
fnos-cli system unix-time
fnos-cli system boot-on-power
fnos-cli system hardware
fnos-cli system reserved-partition
fnos-cli system is-trim-machine
fnos-cli system trim-feature
fnos-cli system fan-mode
fnos-cli system trim-disk
fnos-cli system time-setting --lang en-US
fnos-cli system timezone-list --lang en-US
fnos-cli system power-plan
fnos-cli system next-power-off-time
fnos-cli system power-plan-status
fnos-cli system power-on-seconds
fnos-cli system inited-timestamp
fnos-cli system request appcgi.sysinfo.getTrimVersion --yes
```

## Power operations

```bash
fnos-cli power reboot --yes
fnos-cli power poweroff --yes
```
