---
title: 本站怎么运转的
description: 导读区与参考区的关系、内容如何从上游自动同步、以及怎么用同一套工作流部署你自己的站点。
sidebar_position: 8
---

# 本站怎么运转的

## 两个区，各管一件事

| 区域 | 内容 | 谁维护 | 会不会过时 |
| --- | --- | --- | --- |
| **新手入门**（左侧上半） | 简介、上手指南、授权、安全边界、速查表、排错 | 人手写，面向人类阅读习惯 | 需要人工跟进 |
| **参考手册**（左侧下半） | `SKILL.md`、13 个任务入口、19 个模块手册、5 个场景流程 | 从上游仓库自动同步，一字不改 | 每次构建自动刷新 |

这样分工的原因很实际：**Agent 文档要精确到「这条命令的哪个字段会返回 null」，人类文档要回答「我该先做什么」。** 把两者混在一篇里，两边都写不好。

参考区每一页的顶部都有一个「这一页是 Agent 原文」的提示条，底部标注了它来自哪个源文件。你在那里看到的措辞——「Agent 在用户指定的 profile 执行」——是故意保留的，因为那份文本是给模型读的。

## 同步是怎么做的

构建时，`scripts/sync-skill.mjs` 会：

1. 读取上游 `skills/fnos-cli/`（或仓库内的 `skill-snapshot/` 快照兜底）；
2. 抽掉 Skill frontmatter（`name` / `description`），换成网页需要的标题和描述；
3. 处理几个**必须**改的命名：`SKILL.md` → `index.md`，`_index.md` → `index.md`，`_conventions.md` → `conventions.md`（Docusaurus 会忽略下划线开头的文件）；
4. 修掉指向这些文件的相对链接 —— 其余链接和目录层级**完全保留**，所以上游文档里 `../reference/file.md` 这类路径在网站上一样能点通；
5. 给每页注入提示条与来源署名；
6. 生成侧边栏（顺序跟 `SKILL.md` 的任务一览、`reference/_index.md` 的索引一致）。

源文档一个字都不重写。这样做的好处是：上游改了命令参数，你不需要改本站；坏处是参考区的语气永远偏向 Agent。

## 更新节奏

- 上游 `main` 每次变化，镜像仓库同步后，站点工作流会重新拉取内容并构建；
- 站点本身也有每日定时构建，防止「上游改了但没触发」；
- 也可以手动触发：仓库 `Actions` → `Deploy docs` → `Run workflow`。

## 页面结构约定

```text
site/
├─ docs/                 手写导读（人类视角）
│  ├─ intro.md  quickstart.md  install.md  authorize.md
│  ├─ safety.md  cheatsheet.md  troubleshooting.md  site-guide.md
│  └─ skill/             ← 自动生成，不要手改
├─ scripts/sync-skill.mjs  同步与转换脚本
├─ src/pages/index.tsx     自定义首页
├─ src/css/custom.css      品牌样式
├─ skill-snapshot/         上游不可达时的兜底内容
└─ static/                 logo、favicon 等静态资源
```

`docs/skill/` 和 `sidebars.skill.generated.ts` 都在 `.gitignore` 里 —— 每次构建重新生成，不提交，避免和上游产生无意义的 diff。

## 部署自己的副本

工作流文件在 `.github/workflows/deploy-docs.yml`。做法：

1. 把本目录内容推到仓库的 `site` 分支（源码分支，不要放 `main`，`main` 会被镜像流程重置）；
2. 把同一份 `deploy-docs.yml` 放到 `main` 的 `.github/workflows/` 下 —— `main` 上的 `.github/` 会被镜像流程保留，定时任务也只从默认分支触发；
3. 仓库 `Settings → Pages → Source` 选 **GitHub Actions**；
4. 需要换域名或仓库名时，改工作流顶部的 `DOCS_URL` / `DOCS_BASE_URL` 两个变量即可，不用动 `docusaurus.config.ts`。

:::warning 为什么源码单独放一个分支
镜像流程的同步逻辑是「重置工作区到上游快照，只保留 `.github/`，然后 force push 到 `main`」。任何放在 `main` 的站点文件都会被下一次同步清掉。放到 `site` 分支既躲开了 force push，也不用改动镜像流程本身。
:::

## 内容更新后什么时候上线

四种触发方式，任选其一：

| 触发 | 时机 | 说明 |
| --- | --- | --- |
| `push` 到 `site` 分支 | 改动了 `docs/`、`src/`、`static/`、`scripts/` 或站点配置 | 只有工作流 `paths` 白名单里的文件才会触发，例如只改 `README.md` 不会重建 |
| 上游同步后派发 | `sync-upstream` 拉到新内容并推送成功 | 内容有变化才派发，没变化不白跑 |
| 每日定时 | 每天 10:23（UTC+8） | 兜底，保证站点不会长期落后于上游 |
| 手动 | `Actions → Deploy docs → Run workflow` | 想立刻重建时用 |

## 提交规范

仓库统一用英文 Conventional Commits，`<type>(<scope>): <subject>`，
主题行不超过 72 字符、祈使句、小写开头、结尾不加句号，正文写「为什么」。

站点内容是中文、提交信息是英文：这份历史也会出现在镜像仓库里，
英文日志对上游使用者更友好，也方便按 `type` 过滤变更。

## 免责声明

本站是社区维护的中文文档，内容来自 [`fnnas-labs/fnos-cli-skill`](https://github.com/fnnas-labs/fnos-cli-skill)（MIT 许可），**不是飞牛官方站点**。命令行为以你实际安装的 CLI 版本为准，遇到差异请以 `--help` 输出为准。
