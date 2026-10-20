---
title: 授权与连接
description: OAuth 两步授权的完整流程、profile 隔离机制、端口与 scheme 推导规则、令牌存储与刷新。
sidebar_position: 4
---

# 授权与连接

fnos-cli 不复刻登录表单，它用标准 **OAuth 2.0 + PKCE** 拿令牌。好处是密码和 2FA 永远只在浏览器里输入，命令行拿到的只是一个短期授权的令牌。

## profile：多台设备互不干扰

```bash
fnos-cli --profile home  ...     # 家里那台
fnos-cli --profile office ...    # 公司那台
```

- 每个 profile 有独立的 host/port/scheme/TLS 设置和独立的登录状态；
- 不传 `--profile` 时使用默认 profile；
- profile 名只能包含 ASCII 字母、数字、`_`、`-`、`.`，不能为空；
- 不传连接参数时，会恢复当前 profile 上次保存的目标；从来没有记录过就落到 `localhost:5666`。

## 端口和 scheme 怎么推

用 `--scheme auto`（默认）且**没有显式指定 `--port`** 时：

| 目标 | 推导结果 |
| --- | --- |
| 回环地址（localhost/127.0.0.1） | `http:5666` |
| 远端 IP | `https:5667` |
| 远端域名 | `https:443` |

显式传了 `--port` 时，端口以你为准，CLI 只负责推导 scheme。

## 两步授权

### 第 1 步：生成链接

```bash
fnos-cli --profile home --host 192.168.1.10 --port 5666 login --authorize-only
```

输出里有 `authorization_url`（含 PKCE challenge、client、scope、device 参数）。**原样复制，不要改**，它故意不含 `redirect_uri`。

如果看到 `authorization_pending=true`，那只是「等待授权」，不代表已经登录。

### 第 2 步：浏览器授权

自己打开链接 → 输入账号密码 → 过 2FA → 点同意。页面给出一串一次性 code，**5 分钟内有效，只能用一次**。

### 第 3 步：换令牌

```bash
fnos-cli --profile home --host 192.168.1.10 --port 5666 login --code '那串code'
```

成功的标志：

```text
token_persisted=true
refresh_token_persisted=true
```

然后用同一 profile 跑一条只读命令确认：

```bash
fnos-cli --profile home system info
```

:::danger 这四件事必须完全一致
第 1 步和第 3 步必须在**同一执行主机、同一系统用户、同一配置环境、同一 profile、同一 host/port/scheme/TLS** 下执行。

- 走 SSH 到另一台机器授权，本机不共享；
- 在容器里授权，宿主机不共享；
- 远端明文 HTTP 时两步都要带 `--scheme http --allow-insecure-http`。

另外：每个 profile 同时只能有一个 pending 授权，**等 code 期间别重复执行第 1 步**，会覆盖掉原来的 verifier。
:::

## 令牌存在哪

| 项 | 存放位置 |
| --- | --- |
| access / refresh token、PKCE verifier | 平台安全存储（macOS Keychain、Linux secret service），失败时可回落文件存储 |
| 设备安全访问码（如设备启用了） | 同一 profile 的受控 session，CLI 自动加到请求头 |
| 你的明文密码、2FA | **不经过 CLI**，只在浏览器里 |

`FNOS_CLI_SESSION_STORAGE=file` 只建议用于隔离测试或 CI；`ask-file` 会在安全存储失败时询问是否降级。

macOS 第一次读写 Keychain 可能弹出系统授权框，点允许即可 —— 这不是报错。

## 令牌会自己续期

- access token 快到期（60 秒内）时自动 refresh；
- 手工刷新：`fnos-cli --profile home login --refresh`；
- 代理或原生 HTTP 返回 401 时，CLI 按 profile 加锁刷新并**只重试一次**，第二次还 401 就停；
- 刷新前会先确认存储可写，避免白白消耗可能轮换的 refresh token。

## 断开与重连

```bash
fnos-cli --profile home logout      # 清当前 profile 的 session 和 pending
```

需要重新登录就走完整两步流程。不要试图用旧的 access token、refresh token 或账号密码「恢复」—— CLI 不支持这条路。

:::tip 什么时候必须重新授权
- 升级了 CLI/Skill 版本
- 设备换了地址或端口
- 401 循环、网关要求重新登录
- 设备启用了新的安全访问码策略
:::

## 自签证书与明文 HTTP

```bash
# 自签 HTTPS
fnos-cli --host 192.168.1.10 --port 5667 --tls-insecure system info

# 远端明文 HTTP（有风险，仅限可信内网）
fnos-cli --host 192.168.1.10 --port 5666 --scheme http --allow-insecure-http system info
```

:::warning
`--tls-insecure` 会跳过证书校验，`--allow-insecure-http` 会让令牌走明文。两个都只应在你能确认网络可信时使用。
:::
