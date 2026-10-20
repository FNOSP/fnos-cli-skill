import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
import skillSidebar from './sidebars.skill.generated';

/**
 * 两个侧边栏：
 *  - guide：手写的新手导读（人类视角，按阅读顺序推进）
 *  - skill：从 skills/fnos-cli 自动生成（Agent 视角，结构跟随上游）
 */
const sidebars: SidebarsConfig = {
  guide: [
    {type: 'doc', id: 'intro', label: 'fnos-cli 是什么'},
    {type: 'doc', id: 'quickstart', label: '5 分钟上手'},
    {type: 'doc', id: 'install', label: '安装与升级'},
    {type: 'doc', id: 'authorize', label: '授权与连接'},
    {type: 'doc', id: 'safety', label: '安全边界与高危操作'},
    {type: 'doc', id: 'cheatsheet', label: '命令速查表'},
    {type: 'doc', id: 'troubleshooting', label: '常见问题与排错'},
    {type: 'doc', id: 'site-guide', label: '本站怎么运转的'},
  ],
  skill: skillSidebar,
};

export default sidebars;
