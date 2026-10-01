import type { Locale } from './i18n';

export interface StatsCard {
  /** 远端与本地的文件名。深浅两版是同一份字节：深色变体由客户端 URL 片段触发 */
  file: string;
  title: Record<Locale, string>;
  /** 无障碍替代文本 */
  alt: Record<Locale, string>;
}

/**
 * 统计卡片的数据源，也是远端布局的唯一来源。
 * scripts/fetch-stats.mjs 直接 import 本文件（Node 24 原生剥离 TS 类型），
 * 所以这里不需要为脚本再抄一份清单。
 */
export const STATS_REMOTE_BASE =
  'https://raw.githubusercontent.com/Jy-EggRoll/my-github-stats/generated';

/** 抓取产物写入 public 下的这个目录，构建后对应站点根下的 /<dir>/。 */
export const STATS_PUBLIC_DIR = 'stats';

export const STATS_CARDS: readonly StatsCard[] = [
  {
    file: 'overview.svg',
    title: { zh: '总览', en: 'Overview' },
    alt: { zh: 'GitHub 仓库与 star 总览', en: 'GitHub repositories and stars overview' },
  },
  {
    file: 'languages.svg',
    title: { zh: '语言分布', en: 'Languages' },
    alt: { zh: 'GitHub 语言使用分布', en: 'GitHub language distribution' },
  },
];

/**
 * 深色变体靠 URL 片段触发。
 * SVG 内部用 `#gh-dark-mode-only:target` 规则切换到深色配色 —— 无片段是浅色，
 * 带上这个片段时该元素成为 :target，于是变深色。所以只有一个文件、只用 <img> 引用即可，
 * 千万不要把这两个 SVG 内联进页面：它们自带的 <style> 里是按 #background/th/td
 * 这类全局选择器写的，内联会污染整站样式。
 */
export const STATS_DARK_VARIANT_FRAGMENT = 'gh-dark-mode-only';
