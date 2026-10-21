import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// 站点地址可被环境变量覆盖，换域名时只改 workflow 里的两个变量即可。
const SITE_URL = process.env.DOCS_URL ?? 'https://fnosp.github.io';
const BASE_URL = process.env.DOCS_BASE_URL ?? '/fnos-cli-skill/';

const config: Config = {
  title: 'fnos-cli 中文文档',
  tagline: '用命令行和 AI Agent 管理飞牛 fnOS：文件、照片、应用、Docker、存储、监控',
  favicon: 'img/favicon.png',

  url: SITE_URL,
  baseUrl: BASE_URL,

  organizationName: 'FNOSP',
  projectName: 'fnos-cli-skill',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',
  // 自动同步的上游文档随时可能新增 `{n}`、`<host>` 之类的字面文本，
  // 用 CommonMark 解析可以避免它们被当成 JSX 表达式导致构建失败。
  markdown: {
    format: 'md',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          breadcrumbs: true,
          showLastUpdateTime: false,
          // 参考区由上游自动生成，编辑入口指向上游仓库
          editUrl: 'https://github.com/fnnas-labs/fnos-cli-skill/tree/main/skills/fnos-cli/',
        },
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css'],
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['zh', 'en'],
        docsRouteBasePath: '/docs',
        indexBlog: false,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        searchResultLimits: 10,
        searchResultContextMaxLength: 60,
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'fnos-cli',
      logo: {
        alt: 'FNOSP',
        src: 'img/logo.png',
        srcDark: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guide',
          position: 'left',
          label: '新手入门',
        },
        {
          type: 'docSidebar',
          sidebarId: 'skill',
          position: 'left',
          label: '参考手册',
        },
        {
          to: '/docs/cheatsheet',
          position: 'left',
          label: '命令速查',
        },
        {
          href: 'https://github.com/fnosp/fnos-cli-skill',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub 仓库',
        },
      ],
    },
    footer: {
      style: 'light',
      logo: {
        alt: 'FNOSP',
        src: 'img/FNOSP.png',
        width: 650,
      },
      links: [
        {
          title: '文档',
          items: [
            {label: 'fnos-cli 是什么', to: '/docs/intro'},
            {label: '5 分钟上手', to: '/docs/quickstart'},
            {label: '命令速查表', to: '/docs/cheatsheet'},
            {label: '常见问题', to: '/docs/troubleshooting'},
          ],
        },
        {
          title: '开源 & 反馈',
          items: [
            {
              label: '上游项目 fnos-cli-skill',
              href: 'https://github.com/fnnas-labs/fnos-cli-skill',
            },
            {
              label: '社区镜像仓库 FNOSP',
              href: 'https://github.com/FNOSP/fnos-cli-skill',
            },
            {label: '问题反馈', href: 'https://github.com/fnnas-labs/fnos-cli-skill/issues'},
          ],
        },
        {
          title: '关于本站',
          items: [
            {label: '本站怎么运转的', to: '/docs/site-guide'},
            {label: 'MIT 许可', href: 'https://github.com/fnnas-labs/fnos-cli-skill/blob/main/LICENSE'},
          ],
        },
      ],
      copyright: `本站为社区中文文档站，内容来自官方 fnos-cli-skill 开源项目（MIT协议）。非飞牛官方站点。<br> © ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'powershell', 'diff'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
