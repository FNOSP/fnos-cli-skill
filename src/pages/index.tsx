import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import skillMeta from '@site/src/data/skillMeta';
import styles from './index.module.css';

const modules = [
  {
    name: '文件',
    desc: '列目录、搜索、上传下载、共享目录与 ACL、回收站',
    to: '/docs/skill/entries/trim-file',
  },
  {
    name: '照片',
    desc: '相册目录、条件搜图、自然语言搜图、缩略图地址',
    to: '/docs/skill/entries/trim-photos',
  },
  {
    name: '应用中心',
    desc: '安装、更新、启停、卸载，支持本地与 NAS 上的 FPK',
    to: '/docs/skill/entries/trim-app',
  },
  {
    name: 'Docker',
    desc: '镜像拉取、容器生命周期、Compose 项目',
    to: '/docs/skill/entries/trim-docker',
  },
  {
    name: '下载',
    desc: '磁力/种子/URL 建任务，暂停恢复、重试删除',
    to: '/docs/skill/entries/trim-download',
  },
  {
    name: '百度网盘',
    desc: '云端浏览、分享转存到 NAS、上传下载、定时同步',
    to: '/docs/skill/entries/trim-baidu-netdisk',
  },
  {
    name: '日志',
    desc: '分页筛选、导出、归档策略、诊断日志打包',
    to: '/docs/skill/entries/trim-log',
  },
  {
    name: '监控',
    desc: 'CPU、内存、网络、磁盘、进程、温度与蜂鸣器告警',
    to: '/docs/skill/entries/trim-monitor',
  },
  {
    name: '网络',
    desc: '网络服务开关，目前主要是 SSH',
    to: '/docs/skill/entries/trim-network',
  },
  {
    name: '存储',
    desc: '存储池、磁盘、SMART 健康、挂载与高风险写操作',
    to: '/docs/skill/entries/trim-storage',
  },
  {
    name: '系统与电源',
    desc: '机型、版本、内核、卷、硬件、电源计划、重启关机',
    to: '/docs/skill/entries/trim-system',
  },
  {
    name: '用户与权限',
    desc: '用户、用户组、登录设备与当前权限',
    to: '/docs/skill/entries/trim-user',
  },
  {
    name: '连接与授权',
    desc: 'OAuth 登录、profile 隔离、令牌刷新、连接排错',
    to: '/docs/skill/entries/trim-shared',
  },
];

const steps = [
  {
    title: '装一次 Skill',
    text: '一条 npx 命令把说明书装进你的 Agent。CLI 本体在首次运行时自动下载并校验，不需要 Node 也能跑。',
  },
  {
    title: '浏览器里授权',
    text: 'Agent 给你一个链接，你登录 fnOS 并确认，把页面上的 5 分钟一次性 code 发回去。密码不经过命令行。',
  },
  {
    title: '用中文提需求',
    text: '「看看下载目录里最大的十个文件」「把网盘那个分享存到 NAS」。只读操作直接跑，写操作会先问你。',
  },
];

function TerminalCard() {
  return (
    <div className={styles.terminal} aria-hidden="true">
      <div className={styles.termBar}>
        <span className={styles.termDots}>
          <span style={{background: '#ff5f57'}} />
          <span style={{background: '#febc2e'}} />
          <span style={{background: '#28c840'}} />
        </span>
        <span className={styles.termTitle}>zsh — fnos-cli</span>
      </div>
      <div className={styles.termBody}>
        <div className={styles.termLine}>
          <span className={styles.prompt}>$</span>
          <span className={styles.cmd}>npx skills add fnnas-labs/fnos-cli-skill </span>
          <span className={styles.flag}>--skill fnos-cli -g</span>
        </div>
        <div className={styles.termLine}>
          <span className={styles.out}>  ✓ fnos-cli installed</span>
        </div>
        <div className={styles.termLine}> </div>
        <div className={styles.termLine}>
          <span className={styles.prompt}>$</span>
          <span className={styles.cmd}>fnos-cli --profile home login </span>
          <span className={styles.flag}>--authorize-only</span>
        </div>
        <div className={styles.termLine}>
          <span className={styles.out}>  authorization_url https://nas.local/oauth/authorize?...</span>
        </div>
        <div className={styles.termLine}>
          <span className={styles.prompt}>$</span>
          <span className={styles.cmd}>fnos-cli --profile home login --code </span>
          <span className={styles.str}>'A1B2-C3D4'</span>
        </div>
        <div className={styles.termLine}>
          <span className={styles.out}>  token_persisted=true</span>
        </div>
        <div className={styles.termLine}> </div>
        <div className={styles.termLine}>
          <span className={styles.prompt}>$</span>
          <span className={styles.cmd}>fnos-cli --profile home system info</span>
        </div>
        <div className={styles.termLine}>
          <span className={styles.out}>  model FNOS-X86  version 0.9.x  vols 2</span>
          <span className={styles.cursor} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout
      title="fnos-cli 中文文档"
      description="用命令行和 AI Agent 管理飞牛 fnOS：文件、照片、应用、Docker、存储、监控。面向中文新手的中文文档站。"
    >
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={clsx(styles.shell, styles.heroInner)}>
            <div>
              <span className={styles.badge}>
                <span className={styles.badgeDot} />
                CLI {skillMeta.cliVersion} · {skillMeta.totalDocs} 篇文档 · MIT
              </span>
              <h1 className={styles.title}>
                让 AI 帮你管飞牛 NAS，
                <br />
                <span className={styles.titleAccent}>用一句话代替十次点击</span>
              </h1>
              <p className={styles.subtitle}>
                fnos-cli 把 fnOS 的文件、照片、应用、Docker、存储、监控都变成命令；
                配套的 Agent Skill 让模型知道该跑哪一条。这里是它的中文文档。
              </p>
              <p className={styles.titleAccent}>
                如本项目对您提供有效帮助，欢迎前往项目仓库点击 <strong>Start</strong> 给与支持。
              </p>
              <div className={styles.ctaRow}>
                <Link className={styles.btnPrimary} to="/docs/quickstart">
                  5 分钟上手 →
                </Link>
                <Link className={styles.btnGhost} to="/docs/cheatsheet">
                  命令速查表
                </Link>
                <Link className={styles.btnGhost} to="https://github.com/FNOSP/fnos-cli-skill">
                  前往项目仓库
                </Link>
              </div>
              <div className={styles.metaRow}>
                <span>
                  <strong>{skillMeta.entryCount}</strong> 个任务入口
                </span>
                <span>
                  <strong>{skillMeta.moduleCount}</strong> 个模块手册
                </span>
                <span>
                  <strong>{skillMeta.workflowCount}</strong> 条场景流程
                </span>
                <span>
                  基于社区镜像仓库 <strong>自动构建文档</strong>
                </span>
              </div>
            </div>
            <TerminalCard />
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>capabilities</p>
                <h2 className={styles.sectionTitle}>13 个模块，都在命令行里</h2>
                <p className={styles.sectionDesc}>
                  每个模块都是 fnOS 网页功能的直接映射。点进去看规则、命令和高风险提示 ——
                  那些页面是 Agent 读的原文，措辞直白但精确。
                </p>
              </div>
              <Link className={styles.sectionLink} to="/docs/skill/">
                全部参考手册 →
              </Link>
            </div>
            <div className={styles.grid}>
              {modules.map((m, i) => (
                <Link key={m.name} className={styles.card} to={m.to}>
                  <div className={styles.cardIndex}>{String(i + 1).padStart(2, '0')}</div>
                  <h3 className={styles.cardTitle}>{m.name}</h3>
                  <p className={styles.cardDesc}>{m.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={clsx(styles.section, styles.sectionAlt)}>
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>two paths</p>
                <h2 className={styles.sectionTitle}>交给 Agent，或者自己敲</h2>
                <p className={styles.sectionDesc}>
                  两条路跑的是同一个二进制、共用同一份登录状态。先用 Agent 上手，需要自动化时再写脚本。
                </p>
              </div>
            </div>
            <div className={styles.paths}>
              <div className={styles.pathCard}>
                <span className={styles.pathTag}>PATH A · 推荐新手</span>
                <h3 className={styles.pathTitle}>让 Agent 干活</h3>
                <p className={styles.pathText}>
                  装一次 Skill，之后用中文描述需求。Agent 会自己挑入口、查字段、跑只读命令；
                  遇到会改设备状态的操作，它会先停下来问你。
                </p>
                <code className={styles.codeInline}>
                  {'npx skills add fnnas-labs/fnos-cli-skill \\\n  --skill fnos-cli -g'}
                </code>
              </div>
              <div className={styles.pathCard}>
                <span className={styles.pathTag}>PATH B · 脚本与定时任务</span>
                <h3 className={styles.pathTitle}>自己在终端用</h3>
                <p className={styles.pathText}>
                  启动器就是普通命令，可以塞进 cron、CI、备份脚本。首次运行自动下载对应平台的 CLI
                  并做 SHA-256 校验，之后走缓存不再联网。
                </p>
                <code className={styles.codeInline}>
                  {'~/.claude/skills/fnos-cli/scripts/fnos-cli \\\n  --profile home storage pools'}
                </code>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>get started</p>
                <h2 className={styles.sectionTitle}>三步跑通第一条命令</h2>
                <p className={styles.sectionDesc}>
                  全程大约 5 分钟，其中只有「浏览器授权」需要你亲自操作。
                </p>
              </div>
              <Link className={styles.sectionLink} to="/docs/install">
                完整安装说明 →
              </Link>
            </div>
            <div className={styles.steps}>
              {steps.map((s, i) => (
                <div key={s.title} className={styles.step}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                </div>
              ))}
            </div>
            <div className={styles.ctaBar}>
              <div>
                <h3 className={styles.ctaBarTitle}>担心误操作？先读安全边界</h3>
                <p className={styles.ctaBarText}>
                  哪些命令真的危险、`--yes` 到底意味着什么、令牌和授权码怎么处理 —— 一页讲完。
                </p>
              </div>
              <Link className={styles.btnPrimary} to="/docs/safety">
                看安全边界
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
