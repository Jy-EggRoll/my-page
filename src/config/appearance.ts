import type { Locale } from './i18n';

/** 各语言的显示名。用 Record<Locale, string>，新增语言时会强制补齐，不会漏翻。 */
type LocalizedText = Record<Locale, string>;

export interface AppearanceOption {
  /** 对应 <html> 属性值与 CSS 里的选择器片段 */
  id: string;
  label: LocalizedText;
  /** 控件上的悬停说明 */
  description: LocalizedText;
}

export interface AppearanceGroup {
  /** 分组标识，用于 data-appearance-group，也是配置内的唯一键 */
  id: string;
  /** 写到 <html> 上的属性名 */
  attribute: string;
  /** localStorage 键名 */
  storageKey: string;
  /** 该维度的可读名称，用作控件 aria-label */
  label: LocalizedText;
  /** 无存储值时的默认选项 */
  defaultId: string;
  /** 无存储值且命中该系统偏好时，改用 fallbackId */
  systemPreference?: { media: string; fallbackId: string };
  options: readonly AppearanceOption[];
}

/**
 * 主题维度的四套人格。
 *
 * 这四套的差异**首先落在色彩**上（色相锚点 + 中性色温度 + 表面明度阶梯），
 * 圆角与模糊只是次要的「材质档」—— 上一版把差异全押在圆角和模糊半径上，
 * 而四套的 bg 彩度都只有 .004（等于中性灰），看起来就是同一套灰换了皮。
 * 每套的实测取值与对比度校算记录在 ./themes/<id>.css 的注释里。
 */
const THEME: AppearanceGroup = {
  id: 'theme',
  attribute: 'data-theme',
  storageKey: 'my-page:theme',
  label: { zh: '主题风格', en: 'Theme' },
  defaultId: 'paper',
  options: [
    {
      id: 'paper',
      label: { zh: '纸', en: 'Paper' },
      description: { zh: '暖米纸底、墨色正文与小圆角，印刷品气质', en: 'Warm paper ground, ink text, tight corners' },
    },
    {
      id: 'steel',
      label: { zh: '钢', en: 'Steel' },
      description: { zh: '冷调中性色与克制的蓝色强调，工程感基准', en: 'Cool neutrals with a restrained blue accent' },
    },
    {
      id: 'mineral',
      label: { zh: '矿物', en: 'Mineral' },
      description: { zh: '青绿强调、方角硬边，工具语感', en: 'Teal accent, square corners, tool-like' },
    },
    {
      id: 'neon',
      label: { zh: '霓虹', en: 'Neon' },
      /* 材质说法要与 themes/neon.css 的现状对齐：毛玻璃只给页头控件条这种小面积控件，
         内容面板不再消费 --panel-backdrop，所以不能说成「玻璃表面」 */
      description: {
        zh: '霓虹辉光与紫调高对比，夜间氛围（毛玻璃只用在页头控件条）',
        en: 'Neon glow, high-contrast violet, nocturnal — frosted only on the header bar',
      },
    },
  ],
};

const SCHEME: AppearanceGroup = {
  id: 'scheme',
  attribute: 'data-scheme',
  storageKey: 'my-page:scheme',
  label: { zh: '明暗', en: 'Mode' },
  defaultId: 'light',
  systemPreference: { media: '(prefers-color-scheme: dark)', fallbackId: 'dark' },
  options: [
    { id: 'light', label: { zh: '浅色', en: 'Light' }, description: { zh: '浅色外观', en: 'Light appearance' } },
    { id: 'dark', label: { zh: '深色', en: 'Dark' }, description: { zh: '深色外观', en: 'Dark appearance' } },
  ],
};

/**
 * 版式维度。
 * 与主题/明暗不同，版式改变的是**编排**而不是配色 —— 所以它不能只靠换令牌实现，
 * 需要一份「共享 DOM + 三套纯 CSS 版式」：DOM 里同时具备三种编排所需的构件
 * （侧栏、书眉序号、路径标签等），由 [data-layout] 决定显示与网格排布。
 */
const LAYOUT: AppearanceGroup = {
  id: 'layout',
  attribute: 'data-layout',
  storageKey: 'my-page:layout',
  label: { zh: '版式', en: 'Layout' },
  defaultId: 'editorial',
  options: [
    {
      id: 'editorial',
      label: { zh: '编辑式', en: 'Editorial' },
      description: { zh: '大字排版与编号书眉，靠字号与留白分层', en: 'Big type and numbered mastheads' },
    },
    {
      id: 'terminal',
      label: { zh: '终端', en: 'Terminal' },
      description: { zh: '路径侧栏与面板，工具感的界面语言', en: 'Path rail and panels — tool-like' },
    },
    {
      id: 'bento',
      label: { zh: '便当格', en: 'Bento' },
      description: { zh: '错落网格，靠格子尺寸差制造张力', en: 'Mosaic grid with contrasting cell sizes' },
    },
  ],
};

/**
 * 外观维度清单。
 * 切换器渲染与防闪烁脚本初始化都遍历它，不针对某个维度写死逻辑；
 * 加维度只需在这里加一条配置 + 对应的 CSS。
 */
export const APPEARANCE: readonly AppearanceGroup[] = [THEME, SCHEME, LAYOUT];

/** 取校验过的默认值：配置写错时退回第一个选项，避免页面出现空属性。 */
export function resolveDefault(group: AppearanceGroup): string {
  const matched = group.options.find((option) => option.id === group.defaultId);
  const fallback = group.options.at(0);
  if (fallback === undefined) {
    throw new Error(`外观维度「${group.label.zh}」没有配置任何选项`);
  }
  return matched?.id ?? fallback.id;
}

/** 供内联脚本使用的最小初始化数据（必须可序列化、与语言无关）。 */
export const APPEARANCE_INIT = APPEARANCE.map((group) => ({
  attribute: group.attribute,
  storageKey: group.storageKey,
  defaultId: resolveDefault(group),
  media: group.systemPreference?.media ?? null,
  mediaId: group.systemPreference?.fallbackId ?? null,
}));

/** 某个语言下的控件视图：组件只消费它，不关心多语言细节。 */
export function appearanceGroupsFor(locale: Locale) {
  return APPEARANCE.map((group) => ({
    id: group.id,
    attribute: group.attribute,
    label: group.label[locale],
    options: group.options.map((option) => ({
      id: option.id,
      label: option.label[locale],
      description: option.description[locale],
    })),
  }));
}
