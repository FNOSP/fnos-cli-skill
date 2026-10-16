# fnOS CLI Skill

fnOS 的使用指南与公开集成内容。运行时 CLI 与 Skill 来自同一 npm 包版本。

## 安装 Skill

```bash
npx skills add fnnas-labs/fnos-cli-skill --skill fnos-cli -g
```

## 安装或升级 CLI

需要 Node.js 18+，执行以下命令显式安装或升级：

```bash
npm install -g @fnnas-labs/fnos-cli@latest
fnos-cli --version
fnos-cli --help
```

`latest` 在发布处理期间可能仍指向旧版；已有安装不会自动更新。只安装 Skill 不会安装 CLI，也不会登录。两产品状态独立，本版需要重新授权；旧凭据保留，不读取或迁移。

## 授权与使用

从 [Skill 主入口](skills/fnos-cli/SKILL.md)开始。Agent 运行 `login --authorize-only` 提供链接，用户自行在浏览器登录并回传一次性 code。Agent 保持目标、profile 与执行环境一致，运行 `login --code` 并验证令牌保存及只读请求。无需用户终端；不要提供密码或 token。详细流程见 [OAuth 指南](skills/fnos-cli/reference/oauth.md)。fnOS 的 DSH 使用同包启动器和 Skill。

## 许可

标准 MIT，版权主体为 Guangzhou TR Intelligent Manufacturing Technology Co., Ltd.，覆盖分发的 CLI、Skill 与集成代码，不覆盖 NAS 操作系统、服务端或 API 访问授权。详见 [LICENSE](LICENSE) 与 [第三方声明](THIRD_PARTY_NOTICES.txt)。

# fnOS CLI 的 DSH 集成

`@fnnas-labs/fnos-cli` 包含原生 CLI、同版本 Skill 和 DSH bundle。bundle 激活 `npm/dsh.mjs`，向 Skill 服务显式注册 `fnos-cli`；安装 bundle 与注册 Skill 是两个步骤。

安装到实际使用的 DSH profile，例如：

```sh
dsh plugin --profile headless add @fnnas-labs/fnos-cli@latest
```

npm 处理发布期间 `latest` 可能仍为上一版。检查安装版本及命令帮助；已有 DSH 安装需要显式升级。复现特定版本时，用明确版本替换 `latest`。

Skill 根据资源目录定位同包 `../npm/run.cjs`，并指导 Agent 通过 Node 调用；不依赖全局命令。适配器仅加载包内文档，不执行命令、不自动添加写确认参数、不登录。

## 通过公开 GitHub 桥接安装

```sh
dsh plugin --profile headless add github:fnnas-labs/fnos-cli-skill
```

桥接声明依赖 `@fnnas-labs/fnos-cli@latest`，由 `index.mjs` 加载实际安装依赖中的适配器、同包 CLI 与 Skill。无需全局 CLI。Git tag 不锁定 CLI 版本；包管理器 lockfile 可能保留旧依赖，需要显式升级。需要可复现安装时选择明确 npm 版本。公开仓库中的适配器是审阅快照，运行时使用安装依赖提供的适配器。

## 首次授权

Agent 使用同一个包内启动器，分别执行：

```sh
node "<resolved-launcher>" --profile <profile> --host <nas-host> --port <port> login --authorize-only
# 用户打开链接、授权并主动回传一次性 code 后执行：
node "<resolved-launcher>" --profile <profile> --host <nas-host> --port <port> login --code '<code>'
```

使用用户指定的 NAS 与端口；未知时询问，不猜测 localhost。两步及后续请求保持同一连接参数（含 HTTP/TLS）、profile、执行主机、系统用户和配置环境。用户只在浏览器授权并回传 code，无需终端或交互 DSH TTY。完整过期、pending 和 code 保密规则见包内 `reference/oauth.md`。确认令牌保存并完成只读请求后才报告成功。SSH 和容器需要自己的启动器和状态；macOS Keychain 可能需要系统批准。

## 手动集成检查

DSH 验收由用户安排，不在每次 CI 自动执行。选择固定候选，成功结果包含包名、版本、tarball SHA-256、运行环境及未覆盖范围；其他哈希的结果不能用于重建后的包，即使版本相同。

需要 Node.js、npm、pnpm 和 DSH 支持的 macOS/Linux shell，对实际 npm tarball 执行：

```sh
node npm/dsh-integration.mjs --tarball /absolute/path/fnnas-labs-fnos-cli-0.2.1.tgz
```

此检查固定 DSH `0.2.0-rc.2`，在隔离 DSH Home 安装候选，通过本地脚本模型驱动真实 headless Agent 的 `skill` 与 `bash` 工具。无需模型服务密钥、NAS 或 OAuth。覆盖 Skill 发现、从资源推导同包启动器、原生帮助、虚拟 profile 的只读连接尝试和未经确认写操作的拒绝。PATH 仅包含 Node；安装路径包含空格和单引号。日志与隔离配置保存在 `.tmp/`。

显式 `FNOS_DSH_CLI` 可指定已安装的 DSH CLI；`FNOS_DSH_NPM_CACHE`、`FNOS_DSH_PNPM_STORE` 可复用依赖缓存，不改变隔离 Home 与 CLI 状态目录。

成功仅证明工具链，不证明真实模型自主选 Skill、NAS 授权、后台 Keychain 或 Windows。Linux/Windows 手测与真实模型验收分别记录；现有 shell 路径优先，只有平台验收证明需要时才增加专用 argv 工具。

## 可选 macOS 真机检查

已完成当前 profile 的 OAuth 后，可由维护者对已审阅候选执行独立真机检查。该辅助检查不作为消费者命令分发，也不挂默认 CI：

```sh
node npm/dsh-device-acceptance.mjs --tarball /absolute/path/fnnas-labs-fnos-cli-0.2.1.tgz --profile <existing-profile> --use-existing-session
```

仅当授权目标使用明文 HTTP 时增加 `--allow-insecure-http`。检查沿用调用用户的配置环境与安全存储，仅创建隔离 DSH Home/workspace。拒绝 file/ask-file 存储及已有旧文件回落的 profile，保留文件、不读取内容。不执行登录、不接收 code 或密码。脚本模型指挥实际 Skill 与 shell 执行包内帮助、系统信息、当前用户信息及重复只读请求。PATH 保留 macOS 系统工具以访问 Keychain，并检查全局 CLI 不参与执行。

报告绑定候选哈希并声明脚本模型限制；设备输出仅留在私有 `.tmp/` 日志，摘要记录输出哈希。成功证明后台 DSH 复用既有状态，不代表首次手动授权、自然到期刷新、真实模型自主选择、Linux/Windows、npm registry 或 Market 安装已通过。
