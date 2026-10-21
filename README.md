# fnos-cli 中文文档站

把 [`fnos-cli-skill`](https://github.com/fnnas-labs/fnos-cli-skill) 的 Agent 文档转成人类可读的在线文档站，部署在 GitHub Pages。

- 框架：Docusaurus 3（`@docusaurus/preset-classic` + 本地中文搜索）
- 内容：**手写导读区**（人写的）+ **自动同步参考区**（上游原文，构建时生成）
- 部署：`main` 分支的 `.github/workflows/deploy-docs.yml` 触发构建，发布到这个仓库的 Pages

## 为什么源码放在 `site` 分支

镜像仓库的同步流程是「重置工作区到上游快照 → 只保留 `.github/` → force push 到 `main`」。
任何提交到 `main` 的站点文件都会在下次同步时被清掉，所以：

| 分支 | 放什么 | 谁改 |
| --- | --- | --- |
| `main` | 上游镜像 + `.github/workflows/` | 镜像流程（自动） |
| `site` | 本文档站全部源码 | 人工 |

工作流会自己从 `main` 取 `skills/fnos-cli/`，所以站点内容永远跟着镜像走，不需要人搬。

## 目录

```text
.
├─ docs/                    手写导读（人类视角，8 篇）
│  └─ skill/                ← 自动生成，已 gitignore，不要手改
├─ scripts/sync-skill.mjs   同步 + 转换脚本（核心）
├─ skill-snapshot/          上游取不到时的兜底内容
├─ src/
│  ├─ css/custom.css        品牌样式（配色、表格、侧边栏）
│  ├─ pages/index.tsx       自定义首页
│  └─ data/skillMeta.ts     ← 自动生成
├─ static/img/              logo、favicon
├─ docusaurus.config.ts     站点配置（标题、导航、页脚、搜索）
├─ sidebars.ts              导读区侧边栏（手写）
└─ sidebars.skill.generated.ts  ← 自动生成
```

## 本地开发

```bash
npm ci                       # 按 package-lock.json 装（CI 用同一条命令）
npm run start                # 自动同步 + 本地预览 http://localhost:3000
npm run check                # 结构自检：frontmatter / 相对链接 / 侧边栏 id / 站内路由
npm run build                # 产出 build/
```

想指定内容来源（例如直接读本地已安装的 Skill）：

```bash
SKILL_SOURCE="$HOME/.claude/skills/fnos-cli" npm run start
```

单独跑同步：

```bash
node scripts/sync-skill.mjs --source /path/to/skills/fnos-cli
```

默认取内容顺序：`--source` / `SKILL_SOURCE` → `../skills/fnos-cli` → `./skills/fnos-cli` → `~/.skills-manager/skills/fnos-cli` → `~/.claude/skills/fnos-cli` → `./skill-snapshot`。

> `scripts/_*.mjs` 是本机上生成过的临时脚本，已 gitignore，可以随手删掉：`rm scripts/_*.mjs`。

## 一次性部署配置

1. 推代码到 `site` 分支。

   **`site` 分支的根目录 = 本目录的内容**，不要再套一层 `site/`。工作流是在分支根目录直接跑 `npm ci` 的。

   本目录已经初始化成 git 仓库，分支名就叫 `site`，首个提交已就绪，只需接上远程：

   ```bash
   git remote add origin https://github.com/FNOSP/fnos-cli-skill.git
   git push -u origin site
   ```

   共 61 个文件 / 540 KB。`node_modules/`、`build/`、`.docusaurus/`、`docs/skill/`、`sidebars.skill.generated.ts`、`src/data/skillMeta.ts` 都在 `.gitignore` 里，不会进仓库。

   > 这个分支和 `main` 的历史无关（orphan），推送时会新建分支，不影响镜像流程。

2. **让 `main` 上出现部署工作流**——`sync-upstream.yml` 会每次自动从 `site` 分支复制 `deploy-docs.yml` 到 `main`，所以正常情况下**不用手工复制**：

   - 如果已经改好了 `sync-upstream.yml`（见下一节），等它按计划跑一次，「同步上游 → 文档构建」就自动打通了；
   - 想立刻生效，也可以先手动填一次空档：

     ```bash
     git worktree add ../mirror main
     mkdir -p ../mirror/.github/workflows
     cp .github/workflows/deploy-docs.yml ../mirror/.github/workflows/
     cd ../mirror && git add .github/workflows/deploy-docs.yml \
       && git commit -m "ci: 部署文档站" && git push origin main
     ```

   > 推送 workflow 文件需要带 `workflow` 权限的 token（和 `SYNC_PAT` 同一要求）。
   > 两个分支各存一份：`site` 那份响应 push，`main` 那份负责定时和派发。**只改 `site` 的**，`main` 上的是自动覆盖的产物。

### 同步上游时顺带重建文档站

`main` 的 `.github/workflows/sync-upstream.yml` 里已经接好两件事：

1. 每次同步都把 `site` 分支的 `deploy-docs.yml` 放进本次提交 → `main` 上这份文件会被自动维护，误删也能自愈；
2. 本次同步确实产生了新提交时，用 `SYNC_PAT` 派发一次 `deploy-docs`（`workflow_dispatch`），文档站立刻按最新内容重建。

没有变化就不派发，不会每 6 小时白跑一次构建；文档站自己还有每日 10:23 的定时任务兜底。

3. 仓库 `Settings → Pages → Source` 选 **GitHub Actions**。

4. 手动跑一次：`Actions → Deploy docs → Run workflow`。

站点地址默认是 `https://<owner>.github.io/fnos-cli-skill/`。换成自定义域名时，只改工作流顶部的 `DOCS_URL` / `DOCS_BASE_URL` 两个变量（再在 `static/` 放 `CNAME`）。

## 改内容时改哪里

| 想改的东西 | 改这里 |
| --- | --- |
| 新人读的教程、FAQ、速查表 | `docs/*.md` |
| 首页文案与模块卡片 | `src/pages/index.tsx` |
| 配色、字号、表格样式 | `src/css/custom.css` |
| 导航栏、页脚、搜索 | `docusaurus.config.ts` |
| 参考区任何文字 | **不要改**，去改上游 `skills/fnos-cli/` |
| 侧边栏顺序 | `scripts/sync-skill.mjs` 里的 `ENTRY_ORDER` / `MODULE_ORDER` |

## 排错

### `Get Pages site failed ... HttpError: Not Found`（Build 56 秒就红）

```
HttpError: Not Found - https://docs.github.com/rest/pages#get-a-pages-site
Get Pages site failed. Please verify that the repository has Pages enabled
and configured to build using GitHub Actions
```

**这不是构建失败**——报错来自 `configure-pages`，前面 `npm ci / sync / check / build` 全都过了。
意思是仓库还没开 Pages（`GET /repos/{owner}/{repo}/pages` 返回 404）。

修法：`Settings → Pages → Build and deployment → Source` 选 **GitHub Actions**（不是 “Deploy from a branch”），
保存后回到 Actions 点 **Re-run jobs**，不用改代码、不用重新推送。

工作流里已加了一步 `Check Pages enablement` 做预检，之后遇到这两种情况会直接给出可照做的提示，
而不是一句 `HttpError`：

| 接口返回 | 提示 |
| --- | --- |
| 404 | Pages 尚未启用 → 去 Settings → Pages 选 GitHub Actions |
| 200 但 `build_type=legacy` | 构建来源是分支部署 → 改成 GitHub Actions |
| 403 / 网络异常 | 只警告，继续尝试部署（不误伤） |

> 为什么不用 `configure-pages` 的 `enablement: true` 自动开？它明确要求**非 `GITHUB_TOKEN` 的 token**
> （PAT 需 `repo` 或 Pages 写权限，App 需 `administration:write` + `pages:write`）。
> 用内置 token 开不了，所以这一步只能手工点一次。

### `Node.js 20 is deprecated ... forced to run on Node.js 24`

只是警告，不影响运行。工作流里的 action 已升到 node24 版本：
`checkout@v7`、`setup-node@v7`、`configure-pages@v6`、`upload-pages-artifact@v5`、`deploy-pages@v5`。

### `npm run start` 报 `sh: docusaurus: command not found`

包体装进去了、`node_modules/.bin/` 却是空的——npm 创建 bin 链接那一步被打断（本机沙箱拦截 `write-file-atomic` 的临时文件 + rename）。判断方法：

```bash
ls node_modules | wc -l        # 几百个
ls node_modules/.bin | wc -l   # 0
```

补一个链接就能跑，不用重装：

```bash
mkdir -p node_modules/.bin
ln -sf ../@docusaurus/core/bin/docusaurus.mjs node_modules/.bin/docusaurus
```

补完还报 `Cannot find module 'xxx'`（常见于 `chalk`、`braces`、`@jsonjoy.com/fs-*` 这类小包），说明包被解压截断了，只能干净重装：
`rm -rf node_modules && npm ci`。

> 注意 `build` 和 `start` 依赖的包不完全一样：`start` 多一条 webpack-dev-server 链路，
> 所以可能出现「`npm run build` 能过、`npm run start` 挂」的情况，问题仍在依赖不完整，不在站点配置。

### Deploy 步骤报 `environment` 需要审批

`build` 成功但 `deploy` 卡在 Waiting：仓库配了 `github-pages` 环境的保护规则。
`Settings → Environments → github-pages → Deployment protection rules` 里去掉 Required reviewers 即可。

### Deploy 一个步骤都没有就失败（拉日志返回 `BlobNotFound`）

`github-pages` 环境默认带一条**分支白名单**，通常只允许 `main`。从 `site` 分支推上去的构建，
`build` 全绿、`deploy` 却在启动阶段被拒：`jobs` 里该作业 `conclusion: failure` 但 `steps` 为空，
日志接口返回 `BlobNotFound`，看起来很诡异，其实和 Pages 本身无关。

两种修法：

- 把 `site` 加进白名单（本仓库已经加过；`Settings → Environments → github-pages → Deployment branches and tags`，或用 API：`POST /repos/{owner}/{repo}/environments/github-pages/deployment-branch-policies`，body `{"name":"site","type":"branch"}`）；
- 或者只让 `main` 部署：删掉工作流的 `push` 触发，全部走 `sync-upstream` 派发 + 每日定时。

另外注意 `push` 触发带 `paths` 白名单：只改 `README.md`、或提交为空，都不会触发构建。


## 提交信息规范

统一使用英文 Conventional Commits，格式 `<type>(<scope>): <subject>`：

- 主题行不超过 72 字符，祈使句、小写开头、结尾不加句号
- 正文说明「为什么」，每行 72 字符内换行，要点用 `-` 列表
- 一个提交只做一件事，方便 review 和回滚

| type | 用途 |
| --- | --- |
| `feat` | 新增能力：页面、脚本、构建行为 |
| `fix` | 修复缺陷 |
| `docs` | 只改文档 |
| `ci` | 工作流 |
| `refactor` | 不改行为的重构 |
| `chore` | 脚手架、依赖、快照等杂项 |

scope 用模块名：`site` / `sync` / `guide` / `brand` / `check` / `ci` / `deps` / `snapshot` / `readme`。

```text
feat(sync): generate the reference section from the Agent docs
ci(pages): fail fast when Pages is disabled, bump actions
docs(guide): add the safety model and command cheatsheet
chore(deps): commit the lockfile for reproducible installs
```

提交信息用英文、站点内容用中文：这个分支也会被镜像仓库的使用者浏览，英文日志在他们的 `git log` 里不需要额外翻译。
