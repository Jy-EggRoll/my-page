/**
 * 站点部署在子路径下（GitHub Pages 的 /my-page），裸路径会全部失效。
 * 这里是与 base 相关的唯一出口，组件里禁止直接写 '/xxx'。
 */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!path) return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
