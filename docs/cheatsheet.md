---
title: 命令速查表
description: fnos-cli 0.5.1 全部常用命令的一页索引：全局选项、快捷命令、13 个模块的典型用法与确认要求。
sidebar_position: 6
---

# 命令速查表

以 `fnos-cli 0.5.1` 的 `--help` 与上游文档为准。「需确认」列的意思是：必须显式传 `--yes`。

## 全局选项

| 选项 | 说明 |
| --- | --- |
| `--host <host>` | 目标地址，默认 `localhost` |
| `--port <port>` | 目标端口，不填按 scheme 规则推导 |
| `--profile <name>` | 选一套独立的连接与登录状态 |
| `--scheme <auto\|http\|https>` | 传输协议，默认 `auto` |
| `--allow-insecure-http` | 允许远端明文 HTTP（有风险） |
| `--tls-insecure` | 跳过 HTTPS 证书校验（自签证书用） |
| `--version` / `--help` | 版本与帮助 |

## 快捷命令

| 命令 | 等价于 |
| --- | --- |
| `fnos-cli +ls [path]` | 快速列目录 |
| `fnos-cli +search <key> [...]` | 快速搜文件 |
| `fnos-cli +status` | 一次性汇总只读状态 |

## 连接与授权

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `login --authorize-only` | 生成授权链接 | 否 |
| `login --code '<code>'` | 用一次性 code 换令牌 | 否 |
| `login --refresh` | 主动刷新令牌 | 否 |
| `logout` | 清除当前 profile 的登录状态 | 否 |

## 文件

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `file ls [path]` | 列目录；无参数与 `/` 等价（都省略 path） | 否 |
| `file search <key> [path...]` | 搜索当前用户目录或指定规范路径 | 否 |
| `file search-others <key>` | 搜「别人共享给我」的文件 | 否 |
| `file prop` / `size` / `download-url <path>` | 属性、大小、下载地址 | 否 |
| `file share list` | 共享目录（不是共享链接） | 否 |
| `file acl get <path>` | 查看 ACL | 否 |
| `file trash list` | 回收站 | 否 |
| `file mkdir` / `rename` / `rm` / `cp` / `mv` | 目录与文件写操作 | **是** |
| `file upload <远端目录> <本地文件>` | 上传，远端参数是目录，文件名由 CLI 拼 | **是** |
| `file check-upload <path> <size>` | 上传前预检（可能建占位） | **是** |
| `file compress` / `extract` | 压缩、解压 | **是** |
| `file fav add` / `del` | 收藏夹 | **是** |

## 照片

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `photos folders` | 相册扫描目录 | 否 |
| `photos search <key> --limit 20` | 按条件搜图，`--filter name=value` 可重复 | 否 |
| `photos magic-search <自然语言>` | AI 语义搜图（不是 search 的别名） | 否 |
| `photos info <photoId>` | 详情 | 否 |
| `photos preview <photoId> --size m` | 预览地址，尺寸 `xxs/xs/s/m/o` | 否 |
| `photos preview <photoId> --size o --open` | 直接打开原图 | 否 |

:::tip 图片打不开是正常的
预览 URL 是绝对地址，但浏览器仍需要 fnOS 的登录 cookie。命令行拿到地址不代表匿名可访问。
:::

## 应用中心

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `app list` / `app status <app>` | 已装应用、运行状态 | 否 |
| `app entry list` / `app desktop list` | 应用入口、桌面图标 | 否 |
| `app sac app-store-list` | 应用商店列表 | 否 |
| `app install <app> --version <v> --volume-id <id> --dry-run --yes` | 预检后安装 | **是** |
| `app install-fpk <file> --volume-id <id> --dry-run --yes` | 本地 FPK 预检 | **是** |
| `app update <app> --version <v> --dry-run --yes` | 更新 | **是** |
| `app start` / `stop` / `uninstall <app>` | 生命周期 | **是** |

## Docker

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `docker stats` | 资源占用 | 否 |
| `docker image ls` | 镜像列表 | 否 |
| `docker image pull <ref>` | 拉镜像（可能很慢） | **是** |
| `docker container ls [--all]` | 容器列表；默认只列运行中 | 否 |
| `docker container inspect <id>` | 单容器详情 | 否 |
| `docker compose ls` | Compose 项目 | 否 |
| `docker container create/start/stop/restart/kill` | 生命周期 | **是** |

## 下载

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `download ls [type]` / `info <id>` / `files <id>` | 任务列表、详情、文件 | 否 |
| `download stat` | 汇总统计（不是单文件元数据） | 否 |
| `download add-uri <uri> <saveDir>` | URL / 磁力建任务 | **是** |
| `download add-path <path> <saveDir>` | 用 NAS 上的种子文件建任务 | **是** |
| `download pause` / `resume` / `retry` / `rm <id...>` | 任务控制 | **是** |

## 百度网盘

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `baidu-netdisk status` | 授权状态，**先跑这条** | 否 |
| `baidu-netdisk quota` | 容量 | 否 |
| `baidu-netdisk ls /` / `search <kw>` / `info <fsid>` | 云端浏览、搜索、详情 | 否 |
| `baidu-netdisk share-save '<url>' <目标目录> --all` | 分享转存到 NAS | **是** |
| `baidu-netdisk upload <网盘目录> <NAS目录>` | 上传到网盘 | **是** |
| `baidu-netdisk download <NAS目录> <fsid...>` | 从网盘下载 | **是** |
| `baidu-netdisk task list` / `sync list` | 传输任务、定时同步 | 否 |

## 日志

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `logger list --page <n> --level <n> --module <n>` | 分页查日志 | 否 |
| `logger modules --locale zh-CN` | 模块编号表 | 否 |
| `logger archive query` | 归档策略 | 否 |
| `logger export --level ... --module ...` | 导出（数据量可能很大） | **是** |
| `logger clear --level ... --module ...` | 清空 | **是** |
| `diagnostic-log export --output-dir /vol1/<dir>` | 打包诊断日志 | **是** |

## 监控

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `monitor cpu` / `memory` / `net` / `disk` | 时间序列采样 | 否 |
| `monitor gen --item cpuBusy --item netSpeed` | 指定指标，仅支持 `storeSpeed`/`netSpeed`/`cpuBusy`/`memPercent` | 否 |
| `monitor proc-list` / `proc-info --pids 123,456` / `proc-srv` | 进程、服务 | 否 |
| `monitor sys-warn` / `battery` / `sys-fan` | 告警、电池、风扇 | 否 |
| `monitor beep-supported` / `beep-events` / `beep-reasons` | 蜂鸣器告警 | 否 |
| `monitor mute-beeper` | 静音蜂鸣器 | **是** |

## 网络

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `network ssh switch --enable` | 开 SSH（敏感） | **是** |
| `network ssh switch --disable` | 关 SSH | **是** |

## 存储

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `storage overview` / `pools` / `disks` / `free-disks` | 现状总览，**写操作前必看** | 否 |
| `storage disk-info <disk>` / `smart <disk>` / `health <disk>` | 单盘信息与健康 | 否 |
| `storage disk-mount` / `disk-umount <disk>` | 挂载、卸载单盘 | **是** |
| `storage create` / `extend` / `resize` | 建池、扩容、调整容量 | **是** |
| `storage add-disk` / `remove-disk` / `replace-disk` | 加盘、拔盘、换盘 | **是** |
| `storage format` | 格式化（**不可逆**） | **是** |

## 系统与电源

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `system info` | 机型、版本、卷（最常用的验证命令） | 否 |
| `system trim-version` / `kernel-version` / `host-name` / `machine-id` | 标识类 | 否 |
| `system uptime` / `unix-time` / `inited-timestamp` | 时间与运行时长 | 否 |
| `system all-vols` / `vols` / `trim-disk` / `hardware` | 卷与硬件 | 否 |
| `system power-plan` / `power-plan-status` / `next-power-off-time` | 电源策略 | 否 |
| `system request appcgi.sysinfo.*` | 未封装端点 | **是** ¹ |
| `power reboot` / `power poweroff` | 重启、关机 | **是** |

¹ 固定 `system` 命令是只读的；通用 `system request` 默认需要确认。

## 用户与权限

| 命令 | 说明 | 需确认 |
| --- | --- | --- |
| `user list` / `info` / `group` / `login-devices` | 用户、详情、用户组、登录设备 | 否 |
| `user add` / `mod` / `del` | 增改删用户 | **是** |
| `user set-admin` / `unfreeze` / `change-password` | 权限与账号状态变更 | **是** |
| `user request user.checkNewUser --json '{"user":"xxx"}'` | 未封装端点透传 | **是** |

## 五个实际场景

```bash
# ① 这台机器到底什么配置
fnos-cli --profile home system info && fnos-cli --profile home storage pools

# ② 下载目录里有哪些大文件（只读，安全）
fnos-cli --profile home file ls /vol1/downloads

# ③ 网盘上的资料转存到 NAS
fnos-cli --profile home baidu-netdisk share-save 'https://pan.baidu.com/s/xxx?pwd=abcd' \
  /vol1/1000/inbox --all --yes

# ④ 项目源码传到 NAS 备份目录
fnos-cli --profile home file upload /vol1/1000/backup ./project.zip --overwrite rename --yes

# ⑤ 磁盘健康巡检（只读）
for d in sda sdb nvme0n1; do fnos-cli --profile home storage smart $d; done
```

需要更细的字段说明和错误码，翻[模块参考](./skill/reference/index.md)。
