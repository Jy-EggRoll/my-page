/**
 * 与语言无关的站点信息。
 * 可翻译的文案在 src/data/strings.ts；这里只放各语言共用的常量，
 * 避免同一个 URL 在多种语言里各写一份而导致漂移。
 */
export const SITE_LINKS = {
  github: 'https://github.com/Jy-EggRoll',
  blog: 'https://eggroll.pages.dev',
} as const;
