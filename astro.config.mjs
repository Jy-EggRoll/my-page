// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jy-eggroll.github.io',
  // 子路径部署：所有内部链接与资源必须经由 src/utils/url.ts 的 withBase()，
  // 禁止在组件里出现裸路径。
  base: '/my-page',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      // 默认语言不加前缀（中文在 /，英文在 /en/），与 src/config/i18n.ts 的约定一致
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
