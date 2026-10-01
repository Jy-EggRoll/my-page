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

const THEME: AppearanceGroup = {
  id: 'theme',
  attribute: 'data-theme',
  storageKey: 'my-page:theme',
  label: { zh: '主题风格', en: 'Theme' },
  defaultId: 'fluent',
  options: [
    {
      id: 'fluent',
      label: { zh: 'Fluent', en: 'Fluent' },
      description: { zh: '亚克力材质，半透明表面与分层阴影', en: 'Acrylic surfaces with layered shadows' },
    },
    {
      id: 'material',
      label: { zh: 'Material 3', en: 'Material 3' },
      description: { zh: '色调表面，大圆角与实心阴影', en: 'Tonal surfaces with large radii' },
    },
    {
      id: 'glass',
      label: { zh: 'Glass', en: 'Glass' },
      description: { zh: '玻璃拟态，强背景模糊与细亮描边', en: 'Glassmorphism: heavy blur, fine borders' },
    },
    {
      id: 'aurora',
      label: { zh: 'Aurora', en: 'Aurora' },
      description: { zh: '极光，深色底上的多色光晕与发光描边', en: 'Multi-hue glows on a near-black base' },
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
 * 外观维度清单。
 * 切换器渲染与防闪烁脚本初始化都遍历它，不针对某个维度写死逻辑；
 * 将来要加第三个维度（比如密度），只需在这里加一条配置 + 对应的 CSS。
 */
export const APPEARANCE: readonly AppearanceGroup[] = [THEME, SCHEME];

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
