---
title: 5 分钟上手
description: 从零到跑通第一条命令：安装 Skill、两步授权、第一次只读验证，附每一步的预期输出。
sidebar_position: 2
---

# 5 分钟上手

前提：能访问你的 fnOS（局域网 IP 或域名都行），手上有一个 fnOS 账号密码。

## 第 1 步：安装 Skill（约 30 秒）

在终端执行：

```bash
npx skills add fnnas-labs/fnos-cli-skill --skill fnos-cli -g
```

`skills` 是跨 Agent 的 Skill 安装器（`vercel-labs/skills`）。`-g` 表示装到全局，所有项目都能用。

装完你会得到一个目录，里面有 `SKILL.md`、`entries/`、`reference/` 和 `scripts/fnos-cli`。不同宿主的路径不同，常见位置：

| 宿主 | 大致位置 |
| --- | --- |
| Claude Code | `~/.claude/skills/fnos-cli/` |
| WorkBuddy | `~/.workbuddy/skills/fnos-cli/` |
| 其它 | 安装器输出的路径，或项目内 `.agent/skills/fnos-cli/` |

:::note 不需要 Node 也能跑
安装用 npx，是为了把文件搬到本地。**安装完成后，启动器本身不依赖 Node/npm**，只要系统有 `curl`、`gzip`、`sha256sum`（或 `shasum`）就能工作。
:::

## 第 2 步：确认 CLI 能跑起来

```bash
~/.claude/skills/fnos-cli/scripts/fnos-cli --version
```

首次执行会自动下载本机对应平台的 CLI，然后校验大小和 SHA-256。预期输出：

```text
Downloading fnos-cli 0.5.1 (darwin-arm64)...
fnos-cli 0.5.1
Build source SHA256: 1535c136...
```

再来一条：

```bash
~/.claude/skills/fnos-cli/scripts/fnos-cli --help
```

能看到 `app / docker / file / photos / storage / system ...` 这一串子命令就对了。

## 第 3 步：两步授权（唯一需要你亲自做的事）

fnos-cli 走 OAuth + PKCE，密码和 2FA 全程只在浏览器里输入，不经过命令行。

**① 生成授权链接**

```bash
fnos-cli --profile home --host 192.168.1.10 --port 5666 login --authorize-only
```

返回里有一行 `authorization_url`，把它复制到浏览器打开。

**② 浏览器里登录并确认**

输入 fnOS 账号密码、过 2FA、点同意。页面会显示一串**一次性 code**（有效期 5 分钟）。

**③ 用 code 换令牌**

```bash
fnos-cli --profile home --host 192.168.1.10 --port 5666 login --code '粘贴那串code'
```

看到 `token_persisted=true`、`refresh_token_persisted=true` 就成功了。

:::danger 两个必须一致
第 ① 步和第 ③ 步必须在**同一台机器、同一个系统用户、同一个 profile、同样的 host/port** 下执行。换了环境就得重新走一遍授权 —— SSH 和容器内的登录状态不互通。
:::

## 第 4 步：跑第一条只读命令

```bash
fnos-cli --profile home system info
```

这是最安全的验证方式：纯只读，不写任何东西。能拿到机型、版本、卷信息，说明链路通了。

再试两条常用的：

```bash
fnos-cli --profile home file ls              # 看当前用户目录
fnos-cli --profile home monitor cpu          # 看 CPU 采样
```

## 第 5 步：交给 Agent

回到你的 Agent，说一句：

> 用 fnos-cli 看看我这台 NAS 上 `/vol1/downloads` 里有哪些大文件，按大小排序

Agent 会自己读 Skill、挑 `entries/trim-file.md`、再去看 `reference/file.md` 的字段，然后跑命令。你只需要在涉及写操作时确认一次。

## 常见卡点（30 秒自查）

| 现象 | 原因 |
| --- | --- |
| `Unsupported platform` | 平台不在白名单（仅 darwin/linux 的 arm64/x64，Windows 走 ps1） |
| 下载失败 | 访问不到 GitHub Releases，需要配镜像，见[安装与升级](./install.md) |
| 连接失败，提示 `host:port` | IP/端口不对，或 fnOS 的 HTTP 服务没开 |
| 授权后立刻 401 | 目标设备的连接参数和第 ③ 步不一致，重新授权 |
| 命令被拒、exit 2 | 触发了确认机制，写操作要加 `--yes` |

更多见[常见问题与排错](./troubleshooting.md)。
