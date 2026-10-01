/**
 * 与语言无关的站点信息。
 * 可翻译的文案在 src/data/strings.ts；这里只放各语言共用的常量，
 * 避免同一个 URL 在多种语言里各写一份而导致漂移。
 */

/** 主站外链（Hero 的两个按钮）。 */
export const SITE_LINKS = {
  github: 'https://github.com/Jy-EggRoll',
  blog: 'https://eggroll.pages.dev',
} as const;

/**
 * 品牌拉丁字标。它是字标而非文案，不随语言变化，
 * 用于首屏那个巨大的水印式锚点。
 */
export const SITE_BRAND_LATIN = 'EggRoll';

/**
 * 联系方式：只保留可验证已经公开在你 GitHub 主页上的渠道（GitHub / 博客 / 邮箱）。
 * 手机号、QQ、微信、B 站等一律不上站；显示名按语言放在 src/data/strings.ts。
 */
export const CONTACTS = [
  { id: 'github', href: 'https://github.com/Jy-EggRoll', handle: '@Jy-EggRoll' },
  { id: 'blog', href: 'https://eggroll.pages.dev', handle: 'eggroll.pages.dev' },
  { id: 'email', href: 'mailto:JyEggRoll@outlook.com', handle: 'JyEggRoll@outlook.com' },
] as const;

export type ContactId = (typeof CONTACTS)[number]['id'];
