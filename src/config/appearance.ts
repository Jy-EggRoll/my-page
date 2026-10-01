export interface AppearanceOption {
  /** 对应 <html> 属性值与 CSS 里的选择器片段 */
  id: string;
  label: string;
  /** 控件上的悬停说明 */
  description: string;
}

export interface AppearanceGroup {
  /** 分组标识，用于 data-appearance-group，也是配置内的唯一键 */
  id: string;
  /** 写到 <html> 上的属性名 */
  attribute: string;
  /** localStorage 键名 */
  storageKey: string;
  /** 该维度的可读名称，用作控件 aria-label */
  label: string;
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
  label: '主题风格',
  defaultId: 'fluent',
  options: [
    { id: 'fluent', label: 'Fluent', description: '亚克力材质，半透明表面与分层阴影' },
    { id: 'material', label: 'Material 3', description: '色调表面，大圆角与实心阴影' },
  ],
};

const SCHEME: AppearanceGroup = {
  id: 'scheme',
  attribute: 'data-scheme',
  storageKey: 'my-page:scheme',
  label: '明暗',
  defaultId: 'light',
  systemPreference: { media: '(prefers-color-scheme: dark)', fallbackId: 'dark' },
  options: [
    { id: 'light', label: '浅色', description: '浅色外观' },
    { id: 'dark', label: '深色', description: '深色外观' },
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
    throw new Error(`外观维度「${group.label}」没有配置任何选项`);
  }
  return matched?.id ?? fallback.id;
}

/** 供内联脚本使用的最小初始化数据（必须可序列化）。 */
export const APPEARANCE_INIT = APPEARANCE.map((group) => ({
  attribute: group.attribute,
  storageKey: group.storageKey,
  defaultId: resolveDefault(group),
  media: group.systemPreference?.media ?? null,
  mediaId: group.systemPreference?.fallbackId ?? null,
}));
