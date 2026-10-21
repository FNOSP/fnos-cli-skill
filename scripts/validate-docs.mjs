#!/usr/bin/env node
/**
 * validate-docs.mjs — 构建前的结构自检（纯 Node，无额外依赖）。
 *
 * 检查四件事：
 *   1. 每个 Markdown 都有合法 frontmatter
 *   2. 所有相对 .md 链接都能解析到真实文件
 *   3. 侧边栏引用的 doc id 都存在
 *   4. 手写导读引用的路由都存在
 *
 * 任何一项失败都以非 0 退出，CI 会拦住。
 */

import fs from 'node:fs';
import path from 'node:path';

const SITE = process.cwd();
const DOCS = path.join(SITE, 'docs');
let problems = 0;

const fail = (msg) => {
  problems += 1;
  console.error('  ✗', msg);
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

if (!fs.existsSync(DOCS)) {
  console.error('找不到 docs/ 目录');
  process.exit(1);
}

const files = walk(DOCS);
const docIds = new Set(
  files.map((f) => path.relative(DOCS, f).replace(/\.md$/, '').split(path.sep).join('/')),
);

console.log(`扫描 ${files.length} 个文档\n`);

// 1. frontmatter
console.log('· frontmatter');
for (const file of files) {
  const rel = path.relative(SITE, file);
  const txt = fs.readFileSync(file, 'utf8');
  if (!txt.startsWith('---\n')) {
    fail(`${rel} 缺少 frontmatter`);
    continue;
  }
  const end = txt.indexOf('\n---\n', 3);
  if (end < 0) {
    fail(`${rel} frontmatter 未闭合`);
    continue;
  }
  for (const line of txt.slice(4, end).split('\n')) {
    if (!line.trim()) continue;
    if (!/^[a-zA-Z_][\w-]*:\s?\S/.test(line)) fail(`${rel} frontmatter 行异常: ${line}`);
  }
}

// 2. 相对链接
console.log('· 相对链接');
for (const file of files) {
  const rel = path.relative(SITE, file);
  const txt = fs.readFileSync(file, 'utf8');
  for (const m of txt.matchAll(/\]\((?!https?:|mailto:|#)([^)\s]+\.md)(#[^)]*)?\)/g)) {
    const target = path.resolve(path.dirname(file), m[1]);
    if (!fs.existsSync(target)) fail(`${rel} → ${m[1]} 不存在`);
  }
}

// 3. 侧边栏 doc id
console.log('· 侧边栏');
for (const name of ['sidebars.ts', 'sidebars.skill.generated.ts']) {
  const p = path.join(SITE, name);
  if (!fs.existsSync(p)) {
    fail(`${name} 不存在（先跑 npm run sync）`);
    continue;
  }
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/id:\s*'([^']+)'/g)) {
    if (!docIds.has(m[1])) fail(`${name} 引用了不存在的 doc id: ${m[1]}`);
  }
}

// 4. 站内路由（导航栏、页脚、首页卡片）
console.log('· 站内路由');
const routes = new Set(
  files.map((f) => {
    const id = path.relative(DOCS, f).replace(/\.md$/, '').split(path.sep).join('/');
    return `/docs/${id.replace(/\/index$/, '')}`;
  }),
);
routes.add('/');
routes.add('/docs');

for (const name of ['docusaurus.config.ts', 'src/pages/index.tsx']) {
  const p = path.join(SITE, name);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/to:\s*'(\/[^']*)'|to="(\/[^"]*)"/g)) {
    const route = (m[1] ?? m[2]).replace(/\/$/, '');
    if (!routes.has(route) && !routes.has(`${route}/`)) fail(`${name} 链接到不存在的路由: ${route}`);
  }
}

console.log('');
if (problems) {
  console.error(`❌ 发现 ${problems} 个问题`);
  process.exit(1);
}
console.log('✅ 结构校验通过');
