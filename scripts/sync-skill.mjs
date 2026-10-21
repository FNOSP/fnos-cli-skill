#!/usr/bin/env node
/**
 * sync-skill.mjs — 把 fnos-cli-skill 的 Agent 文档转换成 Docusaurus 页面。
 *
 * 输入：skills/fnos-cli/（上游仓库结构，或本地 skill-snapshot/ 兜底）
 * 输出：docs/skill/**、sidebars.skill.generated.ts、src/data/skillMeta.ts
 *
 * 设计原则：源文档一字不改地保留语义，只做「网页化」必需的机械处理：
 *   - 抽掉 Skill frontmatter（name/description），改成 Docusaurus frontmatter
 *   - `_index.md` / `_conventions.md` 改名（Docusaurus 会忽略下划线开头的文件）
 *   - SKILL.md 改名为 index.md，并修掉指向它的相对链接
 *   - 保留原始目录层级，让文档里的相对链接全部继续有效
 *   - 文件头部注入「这是 Agent 原文」提示，尾部标注来源
 *
 * 用法：node scripts/sync-skill.mjs [--source <dir>] [--quiet]
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const SITE_ROOT = process.cwd();
const OUT_DIR = path.join(SITE_ROOT, 'docs', 'skill');
const MANIFEST_FILE = path.join(OUT_DIR, '.manifest.json');
const written = new Set();
let previousFiles = [];
const SIDEBAR_FILE = path.join(SITE_ROOT, 'sidebars.skill.generated.ts');
const META_FILE = path.join(SITE_ROOT, 'src', 'data', 'skillMeta.ts');

const argv = process.argv.slice(2);
const quiet = argv.includes('--quiet');
const sourceArg = (() => {
  const i = argv.indexOf('--source');
  if (i >= 0) return argv[i + 1];
  return process.env.SKILL_SOURCE || null;
})();

const log = (...a) => {
  if (!quiet) console.log('[sync-skill]', ...a);
};

/** 候选源目录：显式参数 > 仓库内 skills/fnos-cli > 本机已安装的 skill > 仓库内快照 */
function resolveSource() {
  const candidates = sourceArg
    ? [path.resolve(SITE_ROOT, sourceArg)]
    : [
        path.resolve(SITE_ROOT, '..', 'skills', 'fnos-cli'),
        path.resolve(SITE_ROOT, 'skills', 'fnos-cli'),
        // 本机装过 skill 就直接用，省得每次手写 --source
        path.join(os.homedir(), '.skills-manager', 'skills', 'fnos-cli'),
        path.join(os.homedir(), '.claude', 'skills', 'fnos-cli'),
        path.join(SITE_ROOT, 'skill-snapshot'),
      ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'SKILL.md'))) return dir;
  }
  throw new Error(
    '找不到 skills/fnos-cli（需要包含 SKILL.md）。\n已尝试：\n  ' + candidates.join('\n  '),
  );
}

/** 文档顺序：跟随 SKILL.md「命令与任务一览」的排列 */
const ENTRY_ORDER = [
  'trim-shared',
  'trim-file',
  'trim-photos',
  'trim-app',
  'trim-docker',
  'trim-download',
  'trim-baidu-netdisk',
  'trim-log',
  'trim-monitor',
  'trim-network',
  'trim-storage',
  'trim-system',
  'trim-user',
];

/** 参考手册顺序：跟随 reference/_index.md 的排列，workflows 单独成组 */
const MODULE_ORDER = [
  'conventions',
  'oauth',
  'file',
  'photos',
  '[workflows]',
  'app-center',
  'dockermgr',
  'download',
  'baidu-netdisk',
  'log',
  'resmon',
  'network',
  'stor',
  'sysinfo',
  'power',
  'user',
];

/** 没有 H1 的源文档需要补标题 */
const TITLE_OVERRIDES = {
  'runtime-setup.md': '首次运行与缓存',
};

function prettifyName(srcRel) {
  return path.basename(srcRel, '.md').replace(/[-_]/g, ' ');
}

/** 文件名 → 输出文件名（Docusaurus 会跳过下划线开头的文件） */
const RENAME = {
  SKILL: 'index',
  _index: 'index',
  _conventions: 'conventions',
};

function stripFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return {frontmatter: '', body: text};
  return {frontmatter: m[1], body: text.slice(m[0].length)};
}

function pickDescription(frontmatter) {
  const m = frontmatter.match(/^description:\s*([\s\S]*)$/m);
  if (!m) return '';
  let value = m[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.replace(/\\"/g, '"').trim();
}

function pickTitle(body) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

/** 相对链接改写：保持目录层级不变，只处理被重命名的文件 */
function rewriteLinks(body) {
  return body
    .replace(/(\]\([^)]*?)\bSKILL\.md(#[^)]*)?\)/g, '$1index.md$2)')
    .replace(/(\]\([^)]*?)_index\.md(#[^)]*)?\)/g, '$1index.md$2)')
    .replace(/(\]\([^)]*?)_conventions\.md(#[^)]*)?\)/g, '$1conventions.md$2)')
    .replace(/<!--\s*standalone:(start|end)\s*-->\r?\n?/g, '');
}

/** 从 docs/skill/** 指向 docs/xxx 的相对路径 */
function guideLink(fromOutRel, targetDoc) {
  const rel = path.posix.relative(path.posix.dirname(fromOutRel), targetDoc);
  return `${rel}.md`;
}

function buildNotice(outRel, srcRel) {
  // outRel 是相对 docs/skill/ 的路径，这里补上前缀才能算对回导读区的相对链接
  const fromSkillRoot = `skill/${outRel}`;
  const quickstart = guideLink(fromSkillRoot, 'quickstart');
  const cheatsheet = guideLink(fromSkillRoot, 'cheatsheet');
  return [
    ':::note[这一页是 Agent 原文]',
    `本页由 \`skills/fnos-cli/${srcRel}\` 自动同步，写给 Agent 的措辞一字未改。` +
      `第一次上手建议先读[5 分钟上手](${quickstart})、[命令速查表](${cheatsheet})。`,
    ':::',
    '',
    '',
  ].join('\n');
}

function buildFooter(srcRel, version) {
  return [
    '',
    '---',
    '',
    `*自动同步自 \`skills/fnos-cli/${srcRel}\`（fnos-cli ${version}）。请勿直接编辑本页，` +
      '修改请提交到上游仓库 `fnnas-labs/fnos-cli-skill`。*',
    '',
  ].join('\n');
}

function escapeYaml(value) {
  return JSON.stringify(value);
}

const collected = {
  entries: [],
  modules: [],
  workflows: [],
};

function emitDoc({srcDir, srcRel, outRel, title, description, version, sidebarPosition}) {
  const raw = fs.readFileSync(path.join(srcDir, srcRel), 'utf8');
  const {frontmatter, body} = stripFrontmatter(raw);
  const desc = description || pickDescription(frontmatter);
  const sourceHeading = pickTitle(body);
  const heading = title || TITLE_OVERRIDES[srcRel] || sourceHeading || prettifyName(srcRel);
  // 源文档没有 H1 时补一个，否则页面上会没有标题
  const bodyWithHeading = sourceHeading ? body : `# ${heading}\n\n${body.trimStart()}`;

  const outPath = path.join(OUT_DIR, outRel);
  fs.mkdirSync(path.dirname(outPath), {recursive: true});

  const head = [
    '---',
    `title: ${escapeYaml(heading)}`,
    desc ? `description: ${escapeYaml(desc)}` : null,
    `sidebar_position: ${sidebarPosition}`,
    '---',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const content =
    head +
    buildNotice(outRel, srcRel) +
    rewriteLinks(bodyWithHeading).trimEnd() +
    '\n' +
    buildFooter(srcRel, version);

  fs.writeFileSync(outPath, content);
  written.add(outRel);
  return {id: `skill/${outRel.replace(/\.md$/, '')}`, label: heading, srcRel, pos: sidebarPosition};
}

function orderIndex(order, name) {
  const i = order.indexOf(name);
  return i >= 0 ? (i + 1) * 10 : 900;
}

function loadPreviousManifest() {
  try {
    previousFiles = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    if (!Array.isArray(previousFiles)) previousFiles = [];
  } catch {
    previousFiles = [];
  }
}

/** 只删除上次生成、这次不再产出的文件，然后写入新清单 */
function pruneAndSaveManifest() {
  let removed = 0;
  for (const rel of previousFiles) {
    if (written.has(rel)) continue;
    try {
      fs.unlinkSync(path.join(OUT_DIR, rel));
      removed += 1;
    } catch {
      /* 删不掉就留着，不影响构建 */
    }
  }
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify([...written].sort(), null, 2)}\n`);
  if (removed) log(`清理过期文件 ${removed} 个`);
}

function main() {
  const srcDir = resolveSource();
  log('源目录：', srcDir);

  const manifest = JSON.parse(fs.readFileSync(path.join(srcDir, 'runtime-manifest.json'), 'utf8'));
  const version = manifest.version ?? 'unknown';
  const commit = manifest.source?.commit ?? '';

  fs.mkdirSync(OUT_DIR, {recursive: true});
  // 不整目录删除：逐文件覆盖，最后按清单清理过期文件。
  // 这样既避免误删，也让未变化的文件保持原 mtime（构建缓存更友好）。
  loadPreviousManifest();

  // 1. 主入口 SKILL.md
  const rootDoc = emitDoc({
    srcDir,
    srcRel: 'SKILL.md',
    outRel: 'index.md',
    description: 'fnos-cli Skill 的原始入口文档，包含启动器定位、授权流程、使用规则与任务一览。',
    version,
    sidebarPosition: 1,
  });

  // 2. 首次运行指南
  const runtimeDoc = emitDoc({
    srcDir,
    srcRel: 'runtime-setup.md',
    outRel: 'runtime-setup.md',
    version,
    sidebarPosition: 2,
  });

  // 3. 任务入口 entries/
  for (const file of fs.readdirSync(path.join(srcDir, 'entries')).sort()) {
    if (!file.endsWith('.md')) continue;
    const name = path.basename(file, '.md');
    collected.entries.push(
      emitDoc({
        srcDir,
        srcRel: `entries/${file}`,
        outRel: `entries/${file}`,
        version,
        sidebarPosition: orderIndex(ENTRY_ORDER, name),
      }),
    );
  }

  // 4. 模块参考 reference/
  for (const file of fs.readdirSync(path.join(srcDir, 'reference')).sort()) {
    if (!file.endsWith('.md')) continue;
    const base = path.basename(file, '.md');
    const outName = RENAME[base] ?? base;
    const doc = emitDoc({
      srcDir,
      srcRel: `reference/${file}`,
      outRel: `reference/${outName}.md`,
      version,
      sidebarPosition: orderIndex(MODULE_ORDER, outName),
    });
    collected.modules.push({...doc, isIndex: base === '_index'});
  }

  // 5. 场景流程 reference/workflows/
  for (const file of fs.readdirSync(path.join(srcDir, 'reference', 'workflows')).sort()) {
    if (!file.endsWith('.md')) continue;
    const name = path.basename(file, '.md');
    collected.workflows.push(
      emitDoc({
        srcDir,
        srcRel: `reference/workflows/${file}`,
        outRel: `reference/workflows/${file}`,
        version,
        sidebarPosition: orderIndex(
          ['file-routing', 'file-upload-validation', 'photos-routing', 'device-validation', 'storage-dangerous-ops'],
          name,
        ),
      }),
    );
  }

  pruneAndSaveManifest();

  // 6. 生成侧边栏
  const refIndex = collected.modules.find((m) => m.isIndex);
  const modules = collected.modules.filter((m) => !m.isIndex);

  const items = [
    '  {type: \'doc\', id: \'skill/index\', label: \'SKILL.md · Agent 主入口\'},',
    '  {type: \'doc\', id: \'skill/runtime-setup\', label: \'首次运行与缓存\'},',
    '  {',
    '    type: \'category\',',
    '    label: \'任务入口\',',
    '    collapsible: true,',
    '    collapsed: false,',
    '    description: \'按任务挑最贴近的入口，这是 Agent 决定先读哪份文档的路径。\',',
    '    items: [',
    ...collectByPosition(collected.entries).map(
      (d) => `      {type: 'doc', id: '${d.id}', label: ${JSON.stringify(d.label)}},`,
    ),
    '    ],',
    '  },',
    '  {',
    '    type: \'category\',',
    '    label: \'模块参考\',',
    refIndex ? `    link: {type: 'doc', id: '${refIndex.id}'},` : '',
    '    collapsible: true,',
    '    collapsed: true,',
    '    description: \'每个模块的完整端点、字段、错误码与高风险操作说明。\',',
    '    items: [',
    ...renderModuleItems(modules),
    '    ],',
    '  },',
  ].filter(Boolean);

  const sidebarSource = [
    '// 由 scripts/sync-skill.mjs 自动生成，请勿手工编辑。',
    'const skillSidebar = [',
    ...items,
    '];',
    '',
    'export default skillSidebar;',
    '',
  ].join('\n');
  fs.writeFileSync(SIDEBAR_FILE, sidebarSource);

  // 7. 生成站点元信息（首页展示同步版本）
  const allDocs = [rootDoc, runtimeDoc, ...collected.entries, ...collected.modules, ...collected.workflows];
  fs.mkdirSync(path.dirname(META_FILE), {recursive: true});
  fs.writeFileSync(
    META_FILE,
    [
      '// 由 scripts/sync-skill.mjs 自动生成，请勿手工编辑。',
      'const skillMeta = {',
      `  cliVersion: ${JSON.stringify(version)},`,
      `  commit: ${JSON.stringify(commit.slice(0, 7))},`,
      `  sourceRepo: ${JSON.stringify(manifest.githubRepository ?? 'fnosp/fnos-cli-skill')},`,
      `  syncedAt: ${JSON.stringify(new Date().toISOString().slice(0, 10))},`,
      `  totalDocs: ${allDocs.length},`,
      `  entryCount: ${collected.entries.length},`,
      `  moduleCount: ${modules.length},`,
      `  workflowCount: ${collected.workflows.length},`,
      '};',
      '',
      'export default skillMeta;',
      '',
    ].join('\n'),
  );

  log(
    `完成：${allDocs.length} 页（入口 ${collected.entries.length} / 模块 ${modules.length} / 流程 ${collected.workflows.length}），CLI ${version}`,
  );
}

function collectByPosition(docs) {
  return [...docs].sort((a, b) => a.pos - b.pos || a.srcRel.localeCompare(b.srcRel));
}

/** 模块区：把 workflows 子分类插到 photos 之后，和 _index.md 的顺序一致 */
function renderModuleItems(modules) {
  const order = MODULE_ORDER.filter((n) => n !== '[workflows]');
  const sorted = [...modules].sort(
    (a, b) => orderIndex(order, a.id.split('/').pop()) - orderIndex(order, b.id.split('/').pop()),
  );
  const lines = [];
  const insertAt = sorted.findIndex((m) => m.id.endsWith('/photos')) + 1;
  const flowLines = [
    '      {',
    "        type: 'category',",
    "        label: '场景流程',",
    '        collapsible: true,',
    '        collapsed: true,',
    "        description: '跨模块的判断路径：先走哪条命令、什么时候停下来确认。',",
    '        items: [',
    ...collectByPosition(collected.workflows).map(
      (d) => `          {type: 'doc', id: '${d.id}', label: ${JSON.stringify(d.label)}},`,
    ),
    '        ],',
    '      },',
  ];
  sorted.forEach((doc, i) => {
    if (i === insertAt) lines.push(...flowLines);
    lines.push(`      {type: 'doc', id: '${doc.id}', label: ${JSON.stringify(doc.label)}},`);
  });
  if (insertAt === sorted.length || insertAt < 0) lines.push(...flowLines);
  return lines;
}

main();
