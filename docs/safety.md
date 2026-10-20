---
title: 安全边界与高危操作
description: 读懂 --yes 的含义、哪些命令真的危险、Agent 该在什么时候停下来问你，以及令牌与授权码的处理约定。
sidebar_position: 5
---

# 安全边界与高危操作

fnos-cli 的设计假设很朴素：**只读操作默认放行，会改变设备状态的操作必须显式确认。** 理解这条线，你就知道什么时候该盯着屏幕。

## `--yes` 是什么

不是「跳过确认」，而是**你本人在场并且同意**。缺了它，命令直接拒绝执行（通常 exit code 非 0），不会悄悄做完。

```bash
fnos-cli file rm /vol1/1000/temp --yes
```

:::warning `--force` 不能替代 `--yes`
两条是独立机制。`--force` 只影响业务逻辑（比如强制覆盖），不代表你授权了这次写操作。
:::

## `raw` 的例外

`raw` 用于调用还没被封装的端点。规则只有一条：

- **内置审计过的只读端点**：不需要 `--yes`；
- **其他任何端点（包括名字看起来只读的）**：必须加 `--yes`。

:::danger 别拿端点名字当证据
`appcgi.storage.format` 和 `appcgi.storage.getConf` 名字结构一样，一个是格式化，一个是读配置。**名字不能证明只读**，拿不准就加 `--yes` 并先跑只读探测。
:::

## 高危清单

下面这些操作，Agent 应该先说明「我要做什么、影响哪台机器、哪个路径」，得到你确认才执行。

| 操作 | 命令 | 风险 |
| --- | --- | --- |
| 重启 / 关机 | `power reboot` / `power poweroff` | 中断所有服务，正在跑的下载、Docker、备份全断 |
| 格式化 / 建池 / 扩容 / 换盘 | `storage format`、`storage create`、`storage extend`、`storage replace-disk` | **不可逆的数据丢失** |
| 卸载磁盘 | `storage disk-umount` / `storage umount` | 依赖该卷的服务立刻失败 |
| 删除文件 | `file rm`、`file trash clear` | 回收站清空后无法恢复 |
| 改权限 / 改属主 | `file acl set`、`file chown` | 可能让其他账号失去访问权 |
| 卸载应用 | `app uninstall` | 应用数据是否保留取决于应用本身 |
| 停止 / 删除容器 | `docker container stop`/`rm` | 服务中断，卷映射可能被误删 |
| 删除下载任务 | `download rm` | 连带已下载文件 |
| 清空日志 | `logger clear` | 审计线索消失 |
| 开关 SSH | `network ssh switch` | 安全暴露面变化 |

## 三条固定动作

**① 写之前先读。** 存储类操作尤其要先看清现状：

```bash
fnos-cli storage pools
fnos-cli storage disks
fnos-cli storage free-disks
```

**② 能用 `--dry-run` 就先跑。** 应用安装和更新支持：

```bash
fnos-cli app install <app> --version <v> --volume-id <id> --dry-run --yes
```

它只下载、解析、做安全检查，不启动安装。本地 FPK 也一样：

```bash
fnos-cli app install-fpk ./demo.fpk --volume-id <id> --dry-run --yes
```

**③ 路径必须具体。** 写操作默认只接受规范的 `/vol{n}/...` 路径，不接受 `/`、相对路径或猜测出来的路径。`download`、`file`、`storage` 都一样。

## 授权码与令牌的处理约定

这部分是给 Agent 的硬约束，你自己也要知道：

| 对象 | 规则 |
| --- | --- |
| 一次性授权 code | 只接收你主动发的那串；不复述、不写日志、不转发、不放进 shell trace |
| access / refresh token | 留在 CLI 受控存储里，任何情况下都不出现在聊天或命令参数中 |
| PKCE verifier | 同上，由 CLI 管理 |
| 账号密码、2FA | 只在浏览器输入，CLI 全程不接触 |
| 设备安全访问码 | CLI 自己从 token 响应里取并保存，Agent 不接收也不复述 |

:::caution 现实一点
授权 code 会经过聊天记录、工具调用日志，也可能出现在本机进程参数里。**没人能承诺「聊天侧零留存」**，所以它的有效期被压到 5 分钟、且只能用一次。用完即废，这是它唯一的安全垫。
:::

## 多设备 / 多身份的隔离

- 不同 profile 的令牌、配置、目标完全隔离；
- 「设备验收」这类只读检查只用当前 profile 的会话，切换身份要显式换 profile；
- 不会读取或迁移旧产品、旧版本的登录数据；
- Agent 不会被要求构造密码、2FA 或手工 access token —— 一旦有人这么要求，就是错的。

## 给 Agent 的一句话

> 只读先跑；写操作先说明影响面并等确认；高危操作先给出现状、再给出命令、最后才执行；路径用具体的 `/vol{n}/...`；令牌和 code 不出现在回复里。
