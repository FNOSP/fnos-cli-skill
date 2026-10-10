# High-risk storage operations

Probe read-only state before deciding whether a storage write can proceed.

## 1. Identify high-risk writes

Use this workflow before `storage umount/create/stop/add-disk/remove-disk/replace-disk/resize/extend/format/eject/disk-mount/disk-umount`,
and before `storage request` unless the endpoint is confirmed read-only.

`storage mount` is lower risk but still requires the pool identifier and current
state. Removable-disk mount/unmount operations require the exact disk target.

## 2. Read-only probes

1. `fnos-cli storage pools`.
2. `fnos-cli storage disks`.
3. Before pool creation, `fnos-cli storage free-disks`.
4. As needed, `fnos-cli storage health <disk>` or `storage smart <disk>`.
5. For removable devices, `storage removable` and `storage disk-info <disk>`.

Confirm whether the target is a pool UUID/`trim_*` identifier or plain disk
name, its state and removability. For remaining space on a system disk, use the
returned `part`, not whole-disk `name`. Keep disk and pool operations distinct.

## 3. Password and confirmation policy

| Policy | Commands |
| --- | --- |
| Verify and forward password | `umount`, `create`, `stop`, `add-disk`, `remove-disk`, `replace-disk`, `resize` |
| Verify without forwarding | `extend`, `format`, `eject` |
| Confirmation without password verification | `mount`, `disk-mount`, `disk-umount` |
| Generic request | `request` requires confirmation; explicit `--password` is verified and forwarded |

Agent/noninteractive writes explicitly pass `--yes`. For the first two rows,
stop if the required password is unavailable; there is no assumed default.
Treat potentially mutating `stor.*` requests as high risk.

## 4. Distinctions

- `mount` is not the inverse of `stop`; check pool state.
- `extend` and `resize` are different operations.
- `format` / `eject` target removable devices, not ordinary pools.
- Pools use UUIDs or `trim_*`, not legacy `name`.
- Disks use plain names such as `sda` or `nvme0n1`, not `/dev/sda`.

## 5. Stop and clarify

Stop for ambiguous pool/disk targets, probe results inconsistent with the user's
description, unavailable required passwords, or stopped/unmounted/non-expandable
targets and standby/abnormal disks.

Once target and order are confirmed, read [stor.md](../stor.md). Otherwise remain
at the read-only probe stage.
