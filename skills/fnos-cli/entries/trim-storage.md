---
name: trim-storage
description: Inspect storage pools, disks and SMART data, or perform mounting, expansion, disk replacement, formatting and other high-risk storage writes.
---

# Storage

Read `../reference/workflows/storage-dangerous-ops.md` before writes, and
`../reference/stor.md` for the API contract.

## Rules

- Pools use UUIDs or `trim_*` identifiers; disks use plain device names such as
  `sda` or `nvme0n1`.
- Before high-risk writes, run `storage pools` and `storage disks`.
- Before creating a pool, run `storage free-disks`. For free space on the system
  disk, use the returned `part`, not the whole-disk name.
- Stop when a required password is unavailable; do not assume a default.
- Prefer named commands. `storage request` rejects endpoints already covered by named commands.

## Commands

```bash
fnos-cli storage overview
fnos-cli storage pools
fnos-cli storage disks
fnos-cli storage free-disks
fnos-cli storage disk-info <disk>
fnos-cli storage disk-mount <disk> --yes
fnos-cli storage disk-umount <disk> --yes
fnos-cli storage smart <disk>
fnos-cli storage health <disk>
fnos-cli storage request stor.getConf --json '{"uuid":"trim_pool"}' --yes
```
