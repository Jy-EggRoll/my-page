#!/usr/bin/env node
/**
 * 构建期拉取 GitHub 统计卡片 SVG。
 *
 * 为什么要拉：这两张卡片由 Jy-EggRoll/my-github-stats 生成，本站只引用产物，
 * 每次构建拉一次可以保持数据新鲜。
 * 为什么要兜底：远端挂掉或被限流时构建不能失败，仓库里留了一份快照，拉不到就用它。
 *
 * 安全：用 Node 内置 fetch（undici，默认就是严格校验 TLS 证书）。
 * 任何情况下都不要为了让请求通过而放宽证书校验。
 *
 * 关于代理：undici 的 fetch 默认**不读** http(s)_proxy 环境变量，在有代理的机器上会直连超时。
 * Node 24 提供 NODE_USE_ENV_PROXY=1 让它读取代理，但该变量只在进程启动时生效，
 * 脚本内设置无效，所以构建命令里带上了它（见 package.json 的 build）。
 * 用环境变量而不是 --use-env-proxy 启动参数，是因为旧版 Node 会忽略未知环境变量、
 * 却会对未知启动参数直接报错 —— 前者最差也只是退回快照，不会让构建挂掉。
 *
 * 用法：
 *   pnpm build                                     拉取到 public/<dir>/，失败用快照兜底
 *   node scripts/fetch-stats.mjs --update-snapshot 同时把拉到的内容写回快照目录
 * 日志级别由 LOG_LEVEL 控制（trace/debug/info/warn/error/fatal），默认 info。
 * 注意：深浅两版是同一份文件，深色变体由客户端 URL 片段触发，不需要拉两次。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATS_CARDS, STATS_PUBLIC_DIR, STATS_REMOTE_BASE } from '../src/config/stats.ts';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = join(REPO_ROOT, 'public', STATS_PUBLIC_DIR);
const SNAPSHOT_DIR = join(REPO_ROOT, 'src', 'assets', 'external', STATS_PUBLIC_DIR);
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 512 * 1024;

/** 远端根地址，默认取站点配置；可用 STATS_REMOTE_BASE 覆盖（例如验证兜底路径）。 */
const REMOTE_BASE = process.env.STATS_REMOTE_BASE ?? STATS_REMOTE_BASE;

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const ACTIVE_LEVEL = process.env.LOG_LEVEL ?? 'info';
if (!LEVELS.includes(ACTIVE_LEVEL)) {
  process.stderr.write(`未知的 LOG_LEVEL「${ACTIVE_LEVEL}」，可选：${LEVELS.join(' / ')}\n`);
  process.exit(1);
}

/** 分级日志：带 ISO 时间、级别、调用位置（文件:行），warn 以上走 stderr。 */
function writeLog(level, message, detail) {
  if (LEVELS.indexOf(level) < LEVELS.indexOf(ACTIVE_LEVEL)) return;
  const caller = (new Error().stack ?? '').split('\n').at(3)?.trim().replace(/^at\s+/, '') ?? '?';
  const suffix = detail === undefined ? '' : ` ${JSON.stringify(detail)}`;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase().padEnd(5)} ${message}${suffix}  <${caller}>`;
  const stream =
    level === 'warn' || level === 'error' || level === 'fatal' ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
}
const log = Object.fromEntries(LEVELS.map((level) => [level, (m, d) => writeLog(level, m, d)]));

/** 拉取并校验收到的内容确实是一张 SVG。 */
async function fetchCard(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('svg')) throw new Error(`content-type 不是 svg：${contentType}`);
  const body = await response.text();
  if (body.length > MAX_BYTES) throw new Error(`体积超限：${body.length} 字节`);
  if (!body.trimStart().startsWith('<svg')) throw new Error('内容不是以 <svg 开头');
  return body;
}

const ROOT_SVG_RE = /<svg\b[^>]*>/i;
const VIEWBOX_ATTR_RE = /\bviewBox\s*=/i;

/**
 * 给 SVG 根元素补 viewBox —— 显式声明用户坐标与像素的对应关系。
 *
 * 上游生成器输出的根元素只有 width/height：
 *   <svg id="gh-dark-mode-only" width="360" height="210" xmlns="...">
 * （文件里那些 viewBox="0 0 16 16" 都是内部小图标的，与根元素无关。）
 *
 * 诚实的前提：**这个补丁在 <img> 场景下没有可见收益**。按 SVG 规范，缺 viewBox 时用户
 * 坐标与视口 1:1、内容本不该随元素缩放，但实测不成立：Chromium 153 与 Firefox 都会把它
 * 当整体等比缩放 —— 对同一份字节只插入 viewBox 的 A/B 对照，在 540px 与 300px 两档逐像素
 * 比较，最大差 0、PSNR inf，既没有「白卡 + 左上角一点内容」，窄于 360px 也不溢出被裁。
 * 真正不缩放的是「把 SVG 当顶层文档直接打开」那种引用方式（实测视口 540×315 下根盒仍是
 * 360×210）。所以这里补 viewBox 是**跨引擎、跨引用方式的保险**，不是对某个引擎缺陷的修正。
 *
 * 幂等：已有 viewBox 就原样返回；根标签或 width/height 不符合预期时原样返回并记 warn。
 * 这里绝不抛错 —— 本脚本的既有纪律是「远端挂掉也不能让构建失败」，
 * 一处装饰性补丁更不该成为构建的失败点（补不上最多是图不缩放，仍能正常显示）。
 */
function ensureViewBox(body, file) {
  const tag = ROOT_SVG_RE.exec(body)?.[0];
  if (!tag) {
    log.warn('SVG 根元素格式不符合预期，未补 viewBox，原样写出', { file });
    return body;
  }
  if (VIEWBOX_ATTR_RE.test(tag)) {
    log.debug('SVG 根元素已有 viewBox，跳过', { file });
    return body;
  }
  const width = /\bwidth\s*=\s*"([^"]+)"/i.exec(tag)?.[1];
  const height = /\bheight\s*=\s*"([^"]+)"/i.exec(tag)?.[1];
  if (!width || !height) {
    log.warn('SVG 根元素缺少 width/height，无法推算 viewBox，原样写出', { file });
    return body;
  }
  const viewBox = `0 0 ${width} ${height}`;
  const patched = tag.replace(/\s*>$/, ` viewBox="${viewBox}">`);
  log.debug('已为 SVG 根元素补 viewBox', { file, viewBox });
  return body.replace(tag, patched);
}

async function main() {
  const updateSnapshot = process.argv.includes('--update-snapshot');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let fromRemote = 0;
  let fromSnapshot = 0;

  for (const card of STATS_CARDS) {
    const target = join(OUTPUT_DIR, card.file);
    try {
      // 远端与快照两条路都会写进 public/，所以两条路都要走 ensureViewBox，否则兜底时问题依旧。
      const body = ensureViewBox(await fetchCard(`${REMOTE_BASE}/${card.file}`), card.file);
      writeFileSync(target, body, 'utf8');
      fromRemote += 1;
      log.info('已从远端更新统计卡片', { file: card.file, bytes: body.length });
      if (updateSnapshot) {
        mkdirSync(SNAPSHOT_DIR, { recursive: true });
        // 快照写回的是补过 viewBox 的同一份内容，避免下次兜底又把它退回旧形态。
        writeFileSync(join(SNAPSHOT_DIR, card.file), body, 'utf8');
        log.info('已更新仓库内快照', { file: card.file });
      }
    } catch (error) {
      const snapshot = join(SNAPSHOT_DIR, card.file);
      const reason = String(error?.message ?? error);
      if (!existsSync(snapshot)) {
        // 远端失败且没有快照：这次是真的渲染不出来，宁可让构建失败也不要发布破图。
        log.fatal('远端拉取失败且仓库内没有快照，无法继续', { file: card.file, reason });
        process.exitCode = 1;
        continue;
      }
      writeFileSync(target, ensureViewBox(readFileSync(snapshot, 'utf8'), card.file), 'utf8');
      fromSnapshot += 1;
      log.warn('远端拉取失败，改用仓库内快照', { file: card.file, reason });
    }
  }

  log.info('统计卡片准备完成', { remote: fromRemote, snapshot: fromSnapshot, output: OUTPUT_DIR });
}

await main();
