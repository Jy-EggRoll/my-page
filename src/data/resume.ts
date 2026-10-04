import { DEFAULT_LOCALE, LOCALES, type Locale } from '../config/i18n';

/**
 * 站点展示用的简历内容。
 *
 * 结构与简历 JSON 的层级对应（education / experience / projects / skills /
 * languages / awards / certifications / interests / volunteer），但**做过脱敏**：
 * 不含手机号、IM 账号、排名、时长等个人数据，工作描述也做了大幅精简。
 * 原始 JSON 不进仓库。
 */

export type SectionLayout = 'timeline' | 'meter' | 'grid' | 'tags';

export interface ResumeEntry {
  /** 跨语言稳定标识，用于校验两种语言的条目一一对应 */
  id: string;
  title: string;
  subtitle?: string;
  /** 时间或等级等次要信息 */
  meta?: string;
  detail?: string;
  tags?: readonly string[];
  /** 0–5 的熟练度，仅 meter 布局使用 */
  level?: number;
  href?: string;
}

export interface ResumeSection {
  id: string;
  layout: SectionLayout;
  label: string;
  entries: readonly ResumeEntry[];
}

export interface ResumeContent {
  /**
   * 简历 basics.headline。原字段是「一句话、用空白分成两个分句」，
   * 所以这里按行存：两行是同一个声明的两个分句，不是标题 + 副标题。
   */
  headline: readonly string[];
  summary: readonly string[];
  sections: readonly ResumeSection[];
}

const ZH: ResumeContent = {
  headline: ['将工程美学融入技术细节', '以技术细节解决效率痛点'],
  summary: [
    '北京邮电大学计算机学院数据科学与大数据技术专业本科在读。',
    '独立维护多个开源运维类项目，能力覆盖跨平台系统底层、自动化运维、工程化开发与 AI 工具落地，坚持以代码化手段替代人工重复操作。',
  ],
  sections: [
    {
      id: 'education',
      layout: 'timeline',
      label: '教育背景',
      entries: [
        {
          id: 'bupt',
          title: '北京邮电大学',
          subtitle: '本科 · 数据科学与大数据技术',
          meta: '2023.09 – 至今',
          detail: '核心课程：分布式计算与云计算、大数据技术基础、Linux 开发环境及应用。',
        },
      ],
    },
    {
      id: 'experience',
      layout: 'timeline',
      label: '实习与工作',
      entries: [
        {
          id: 'tencent',
          title: '腾讯 · 云与智慧产业事业群（CSIG）',
          subtitle: '云架构师实习生',
          meta: '2026.07 – 2026.09',
          detail: '面向客户做上云迁移与疑难故障排查，沉淀可复用的排障文档与 AI 辅助工作流。',
        },
        {
          id: 'beiyouren',
          title: '北京邮电大学 · 北邮人团队',
          subtitle: '产品运营组',
          meta: '2023.10 – 2025.10',
          detail: '负责校园运维与效率工具的需求调研与方案设计，输出标准化文档。',
        },
      ],
    },
    {
      id: 'projects',
      layout: 'grid',
      label: '开源项目',
      entries: [
        {
          id: 'repodex',
          title: '边缘计算搜索系统',
          subtitle: '独立开发者 · Cloudflare 技术体系',
          meta: '2026.01 – 至今',
          detail: '跨仓库、跨分支的全局文件检索，基于边缘计算与分布式索引，支持中英文与拼音模糊匹配。',
          href: 'https://github.com/jy-eggroll/repodex',
        },
        {
          id: 'monitor-pro',
          title: 'Monitor Pro VS Code 插件',
          subtitle: '开源协作维护者 · TypeScript + Go',
          meta: '2026.05 – 至今',
          detail: 'VS Code 系统资源监控插件：Go 后端采集配合平滑实时图表，覆盖远程与 WSL 环境。',
          href: 'https://github.com/nexmoe/vscode-monitor-pro',
        },
      ],
    },
    {
      id: 'skills',
      layout: 'meter',
      label: '技能',
      entries: [
        { id: 'ops', title: '运维操作技术', level: 5, tags: ['虚拟机', '性能分析', '原生工具调用'] },
        { id: 'ai', title: 'AI 工具与提示词工程', level: 4, tags: ['提示词调优', '工作流编排'] },
        { id: 'cloud', title: '大数据与云原生', level: 4, tags: ['K8s', 'Docker', '大数据组件'] },
        {
          id: 'fullstack',
          title: '全栈开发技术',
          level: 3,
          tags: ['Go', 'TypeScript', 'JavaScript', 'Python'],
        },
      ],
    },
    {
      id: 'languages',
      layout: 'meter',
      label: '语言',
      entries: [{ id: 'english', title: '英语', subtitle: 'CET-6' }],
    },
    {
      id: 'awards',
      layout: 'grid',
      label: '奖项',
      entries: [
        { id: 'competition', title: '中国大学生计算机设计大赛', subtitle: '全国二等奖', meta: '2026' },
        { id: 'scholarship', title: '北京邮电大学一等奖学金', meta: '2025' },
        { id: 'art-festival', title: '北京市大学生艺术节金奖', meta: '2025' },
        { id: 'student-award', title: '北京邮电大学三好学生', meta: '2025、2024' },
      ],
    },
    {
      id: 'certifications',
      layout: 'grid',
      label: '认证',
      entries: [
        {
          id: 'tccp',
          title: 'TCCP 腾讯云架构高级工程师认证',
          subtitle: '腾讯云与智慧产业事业群',
          meta: '2026.08',
        },
        {
          id: 'worldquant',
          title: '量化金融 Gold 级研究顾问',
          subtitle: 'WorldQuant BRAIN 世坤投资',
          meta: '2025.09',
        },
      ],
    },
    {
      id: 'interests',
      layout: 'tags',
      label: '兴趣',
      entries: [
        { id: 'tech', title: '技术', tags: ['调色', '排版', '前端动画'] },
        { id: 'music', title: '音乐', tags: ['钢琴曲', '竹笛'] },
        { id: 'art', title: '艺术', tags: ['书法'] },
      ],
    },
    {
      id: 'volunteer',
      layout: 'tags',
      label: '志愿服务',
      entries: [
        { id: 'volunteer-beijing', title: '志愿北京' },
        { id: 'bupt-labor', title: '北京邮电大学劳动实践' },
      ],
    },
  ],
};

const EN: ResumeContent = {
  headline: [
    'Bringing engineering aesthetics into every technical detail',
    'Solving efficiency pain points through technical detail',
  ],
  summary: [
    'Undergraduate in Data Science and Big Data Technology at the School of Computer Science, Beijing University of Posts and Telecommunications.',
    'Maintains several open-source operations-tooling projects independently, covering cross-platform system internals, automation, engineering practice and applied AI tooling — with a preference for replacing repetitive manual work with code.',
  ],
  sections: [
    {
      id: 'education',
      layout: 'timeline',
      label: 'Education',
      entries: [
        {
          id: 'bupt',
          title: 'Beijing University of Posts and Telecommunications',
          subtitle: 'Undergraduate · Data Science and Big Data Technology',
          meta: 'Sep 2023 – present',
          detail:
            'Core courses: distributed computing and cloud computing, big data fundamentals, Linux development environments.',
        },
      ],
    },
    {
      id: 'experience',
      layout: 'timeline',
      label: 'Experience',
      entries: [
        {
          id: 'tencent',
          title: 'Tencent · Cloud & Smart Industries Group (CSIG)',
          subtitle: 'Cloud Architect Intern',
          meta: 'Jul 2026 – Sep 2026',
          detail:
            'Supported customer cloud migrations and complex fault diagnosis, producing reusable troubleshooting docs and AI-assisted workflows.',
        },
        {
          id: 'beiyouren',
          title: 'BUPT · Beiyouren Team',
          subtitle: 'Product Operations',
          meta: 'Oct 2023 – Oct 2025',
          detail:
            'Owned requirement research and solution design for campus operations and productivity tooling, and produced standardised documentation.',
        },
      ],
    },
    {
      id: 'projects',
      layout: 'grid',
      label: 'Open source',
      entries: [
        {
          id: 'repodex',
          title: 'Edge-computing search system',
          subtitle: 'Solo developer · Cloudflare stack',
          meta: 'Jan 2026 – present',
          detail:
            'Cross-repository, cross-branch global file search built on edge computing and distributed indexing, with fuzzy matching for Chinese, English and pinyin.',
          href: 'https://github.com/jy-eggroll/repodex',
        },
        {
          id: 'monitor-pro',
          title: 'Monitor Pro VS Code extension',
          subtitle: 'Open-source collaborator · TypeScript + Go',
          meta: 'May 2026 – present',
          detail:
            'A VS Code system resource monitor with a native Go backend and smooth real-time charts, covering remote and WSL environments.',
          href: 'https://github.com/nexmoe/vscode-monitor-pro',
        },
      ],
    },
    {
      id: 'skills',
      layout: 'meter',
      label: 'Skills',
      entries: [
        {
          id: 'ops',
          title: 'Operations & system tooling',
          level: 5,
          tags: ['Virtualisation', 'Profiling', 'Native tooling'],
        },
        {
          id: 'ai',
          title: 'AI tooling & prompt engineering',
          level: 4,
          tags: ['Prompt tuning', 'Workflow orchestration'],
        },
        {
          id: 'cloud',
          title: 'Big data & cloud native',
          level: 4,
          tags: ['K8s', 'Docker', 'Big data components'],
        },
        {
          id: 'fullstack',
          title: 'Full-stack development',
          level: 3,
          tags: ['Go', 'TypeScript', 'JavaScript', 'Python'],
        },
      ],
    },
    {
      id: 'languages',
      layout: 'meter',
      label: 'Languages',
      entries: [{ id: 'english', title: 'English', subtitle: 'CET-6' }],
    },
    {
      id: 'awards',
      layout: 'grid',
      label: 'Awards',
      entries: [
        {
          id: 'competition',
          title: 'Chinese Collegiate Computing Competition',
          subtitle: 'National Second Prize',
          meta: '2026',
        },
        { id: 'scholarship', title: 'BUPT First-Class Scholarship', meta: '2025' },
        { id: 'art-festival', title: 'Beijing Student Arts Festival, Gold Award', meta: '2025' },
        { id: 'student-award', title: 'BUPT Outstanding Student', meta: '2025, 2024' },
      ],
    },
    {
      id: 'certifications',
      layout: 'grid',
      label: 'Certifications',
      entries: [
        {
          id: 'tccp',
          title: 'Tencent Cloud Certified Professional (TCCP) – Cloud Architect',
          subtitle: 'Tencent Cloud & Smart Industries Group',
          meta: 'Aug 2026',
        },
        {
          id: 'worldquant',
          title: 'Quantitative Finance Research Consultant (Gold)',
          subtitle: 'WorldQuant BRAIN',
          meta: 'Sep 2025',
        },
      ],
    },
    {
      id: 'interests',
      layout: 'tags',
      label: 'Interests',
      entries: [
        { id: 'tech', title: 'Technology', tags: ['Colour', 'Typography', 'Front-end animation'] },
        { id: 'music', title: 'Music', tags: ['Piano pieces', 'Bamboo flute'] },
        { id: 'art', title: 'Art', tags: ['Calligraphy'] },
      ],
    },
    {
      id: 'volunteer',
      layout: 'tags',
      label: 'Volunteering',
      entries: [
        { id: 'volunteer-beijing', title: 'Volunteer Beijing' },
        { id: 'bupt-labor', title: 'BUPT labour practice' },
      ],
    },
  ],
};

export const RESUME: Record<Locale, ResumeContent> = { zh: ZH, en: EN };

export function resumeFor(locale: Locale): ResumeContent {
  return RESUME[locale];
}

/**
 * 构建期校验：各语言的板块与条目 id 必须一一对应。
 * 少翻一条就让构建失败并点名是哪条，而不是等上线后才发现某个语言缺一块。
 */
function assertSameStructure(): void {
  const idsOf = (content: ResumeContent): string[] =>
    content.sections.flatMap((section) => [
      `section:${section.id}`,
      ...section.entries.map((entry) => `entry:${section.id}/${entry.id}`),
    ]);

  const reference = new Set(idsOf(RESUME[DEFAULT_LOCALE]));
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const ids = new Set(idsOf(RESUME[locale]));
    const missing = [...reference].filter((id) => !ids.has(id));
    const extra = [...ids].filter((id) => !reference.has(id));
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `简历内容结构不一致：以 ${DEFAULT_LOCALE} 为基准，${locale} 缺少 [${missing.join(', ') || '无'}]、` +
          `多出 [${extra.join(', ') || '无'}]。请补齐 src/data/resume.ts`,
      );
    }
  }
}

assertSameStructure();

/**
 * 便当格版式下各板块占多少列（十二列制）。**每一行的列数之和必须等于 12**，
 * 否则会有板块独占半行、另半行留白（旧版 volunteer/contacts 各占 6 列却前后错位，
 * 就是这样空掉了半行）。按 DOM 顺序（hero → summary → … → contacts → stats）的分配表：
 *
 *   行 1  hero 7            + summary 5        = 12
 *   行 2  education 4       + experience 8     = 12
 *   行 3  projects 7        + skills 5         = 12
 *   行 4  languages 12                          = 12
 *   行 5  awards 6          + certifications 6 = 12
 *   行 6  interests 6       + volunteer 6      = 12
 *   行 7  contacts 4        + stats 8          = 12
 *
 * 分行的硬约束（决定了上面这张表长什么样）：网格是稀疏自动排布，**一行只能是
 * DOM 里连续的一段**，行边界落在「累计满 12 列」的地方。「languages 4 + interests 4 +
 * volunteer 4」这种把它后面那两条短板块凑一行的分组**做不到**：
 * DOM 顺序是 languages → awards → certifications → interests → volunteer，
 * 按这个顺序贪心装箱会得到 languages+awards=10、certifications+interests=10、
 * volunteer+contacts=8 三条残行，反而空出更多半行。
 *
 * 各行高度的依据（一行的高度 = 该行最高的那张卡，矮的会被拉成空壳）：
 *   - languages 只有 1 条（英语 CET-6），而紧随其后的 awards 有 4 条、是全场最高的卡。
 *     只要两者同行，languages 就必然被撑到 awards 的高度（实测 1920 下 366px 的卡里
 *     只有一行内容）。languages 后面没有任何「同样短」的板块可以配对，
 *     所以只能让它独占一行（12 列）—— 一行里只有一条内容时，卡片高度就等于内容高度（修复后实测 91px）。
 *   - awards（4 条）与 certifications（2 条）同行，按条目数本可让 awards 多拿一两列，
 *     但实测 7:5 与 6:6 两种分法的行高都是 366px（1920 下该行由 awards 决定，宽度只影响
 *     文字换行、不足以改变行高），所以取等分的 6:6，分配表更好记。
 *   - interests（3 条）与 volunteer（2 条）本来就接近，保持 6 : 6。
 *   - contacts 恒为单列清单、stats 是两张并排的图，保持 4 : 8。
 * 代价是总行数从 6 行变成 7 行：这是「不让短内容被拉成空壳」必须付的代价。
 *
 * 这是**版式关切**且与语言无关，所以放在 locale 数据之外 —— 只维护一份。
 */
const BENTO_COLUMNS: Record<string, number> = {
  education: 4,
  experience: 8,
  projects: 7,
  skills: 5,
  // 行 4：语言只有 1 条，而与它同行的 awards（4 条）是全场最高的卡 —— 见上方分配表说明
  languages: 12,
  awards: 6,
  certifications: 6,
  interests: 6,
  volunteer: 6,
};

/** 取某个板块在便当格版式下的列数；未登记的板块占满整行。 */
export function columnsFor(sectionId: string): number {
  return BENTO_COLUMNS[sectionId] ?? 12;
}

/** 除简历板块外、由页面追加的区块在便当格下的列数（分配表见上一段：行 1 与行 7 成带）。 */
export const CHROME_COLUMNS = {
  hero: 7,
  summary: 5,
  // 联系方式 4 列（单列卡片即可读，见 layouts/bento.css），余下 8 列留给两张统计图铺开
  contacts: 4,
  stats: 8,
} as const;

/**
 * 章节节奏档位：major = 核心经历与作品，minor = 内容很少、需要收紧的板块，
 * 未登记的一律走「常规」档。各档的具体数值（上间距 / 标签字号字重 / 线权重）
 * 集中在 layout.css 的 --rhythm-* 里，这里只声明「谁属于哪一档」，改节奏不必动数据。
 */
const EMPHASIS: Record<string, 'major' | 'minor'> = {
  experience: 'major',
  projects: 'major',
  languages: 'minor',
  interests: 'minor',
  volunteer: 'minor',
};

/** 取某个板块的版面权重；未登记的按常规处理。 */
export function emphasisFor(sectionId: string): 'major' | 'minor' | 'normal' {
  return EMPHASIS[sectionId] ?? 'normal';
}

/**
 * 每个板块的色相（度）。
 * 只给色相：明度与饱和度由主题强调色提供（CSS 用相对颜色语法派生），
 * 因此同一份数据在 4 套主题 × 明暗下都协调，也让页面不只是单一色调。
 * 与语言无关，只维护一份。
 */
const SECTION_HUES: Record<string, number> = {
  education: 250,
  experience: 222,
  projects: 190,
  skills: 162,
  languages: 292,
  awards: 42,
  certifications: 12,
  interests: 322,
  volunteer: 272,
};

/** 取某个板块的色相；未登记时返回 undefined，由 CSS 跟随主题主色。 */
export function hueFor(sectionId: string): number | undefined {
  return SECTION_HUES[sectionId];
}
