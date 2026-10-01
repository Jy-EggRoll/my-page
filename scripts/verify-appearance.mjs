#!/usr/bin/env node
/**
 * 外观回归：用真实浏览器验证「主题风格 × 明暗」两个正交维度真的能切换、真的持久化、
 * 视觉真的变化，并客观计算正文对比度。
 *
 * 这是**本机的可视回归工具**，不是仓库依赖，也**不在 CI 里跑**：
 * 它复用本机安装的 browser-verify skill（定位本机 Chromium、清代理变量、自动截图、
 * 录屏、生成回看页 report.html），因此换台机器或 CI 环境不一定具备前置条件。
 *
 * 依赖的 skill 目录可用环境变量 BROWSER_VERIFY_SKILL 指定，缺省为
 * ~/.qoder-cn/skills/browser-verify；找不到时会给出清晰的安装/指路提示并非零退出。
 *
 * 用法：
 *   1. 先起被测站点：pnpm build && pnpm preview --port 4321
 *   2. 跑回归：pnpm verify:appearance
 *   可用环境变量 TARGET_URL 覆盖被测地址（默认 http://127.0.0.1:4321/my-page/）。
 *   注意 Astro 7 同一项目只允许一个 preview 实例，重启前先 `pnpm exec astro preview stop`。
 */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** 仓库根：本脚本位于 <repo>/scripts/ 下。 */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** browser-verify skill 目录：可配置，缺省取本机 home 下的默认安装位置。 */
const SKILL_DIR =
  process.env.BROWSER_VERIFY_SKILL ?? join(homedir(), '.qoder-cn', 'skills', 'browser-verify')

/** 被测地址：默认本地 preview，可用 TARGET_URL 覆盖。 */
const TARGET = process.env.TARGET_URL ?? 'http://127.0.0.1:4321/my-page/'

/** 现场产物目录：放在仓库下被 git 忽略的 .verify/，不用易失的 /tmp。 */
const ARTIFACTS_ROOT = join(REPO_ROOT, '.verify')

const TITLE = 'Phase 2 外观回归：主题 × 明暗 四组合'

/** 四种外观组合。按钮文案来自 src/config/appearance.ts，改配置时这里要同步。 */
const COMBOS = [
  { theme: 'Fluent', themeId: 'fluent', scheme: '浅色', schemeId: 'light' },
  { theme: 'Fluent', themeId: 'fluent', scheme: '深色', schemeId: 'dark' },
  { theme: 'Material 3', themeId: 'material', scheme: '浅色', schemeId: 'light' },
  { theme: 'Material 3', themeId: 'material', scheme: '深色', schemeId: 'dark' },
]

/**
 * 加载 skill 里的一个 lib 模块。
 * 用动态 import + pathToFileURL，因为 skill 目录是运行时才确定的。
 * @param {string} name - lib 下的文件名（如 'browser.mjs'）。
 * @returns {Promise<Record<string, unknown>>} 模块命名空间。
 */
async function loadLib(name) {
  const path = join(SKILL_DIR, 'lib', name)
  if (!existsSync(path)) {
    process.stderr.write(
      `\n[browser-verify] 找不到本机验证工具库：\n  ${path}\n\n` +
        `这份脚本复用本机的 browser-verify skill（定位 Chromium、清代理、截图/录屏/回看页），\n` +
        `它不属于仓库依赖，也不在 CI 里跑。请任选其一：\n\n` +
        `  1. 把该 skill 装到默认位置：${join(homedir(), '.qoder-cn', 'skills', 'browser-verify')}\n` +
        `     （目录内需有 lib/browser.mjs、lib/report.mjs、lib/artifacts.mjs，并在其中 pnpm install）\n` +
        `  2. 用环境变量指路：BROWSER_VERIFY_SKILL=/path/to/browser-verify pnpm verify:appearance\n\n` +
        `当前 skill 目录：${SKILL_DIR}${process.env.BROWSER_VERIFY_SKILL ? '（来自 BROWSER_VERIFY_SKILL）' : '（默认位置）'}\n\n`,
    )
    process.exit(1)
  }
  return import(pathToFileURL(path).href)
}

const { launchBrowser, openPage } = await loadLib('browser.mjs')
const { createReport } = await loadLib('report.mjs')
const { createRun } = await loadLib('artifacts.mjs')

/**
 * 读「实际渲染出来的东西」——计算样式才是用户看得见的部分。
 * 其中对比度在页面内用 canvas 把 okLCH 计算色转成 RGB 再按 WCAG 公式算，
 * 因为深色模式最容易出的问题就是文字对比度不足。
 */
async function metrics(page) {
  return page.evaluate(() => {
    const toRgb = (cssColor) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 1, 1)
      ctx.fillStyle = cssColor
      ctx.fillRect(0, 0, 1, 1)
      const data = ctx.getImageData(0, 0, 1, 1).data
      return [data[0], data[1], data[2]]
    }
    const luminance = ([r, g, b]) => {
      const channel = (v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }
    const contrast = (a, b) => {
      const la = luminance(a)
      const lb = luminance(b)
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
    }

    const body = getComputedStyle(document.body)
    const card = document.querySelector('article')
    const cardStyle = card ? getComputedStyle(card) : null
    const chip = document.querySelector('section span')
    const chipStyle = chip ? getComputedStyle(chip) : null
    const heading = document.querySelector('h1')
    const headingStyle = heading ? getComputedStyle(heading) : null
    const paragraph = document.querySelector('section p')
    const paragraphStyle = paragraph ? getComputedStyle(paragraph) : null

    return {
      theme: document.documentElement.getAttribute('data-theme'),
      scheme: document.documentElement.getAttribute('data-scheme'),
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      bodyContrast: Number(contrast(toRgb(body.color), toRgb(body.backgroundColor)).toFixed(2)),
      cardRadius: cardStyle ? cardStyle.borderRadius : '(无卡片)',
      cardShadow: cardStyle ? cardStyle.boxShadow : '(无卡片)',
      cardBlur: cardStyle
        ? cardStyle.backdropFilter || cardStyle.webkitBackdropFilter || 'none'
        : '(无卡片)',
      cardBorderColor: cardStyle ? cardStyle.borderTopColor : '(无卡片)',
      chipRadius: chipStyle ? chipStyle.borderRadius : '(无徽章)',
      headingTracking: headingStyle ? headingStyle.letterSpacing : '(无标题)',
      paragraphLeading: paragraphStyle ? paragraphStyle.lineHeight : '(无段落)',
    }
  })
}

/**
 * 等计算样式稳定下来再取值。
 * body 有 transition-colors、卡片有 transition-shadow（半径与模糊没有过渡），
 * 点击后立刻读会读到过渡中的中间值——那是测量时机问题，不是外观没切换。
 */
async function settledMetrics(page) {
  let previous
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const current = await metrics(page)
    if (previous !== undefined && JSON.stringify(previous) === JSON.stringify(current)) return current
    previous = current
    await page.waitForTimeout(50)
  }
  throw new Error('计算样式在 2 秒内没有稳定，可能过渡一直没结束')
}

/** DOM 结构指纹：去掉会随交互变化的 aria-pressed，只留标签与类名。 */
async function structureFingerprint(page) {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true)
    clone.querySelectorAll('[aria-pressed]').forEach((el) => el.removeAttribute('aria-pressed'))
    return clone.innerHTML.replace(/\s+/g, ' ').trim().length
  })
}

async function selectCombo(page, combo) {
  await page.getByRole('button', { name: combo.theme }).click()
  await page.getByRole('button', { name: combo.scheme }).click()
  await page.waitForFunction(
    ([themeId, schemeId]) =>
      document.documentElement.getAttribute('data-theme') === themeId &&
      document.documentElement.getAttribute('data-scheme') === schemeId,
    [combo.themeId, combo.schemeId],
    { timeout: 5000 },
  )
}

async function main() {
  const run = createRun({ root: ARTIFACTS_ROOT, title: TITLE })
  const report = createReport({ title: TITLE, run })
  const handle = await launchBrowser({ headless: true })

  let page
  report.attachPage(() => page)
  const consoleErrors = []

  try {
    page = await openPage(handle.browser, {
      videoDir: run.videoDir,
      viewport: { width: 1280, height: 1500 },
    })
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

    report.note(`目标：${TARGET}`)
    report.note(`浏览器：${handle.executablePath}（${handle.source}）`)

    await report.check('0. 页面可打开，两个维度的切换控件都在', async () => {
      await page.goto(TARGET, { waitUntil: 'load' })
      await page.waitForSelector('article', { timeout: 15000 })
      for (const label of ['Fluent', 'Material 3', '浅色', '深色']) {
        const count = await page.getByRole('button', { name: label }).count()
        if (count !== 1) throw new Error(`按钮「${label}」应恰好 1 个，实际 ${count} 个`)
      }
    })

    const collected = []

    for (const combo of COMBOS) {
      report.section(`${combo.theme} · ${combo.scheme}`)
      await report.check(`切换到 ${combo.theme} · ${combo.scheme}（真实点击）`, async () => {
        await selectCombo(page, combo)
        const m = await settledMetrics(page)
        collected.push({ ...combo, m })
        report.note(`属性 data-theme=${m.theme} data-scheme=${m.scheme}`)
        report.note(
          `正文对比度 ${m.bodyContrast}:1 ｜ 卡片圆角 ${m.cardRadius} ｜ 徽章圆角 ${m.chipRadius}`,
        )
        report.note(
          `标题字距 ${m.headingTracking} ｜ 正文行高 ${m.paragraphLeading} ｜ 面板模糊 ${m.cardBlur} ｜ 描边 ${m.cardBorderColor}`,
        )
      })
      await report.shot(`${combo.theme} · ${combo.scheme} 整页`)
    }

    await report.check('1. 四种组合的正文对比度都达到 WCAG AA（≥ 4.5:1）', async () => {
      // 先确认真的采到 4 组数据，否则断言会因为数组为空而空过——那是假通过。
      if (collected.length !== COMBOS.length) {
        throw new Error(`只采到 ${collected.length} 组数据，期望 ${COMBOS.length} 组，无法判断对比度`)
      }
      const bad = collected.filter((entry) => entry.m.bodyContrast < 4.5)
      if (bad.length > 0) {
        throw new Error(bad.map((e) => `${e.theme}·${e.scheme} 仅 ${e.m.bodyContrast}:1`).join('；'))
      }
      report.note(collected.map((e) => `${e.theme}·${e.scheme}=${e.m.bodyContrast}`).join('  '))
    })

    await report.check('2. 四种组合的背景色互不相同（明暗与主题都真的生效）', async () => {
      const backgrounds = new Set(collected.map((entry) => entry.m.bodyBg))
      if (backgrounds.size !== COMBOS.length) {
        throw new Error(`期望 ${COMBOS.length} 种背景色，实际 ${backgrounds.size} 种`)
      }
      report.note([...backgrounds].join('  |  '))
    })

    await report.check('3. 两套主题的形状语言确实不同（圆角/徽章/模糊/字距/行高）', async () => {
      const fluent = collected.find((entry) => entry.themeId === 'fluent')
      const material = collected.find((entry) => entry.themeId === 'material')
      const fields = ['cardRadius', 'chipRadius', 'cardBlur', 'headingTracking', 'paragraphLeading']
      const unchanged = fields.filter((field) => fluent.m[field] === material.m[field])
      if (unchanged.length > 0) {
        throw new Error(`这些形状/排版字段在两套主题间没有区别：${unchanged.join(', ')}`)
      }
      report.note(fields.map((f) => `${f}: ${fluent.m[f]} → ${material.m[f]}`).join('  ｜  '))
    })

    await report.check('4. 四种组合共用同一套 DOM（一套组件服务所有外观）', async () => {
      const lengths = []
      for (const combo of COMBOS) {
        await selectCombo(page, combo)
        await page.waitForTimeout(120)
        lengths.push(await structureFingerprint(page))
      }
      if (new Set(lengths).size !== 1) {
        throw new Error(`DOM 结构指纹不一致：${lengths.join(', ')}`)
      }
      report.note(`四种组合 DOM 指纹一致，长度 ${lengths[0]}`)
    })

    await report.check('5. 刷新后主题与明暗都保持（两个维度各自持久化）', async () => {
      await selectCombo(page, COMBOS[3])
      await page.reload({ waitUntil: 'load' })
      await page.waitForSelector('article', { timeout: 15000 })
      const after = await settledMetrics(page)
      if (after.theme !== COMBOS[3].themeId || after.scheme !== COMBOS[3].schemeId) {
        throw new Error(`刷新后期望 ${COMBOS[3].themeId}/${COMBOS[3].schemeId}，实际 ${after.theme}/${after.scheme}`)
      }
    })

    await report.check('6. 整个过程中控制台没有任何报错', async () => {
      if (consoleErrors.length > 0) {
        throw new Error(`控制台报错 ${consoleErrors.length} 条：${consoleErrors.join(' | ')}`)
      }
      report.note('控制台 0 报错')
    })

    return report.summary()
  } finally {
    await handle.browser.close()
    const gallery = report.finish()
    if (gallery !== undefined) console.log(`\n回看页（含录屏与截图）：${gallery}`)
    console.log(`现场目录：${run.dir}`)
  }
}

main()
  .then((code) => {
    process.exitCode = code ?? 0
  })
  .catch((error) => {
    process.stderr.write(`\n验证脚本本身失败：${error?.stack ?? error}\n`)
    process.exitCode = 2
  })
