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
 * 联系方式与社交渠道：只有 href 与 handle 是跨语言共用的，
 * 显示名按语言放在 src/data/strings.ts 的 contactLabels 里。
 * 这里刻意不放手机号。
 */
export const CONTACTS = [
  { id: 'github', href: 'https://github.com/Jy-EggRoll', handle: '@Jy-EggRoll' },
  { id: 'blog', href: 'https://eggroll.pages.dev', handle: 'eggroll.pages.dev' },
  { id: 'email', href: 'mailto:JyEggRoll@outlook.com', handle: 'JyEggRoll@outlook.com' },
  { id: 'qq', href: 'https://qm.qq.com/q/c7DY18rEju', handle: 'QQ' },
  { id: 'bilibili', href: 'https://space.bilibili.com/1969160969', handle: '1969160969' },
] as const;

export type ContactId = (typeof CONTACTS)[number]['id'];
