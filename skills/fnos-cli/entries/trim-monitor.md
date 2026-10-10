---
name: trim-monitor
description: Inspect runtime CPU, memory, network, disk, process, service, battery, fan, GPU/NPU and alarm-beeper metrics.
---

# Monitoring

Read `../reference/resmon.md`. Runtime metrics use `monitor`; static system
identity, model and configuration use `trim-system.md`.

## Rules

- `monitor cpu` / `monitor memory` return time-series samples. Explain the returned
  `usage`, `cores` and related fields in context.
- `monitor gen --item` accepts comma-separated or repeated values, limited to
  `storeSpeed`, `netSpeed`, `cpuBusy` and `memPercent`.
- `monitor proc-info --pids` accepts positive integer PIDs, separated by commas.
- Most commands are read-only; `monitor mute-beeper` and `monitor request`
  require confirmation or explicit `--yes`.
- `monitor request` allows only `appcgi.resmon.*`; omit `req` and `reqid` from JSON.

## Commands

```bash
fnos-cli monitor cpu
fnos-cli monitor memory
fnos-cli monitor net
fnos-cli monitor disk
fnos-cli monitor gen --item storeSpeed,netSpeed --item cpuBusy
fnos-cli monitor proc-list
fnos-cli monitor proc-info --pids 123,456
fnos-cli monitor proc-srv
fnos-cli monitor sys-warn
fnos-cli monitor battery
fnos-cli monitor sys-fan
fnos-cli monitor beep-supported
fnos-cli monitor beep-events
fnos-cli monitor beep-reasons
fnos-cli monitor mute-beeper --yes
fnos-cli monitor request appcgi.resmon.gen --json '{"item":["cpuBusy"]}' --yes
```
