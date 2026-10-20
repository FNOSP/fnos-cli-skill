---
title: 常见问题与排错
description: 按现象查原因：平台不支持、下载与校验失败、缓存损坏、连接与 401、证书、Keychain、退出码、模块特定错误。
sidebar_position: 7
---

# 常见问题与排错

先记住一个习惯：**任何命令出问题，先跑 `--version` 和对应层级的 `--help`**，确认你手上的 CLI 到底是哪个版本、有哪些参数。

## 启动器与安装

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Unsupported platform` | 不在白名单（只有 darwin/linux 的 arm64、x64） | Alpine(musl)、FreeBSD、riscv64 无法使用；Windows 走 `fnos-cli.cmd` |
| 下载卡住或超时 | 访问不到 GitHub Releases | 配镜像：`export npm_config_registry=https://registry.npmmirror.com/` |
| `checksum mismatch` | 收到的内容被中间层改写或截断 | **不会自动换源**，删掉缓存目录后重试，或换镜像 |
| `Unsafe runtime cache directory` | 缓存路径是软链（`/tmp` 常见） | 设 `XDG_CACHE_HOME` 到真实路径 |
| 提示缓存损坏 | 上次初始化中断 | 确认没有初始化进程在跑，删除提示的缓存目录，重跑原命令 |
| 提示锁残留 | 并发初始化被中断 | 确认无进程占用后清锁目录再重试 |
| 缺 `curl`/`mkfifo` 等 | 极简镜像 | 先补齐基础工具，或改用完整镜像 |

## 连接与授权

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 连接失败 | 地址/端口不对，或 fnOS 的 HTTP 服务没开 | 看报错里的 `host:port` 是否是你期望的目标 |
| 授权后立刻 401 | 第 1 步和第 3 步的 host/port/scheme 不一致 | 用完全相同的参数重走两步 |
| 401 反复出现 | 令牌被轮换或设备策略变更 | `login --refresh`；仍失败就重新授权 |
| `authorization_pending=true` | 只是等待授权 | 去浏览器完成授权，别重复生成链接 |
| code 无效 / 过期 | 超过 5 分钟，或已经用过 | 重新执行 `--authorize-only`，不要重试旧 code |
| HTTPS 证书报错 | 自签证书 | 加 `--tls-insecure` |
| 明文 HTTP 被拒 | 远端不允许明文 | 加 `--scheme http --allow-insecure-http`（仅可信内网） |
| macOS 弹 Keychain 授权框 | 正常行为 | 点允许；如果拒绝，可能落到 `ask-file` 询问 |
| `profile` 名报错 | 含非 ASCII 或非法字符 | 只用字母、数字、`_`、`-`、`.` |

## 退出码

| 退出码 | 含义 |
| --- | --- |
| 0 | 成功 |
| 2 | 被 Skill 包主动拦截（如 `media`），或参数错误 |
| 非 0 且提示需要确认 | 写操作缺 `--yes` |

:::note 不能只看退出码
`photos` 等模块的响应里可能同时有 `httpStatus` 和 `response.code`，HTTP 200 但业务码失败是常见的。判断成败要看业务码。
:::

## 模块特定问题

### 文件

- `file ls /` 不是把 `/` 传给后端 —— 它和 `file ls` 一样省略 `path`，返回的是当前用户目录。
- `file share.*` 管的是**共享目录**，不是共享链接；链接在另一个模块。
- `file check-upload` 可能会在设备上建临时占位，所以它也要 `--yes`。

### 应用中心

- 上传报 `20001`：存储不可用。检查 `--volume-id` 对应的卷是否存在、已挂载、健康。
- 安装卡在许可确认：需要 `--accept-license`。依赖变更、运行中依赖应用必须在应用中心界面处理，CLI 不会代劳。
- 缺少必需的自定义向导输入：停下，让用户去界面填。

### Docker

- `container ls` 看不到容器：默认只列运行中，加 `--all` 或 `container inspect <id>`。
- `container top` 报错：容器必须处于运行中（`State.Running=true`）。
- `container update` 后 ID 变了：用了命令返回的新 ID 做后续操作。

### 百度网盘

- 必须先 `baidu-netdisk status`；未授权时由用户在 NAS 的百度网盘应用里完成授权，CLI 不做百度 OAuth。
- `status=6` 或 `failCode=42610`：网盘空间不足，清理或扩容后重试。
- `upload` 返回 `data: null` 是正常的 —— 只代表任务已提交，用 `task list --state running` 再看 `--state completed` 确认结果。

### 照片

- 预览地址打不开：URL 是绝对地址，但浏览器仍需要 fnOS 登录 cookie。
- 「搜不到图」：自然语言搜图是 `magic-search`，不是 `photos search`。

### 日志

- `logger export` 很慢或失败：数据量可能很大，先确认输出位置可写。
- `diagnostic-log export --output-dir` 指**设备侧**已挂载路径（`/vol1/...` 或 `/vol00/<mount>/...`），不是本机路径。

## 版本与传播

| 现象 | 原因 |
| --- | --- |
| 装了新版但 `--version` 还是旧的 | 版本钉死，升级是显式动作；确认装的是新入口 |
| npm 上 `latest` 不是最新 | 发布期间 `latest` 可能滞后；显式钉版本号 |
| `--help` 里没有文档提到的命令 | CLI 与 Skill 不是同一版本；两者应来自同一个包 |

:::tip 升级后的标准动作
1. 跑 `--version` 和 `--help` 确认实际版本；
2. 重新授权（新版不迁移旧登录数据）；
3. 跑一条只读命令（`system info`）确认链路。
:::

## 还是不行？

- 上游文档：`reference/` 下对应模块页有完整字段和错误码
- 上游仓库：<https://github.com/fnnas-labs/fnos-cli-skill/issues>
- 提问题时带上：`--version` 输出、脱敏后的命令、完整错误文本（**别贴 code、token、分享链接**）
