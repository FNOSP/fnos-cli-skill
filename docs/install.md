---
title: 安装与升级
description: 安装 Skill、首次运行的下载与校验、缓存位置、内网镜像配置，以及升级和卸载的正确姿势。
sidebar_position: 3
---

# 安装与升级

## 前置条件

| 条件 | 说明 |
| --- | --- |
| 平台 | macOS / Linux 的 x64、arm64；Windows 走 PowerShell 入口（需 PowerShell 5.1+） |
| 基本工具 | macOS/Linux 需要 `curl`、`gzip`、`sha256sum` 或 `shasum`，以及 `awk`、`sed`、`mkfifo` 等常用工具 |
| 网络 | 首次运行需要能访问 GitHub Releases 或镜像站（之后走缓存，不再联网） |
| fnOS | 国内版 fnOS，能通过 HTTP 访问（默认 `localhost:5666`） |
| 一次授权 | 浏览器里完成 OAuth，见[授权与连接](./authorize.md) |

:::caution 极简容器注意
Alpine（musl）、FreeBSD、riscv64 等平台会直接报 `Unsupported platform`；缺少 `curl` 或 `mkfifo` 的极简镜像会在首次下载阶段失败。这类环境请先补齐工具链。
:::

## 安装

### 装给 Agent 用（推荐）

```bash
npx skills add fnnas-labs/fnos-cli-skill --skill fnos-cli -g
```

### 装 CLI 本体（自己用）

```bash
npm install -g @fnnas-labs/fnos-cli
```

npm 包里只有 93 KB 的 JS 启动器，二进制仍然是首次运行时按 `runtime-manifest.json` 下载的 —— 两者行为一致。

### Windows

用 Skill 目录下的 `scripts/fnos-cli.cmd`（内部调 `fnos-cli.ps1`，走系统 .NET 下载解压，不需要 Unix 工具）。PowerShell 里传 JSON 参数建议用单引号：

```powershell
.\scripts\fnos-cli.cmd system info
.\scripts\fnos-cli.cmd raw appcgi.system.getInfo --json '{"language":"zh-CN"}'
```

若提示执行策略阻止脚本，先在本机放开（`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`），再重试原命令。

## 首次运行发生了什么

1. 启动器先校验 `../runtime-manifest.json` 的 SHA-256，防止清单被篡改；
2. 用 `uname -s` / `uname -m` 判断平台，只认 `darwin-arm64`、`darwin-x64`、`linux-arm64`、`linux-x64`；
3. 按固定版本下载一份压缩包，**逐层校验**：压缩包大小 + SHA-256 → 解压后二进制大小 + SHA-256 → 可执行位；
4. 用目录锁 + owner 文件防止并发重复初始化；
5. 缓存命中后直接 `exec`，不联网。

缓存位置：

| 系统 | 路径 |
| --- | --- |
| macOS | `~/Library/Caches/fnos-cli/<版本>/<平台>` |
| Linux | `${XDG_CACHE_HOME:-~/.cache}/fnos-cli/<版本>/<平台>` |

:::tip 沙箱里跑要注意软链
启动器对缓存路径的 symlink 校验很严，`/tmp` 本身是软链时会直接报 `Unsafe runtime cache directory`。在受管沙箱里请显式指定 `XDG_CACHE_HOME` 到真实路径。
:::

## 内网 / 镜像配置

下载顺序是：**GitHub Release → 你配置的兼容镜像 → 公共 npmmirror**。

```bash
# 方式一：环境变量（优先级最高）
export npm_config_registry=https://mirror.example.com/npm/

# 方式二：走 npm 自身的 registry 配置
npm config set registry https://registry.npmmirror.com/
```

镜像基址必须是 HTTPS、不含用户名密码和查询参数，可以带企业路径前缀。实际取件路径是：

```text
<镜像基址>/-/binary/fnos-cli/v<版本>/<资产名>
```

几个行为细节：

- 默认的 npmjs registry 不提供二进制接口，会被自动跳过；
- 设为空字符串 = 跳过自定义镜像；
- 网络或 HTTP 失败会自动换下一个源；
- **但如果收到的内容大小或摘要不符，会立刻停下，不会换源** —— 这是防投毒设计，别以为是网络问题反复重试。

## 升级

升级是**显式动作**，不会自动发生：

```bash
# Skill 更新
npx skills add fnnas-labs/fnos-cli-skill --skill fnos-cli -g

# npm 包更新
npm install -g @fnnas-labs/fnos-cli@latest
```

版本是钉死的：每个入口用自己固定版本的 CLI，不会因为上游发了新版就悄悄变。升级后**必须重新授权** —— 新版不读取也不迁移旧登录数据。

:::note 为什么绑版本
`latest` 在发布期间可能还是上一版。要做到可复现，请显式钉版本（如 `@0.5.1`），不要依赖 `latest` 的传播速度。
:::

## 卸载

```bash
rm -rf ~/.claude/skills/fnos-cli            # 删 Skill
rm -rf ~/Library/Caches/fnos-cli            # 删缓存的二进制（macOS）
fnos-cli --profile home logout              # 清登录状态
```

`logout` 只清本机 profile 里的 session，不承诺远端撤销令牌。旧凭据不会被自动删除，需要你自己处理。
