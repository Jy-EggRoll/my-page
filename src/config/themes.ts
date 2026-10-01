export interface ThemeMeta {
  /** 对应 [data-theme] 的取值，也是 ./styles/themes/<id>.css 的文件名 */
  id: string;
  label: string;
  /** 切换按钮上的悬停说明 */
  description: string;
}

/** 主题清单：切换器据此渲染，新增主题只需加一条 + 一个同名 CSS 文件。 */
export const THEMES: readonly ThemeMeta[] = [
  { id: 'fluent', label: 'Fluent', description: '亚克力材质，半透明表面与分层阴影' },
  { id: 'material', label: 'Material 3', description: '色调表面，大圆角与实心阴影' },
];

const FALLBACK_THEME = 'fluent';

export const DEFAULT_THEME: string =
  THEMES.find((theme) => theme.id === FALLBACK_THEME)?.id ?? THEMES[0].id;

export const THEME_ATTRIBUTE = 'data-theme';
export const THEME_STORAGE_KEY = 'my-page:theme';
