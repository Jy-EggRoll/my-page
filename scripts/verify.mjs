#!/usr/bin/env node
/**
 * 站点回归验证：用真实浏览器跑两个套件。
 *   1) 外观套件 —— 主题 × 明暗的全部组合能切换、能持久化、视觉真的变化、对比度达标
 *   2) 双语套件 —— 中英静态路由、hreflang、语言切换，以及两个维度互不干扰
 *
 * 这是**本机的可视回归工具**，不是仓库依赖，也**不在 CI 里跑**：
 * 它复用本机安装的 browser-verify skill（定位本机 Chromium、清代理变量、自动截图、
 * 录屏、生成回看页 report.html），因此换台机器或 CI 环境不一定具备前置条件。
 *
 * 依赖的 skill 目录可用环境变量 BROWSER_VERIFY_SKILL 指定，缺省为
 * ~/.qoder-cn/skills/browser-verify；找不到时会给出清晰的安装/指路提示并非零退出。
 *
 * 用法：
 *   1. 先起被测站点：pnpm build && pnpm exec astro preview --port 4321
 *   2. 跑回归：pnpm verify
 *   可用环境变量 TARGET_URL 覆盖被测地址（默认 http://127.0.0.1:4321/my-page/）。
 *   注意 Astro 7 同一项目只允许一个 preview 实例，重启前先 `pnpm exec astro preview stop`。
 */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** 统计卡片的产物目录，取自站点配置（与页面用的是同一个来源）。 */
const { STATS_PUBLIC_DIR } = await import(
  pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'config', 'stats.ts')).href
)

/** 仓库根：本脚本位于 <repo>/scripts/ 下。 */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** browser-verify skill 目录：可配置，缺省取本机 home 下的默认安装位置。 */
const SKILL_DIR =
  process.env.BROWSER_VERIFY_SKILL ?? join(homedir(), '.qoder-cn', 'skills', 'browser-verify')

/** 默认语言的地址；英文站在它的 /en/ 下。 */
const TARGET = process.env.TARGET_URL ?? 'http://127.0.0.1:4321/my-page/'
const EN_URL = `${TARGET.replace(/\/$/, '')}/en/`

/** 现场产物目录：放在仓库下被 git 忽略的 .verify/，不用易失的 /tmp。 */
const ARTIFACTS_ROOT = join(REPO_ROOT, '.verify')

/** 按钮文案来自 src/config/appearance.ts，改配置时这两个清单要同步。 */
const THEME_OPTIONS = [
  { label: 'Fluent', id: 'fluent' },
  { label: 'Material 3', id: 'material' },
  { label: 'Glass', id: 'glass' },
  { label: 'Aurora', id: 'aurora' },
]
const SCHEME_OPTIONS = [
  { label: '浅色', id: 'light' },
  { label: '深色', id: 'dark' },
]

/** 全组合矩阵：主题 × 明暗。 */
const COMBOS = THEME_OPTIONS.flatMap((theme) =>
  SCHEME_OPTIONS.map((scheme) => ({
    theme: theme.label,
    themeId: theme.id,
    scheme: scheme.label,
    schemeId: scheme.id,
  })),
)

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
        `  2. 用环境变量指路：BROWSER_VERIFY_SKILL=/path/to/browser-verify pnpm verify\n\n` +
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
 * 对比度在页面内用 canvas 把 okLCH 计算色转成 RGB 再按 WCAG 公式算，
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

    const rootStyle = getComputedStyle(document.documentElement)
    const bodyStyle = getComputedStyle(document.body)
    // 版式切换会改变元素形态（编辑式刻意不用卡片），所以不再拿「卡片」当量尺，
    // 改测真正随主题变化的量：控件圆角、标签圆角、字距、行高、面板模糊令牌。
    const chip = document.querySelector('[data-chip]')
    const chipStyle = chip ? getComputedStyle(chip) : null
    // 控件圆角的量尺用次按钮：它同样消费 --radius-control，且三种版式、两种语言下
    // 都必然存在（原先拿提示条当量尺，提示条已随页眉进度文案一并移除）。
    const control = document.querySelector('.btn-secondary')
    const controlStyle = control ? getComputedStyle(control) : null
    const heading = document.querySelector('h1')
    const headingStyle = heading ? getComputedStyle(heading) : null
    const paragraph = document.querySelector('.prose')
    const paragraphStyle = paragraph ? getComputedStyle(paragraph) : null
    const accentLink = document.querySelector('.btn-primary')

    return {
      theme: document.documentElement.getAttribute('data-theme'),
      scheme: document.documentElement.getAttribute('data-scheme'),
      htmlLang: document.documentElement.getAttribute('lang'),
      // 页面底色画在 html 上（这样 -z-10 的装饰背景层才可见），body 是透明的，
      // 所以底色必须从 documentElement 读，读 body 会拿到 rgba(0,0,0,0)。
      pageBg: rootStyle.backgroundColor,
      textColor: bodyStyle.color,
      bodyContrast: Number(
        contrast(toRgb(bodyStyle.color), toRgb(rootStyle.backgroundColor)).toFixed(2),
      ),
      chipRadius: chipStyle ? chipStyle.borderRadius : '(无徽章)',
      controlRadius: controlStyle ? controlStyle.borderRadius : '(无控件)',
      panelBlur: rootStyle.getPropertyValue('--blur-panel').trim() || '(未定义)',
      accentBg: accentLink ? getComputedStyle(accentLink).backgroundColor : '(未找到)',
      headingTracking: headingStyle ? headingStyle.letterSpacing : '(无标题)',
      paragraphLeading: paragraphStyle ? paragraphStyle.lineHeight : '(无段落)',
      // 次要文字的对比度。此前只测了正文色，导致浅色主题下次要文字成片不达标
      // （独立复核实测 106 处低于 AA）却没被这套断言发现。
      subtleSamples: ['.entry-meta', '.entry-subtitle', '.section-label', '.site-footer']
        .map((selector) => {
          const el = document.querySelector(selector)
          if (!el) return null
          return {
            selector,
            contrast: Number(
              contrast(
                toRgb(getComputedStyle(el).color),
                toRgb(rootStyle.backgroundColor),
              ).toFixed(2),
            ),
          }
        })
        .filter((sample) => sample !== null),
    }
  })
}

/**
 * 等外观切换的过渡真正结束。
 *
 * 这里刻意不用「连续两次读数相同就算稳定」——点击之后过渡尚未开始的那一瞬间，
 * 两次读数是天然相同的（都是旧值），于是会立刻返回旧主题的颜色。颜色是渐变的，
 * 这个判据必然出现竞态。改为盯 getAnimations()：先确认过渡已开始，再等它跑完。
 */
async function waitForTransitionsToSettle(page) {
  await page
    .waitForFunction(() => document.getAnimations().some((a) => a.playState === 'running'), undefined, {
      timeout: 1000,
    })
    .catch(() => {
      /* 本次切换没有产生过渡（例如该属性根本没变），直接继续 */
    })
  await page
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), undefined, {
      timeout: 3000,
    })
    .catch(() => {
      /* 过渡异常地长，按超时继续，下面的读数会如实反映现场 */
    })
}

async function settledMetrics(page) {
  await waitForTransitionsToSettle(page)
  return metrics(page)
}

/**
 * DOM 结构指纹：只保留标签名与类名，丢掉文本内容。
 * 丢掉文本是必须的 —— 否则中英文页的指纹必然不同（字数不一样），
 * 也就无法用它证明「一套组件服务所有外观/所有语言」。
 */
async function structureFingerprint(page) {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true)
    clone.querySelectorAll('[aria-pressed]').forEach((el) => el.removeAttribute('aria-pressed'))
    const walk = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      const element = /** @type {Element} */ (node)
      const children = [...element.childNodes].map(walk).join('')
      return `<${element.tagName.toLowerCase()} class="${element.getAttribute('class') ?? ''}">${children}</${element.tagName.toLowerCase()}>`
    }
    return walk(clone)
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

/** 套件一：外观（主题 × 明暗）。 */
async function appearanceSuite(page, report) {
  report.section('外观套件')

  await report.check('页面可打开，两个外观维度的控件都在', async () => {
    await page.goto(TARGET, { waitUntil: 'load' })
    await page.waitForSelector('[data-section-id="projects"] [data-entry]', { timeout: 15000 })
    for (const label of [...THEME_OPTIONS, ...SCHEME_OPTIONS].map((option) => option.label)) {
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
        `正文对比度 ${m.bodyContrast}:1 ｜ 控件圆角 ${m.controlRadius} ｜ 标签圆角 ${m.chipRadius}`,
      )
      report.note(
        `标题字距 ${m.headingTracking} ｜ 正文行高 ${m.paragraphLeading} ｜ 面板模糊 ${m.panelBlur}`,
      )
    })
    await report.shot(`${combo.theme} · ${combo.scheme} 整页`)
  }

  await report.check('所有组合的正文对比度都达到 WCAG AA（≥ 4.5:1）', async () => {
    // 先确认真的采到全部数据，否则断言会因为数组为空而空过——那是假通过。
    if (collected.length !== COMBOS.length) {
      throw new Error(`只采到 ${collected.length} 组数据，期望 ${COMBOS.length} 组，无法判断对比度`)
    }
    const bad = collected.filter((entry) => entry.m.bodyContrast < 4.5)
    if (bad.length > 0) {
      throw new Error(bad.map((e) => `${e.theme}·${e.scheme} 仅 ${e.m.bodyContrast}:1`).join('；'))
    }
    report.note(collected.map((e) => `${e.theme}·${e.scheme}=${e.m.bodyContrast}`).join('  '))
  })

  await report.check('所有组合的页面底色互不相同（明暗与主题都真的生效）', async () => {
    const backgrounds = new Set(collected.map((entry) => entry.m.pageBg))
    if (backgrounds.size !== COMBOS.length) {
      throw new Error(`期望 ${COMBOS.length} 种底色，实际 ${backgrounds.size} 种`)
    }
    report.note([...backgrounds].join('  |  '))
  })

  await report.check('次要文字（元信息/副标题/页脚）也达到 WCAG AA（4.5:1）', async () => {
    if (collected.length !== COMBOS.length) {
      throw new Error(`只采到 ${collected.length} 组数据，无法判断次要文字对比度`)
    }
    const bad = collected.flatMap((entry) =>
      entry.m.subtleSamples
        .filter((sample) => sample.contrast < 4.5)
        .map((sample) => `${entry.theme}·${entry.scheme} ${sample.selector}=${sample.contrast}:1`),
    )
    if (bad.length > 0) {
      throw new Error(`次要文字对比度不足 ${bad.length} 处：${bad.slice(0, 6).join('；')}`)
    }
    const total = collected.reduce((sum, entry) => sum + entry.m.subtleSamples.length, 0)
    report.note(`共检查 ${total} 处次要文字，全部 ≥ 4.5:1`)
  })

  await report.check('两套主题的形状语言确实不同（圆角/字距/行高/模糊）', async () => {
    const fluent = collected.find((entry) => entry.themeId === 'fluent')
    const material = collected.find((entry) => entry.themeId === 'material')
    const fields = ['chipRadius', 'controlRadius', 'headingTracking', 'paragraphLeading', 'panelBlur']
    const unchanged = fields.filter((field) => fluent.m[field] === material.m[field])
    if (unchanged.length > 0) {
      throw new Error(`这些形状/排版字段在两套主题间没有区别：${unchanged.join(', ')}`)
    }
    report.note(fields.map((f) => `${f}: ${fluent.m[f]} → ${material.m[f]}`).join('  ｜  '))
  })

  await report.check('所有组合共用同一套 DOM（一套组件服务全部外观）', async () => {
    const fingerprints = []
    for (const combo of COMBOS) {
      await selectCombo(page, combo)
      await page.waitForTimeout(120)
      fingerprints.push(await structureFingerprint(page))
    }
    if (new Set(fingerprints).size !== 1) {
      throw new Error('切换外观改变了 DOM 结构，说明主题没有完全走令牌层')
    }
    report.note(`所有组合 DOM 结构一致，指纹长度 ${fingerprints[0].length}`)
  })

  await report.check('刷新后主题与明暗都保持（两个维度各自持久化）', async () => {
    const last = COMBOS.at(-1)
    await selectCombo(page, last)
    await page.reload({ waitUntil: 'load' })
    await page.waitForSelector('[data-section-id="projects"] [data-entry]', { timeout: 15000 })
    const after = await settledMetrics(page)
    if (after.theme !== last.themeId || after.scheme !== last.schemeId) {
      throw new Error(`刷新后期望 ${last.themeId}/${last.schemeId}，实际 ${after.theme}/${after.scheme}`)
    }
  })
}

/** 套件二：中英双语静态路由与切换。 */
async function i18nSuite(page, report) {
  report.section('双语套件')

  await report.check('中文页在根路径，<html lang> 与正文都是中文', async () => {
    await page.goto(TARGET, { waitUntil: 'load' })
    await page.waitForSelector('h1', { timeout: 15000 })
    const m = await metrics(page)
    const heading = (await page.locator('h1').textContent()) ?? ''
    report.note(`lang=${m.htmlLang} ｜ 标题：${heading.trim()}`)
    if (m.htmlLang !== 'zh-CN') throw new Error(`期望 lang=zh-CN，实际 ${m.htmlLang}`)
    if (!/[\u4e00-\u9fa5]/.test(heading)) {
      throw new Error(`中文页标题里没有汉字：${JSON.stringify(heading)}`)
    }
  })

  await report.check('两种语言各输出 3 条 hreflang，且地址只带一层 /my-page', async () => {
    const collect = async () =>
      page.evaluate(() =>
        [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((el) => ({
          hreflang: el.getAttribute('hreflang'),
          href: el.getAttribute('href') ?? '',
        })),
      )
    const zhLinks = await collect()
    report.note(zhLinks.map((l) => `${l.hreflang}=${l.href}`).join('  '))
    if (zhLinks.length !== 3) {
      throw new Error(`期望 3 条 hreflang（zh-CN/en/x-default），实际 ${zhLinks.length} 条`)
    }
    const doubled = zhLinks.filter((l) => /\/my-page\/my-page/.test(l.href))
    if (doubled.length > 0) {
      throw new Error(`hreflang 里出现重复子路径：${doubled.map((l) => l.href).join(', ')}`)
    }
    await page.goto(EN_URL, { waitUntil: 'load' })
    const enLinks = await collect()
    if (enLinks.length !== 3) {
      throw new Error(`英文页期望 3 条 hreflang，实际 ${enLinks.length} 条`)
    }
  })

  await report.check('点语言切换器能切到英文页，且正文变成英文', async () => {
    await page.goto(TARGET, { waitUntil: 'load' })
    await page.waitForSelector('h1', { timeout: 15000 })
    await page.getByRole('link', { name: 'English' }).click()
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'en', undefined, {
      timeout: 5000,
    })
    const heading = ((await page.locator('h1').textContent()) ?? '').trim()
    report.note(`导航到 ${page.url()} ｜ 标题：${heading}`)
    if (!/\/my-page\/en\/$/.test(page.url())) {
      throw new Error(`期望跳到 /my-page/en/，实际 ${page.url()}`)
    }
    if (/[\u4e00-\u9fa5]/.test(heading)) {
      throw new Error(`英文页标题里仍有汉字：${JSON.stringify(heading)}`)
    }
  })

  await report.check('英文页的外观控件也跟着翻译（Light/Dark 而非浅色/深色）', async () => {
    const hasEnglishLabels = await page.getByRole('button', { name: 'Light' }).count()
    const hasChineseLabels = await page.getByRole('button', { name: '浅色' }).count()
    if (hasEnglishLabels !== 1 || hasChineseLabels !== 0) {
      throw new Error(
        `期望英文页只有 Light、没有浅色，实际 Light=${hasEnglishLabels}、浅色=${hasChineseLabels}`,
      )
    }
  })

  await report.check('切回中文页正常，且外观选择跨语言保留（两个维度互不干扰）', async () => {
    const before = await settledMetrics(page)
    await page.getByRole('link', { name: '中文' }).click()
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'zh-CN', undefined, {
      timeout: 5000,
    })
    const after = await settledMetrics(page)
    report.note(`英文页时 ${before.theme}/${before.scheme} → 切回中文后 ${after.theme}/${after.scheme}`)
    if (after.theme !== before.theme || after.scheme !== before.scheme) {
      throw new Error(
        `切语言后外观被重置了：${before.theme}/${before.scheme} → ${after.theme}/${after.scheme}`,
      )
    }
  })
}

/** 套件三：内容完整性（各语言板块齐全、条目数一致、结构一致）。 */
async function contentSuite(page, report) {
  report.section('内容套件')

  /** 期望的板块及其顺序（顺序错了同样算问题）。 */
  const EXPECTED_SECTIONS = [
    'summary',
    'education',
    'experience',
    'projects',
    'skills',
    'languages',
    'awards',
    'certifications',
    'interests',
    'volunteer',
  ]

  /** 各板块的条目数直接从 DOM 读，不写死具体数字。 */
  const readContent = async () =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('[data-section-id]')].map((section) => [
          section.dataset.sectionId,
          {
            entries: section.querySelectorAll('[data-entry]').length,
            heading: (section.querySelector('h2')?.textContent ?? '').trim(),
          },
        ]),
      ),
    )

  const measured = {}

  for (const locale of ['zh', 'en']) {
    await report.check(`${locale === 'zh' ? '中文' : '英文'}页板块齐全、顺序正确、条目非空`, async () => {
      await page.goto(locale === 'zh' ? TARGET : EN_URL, { waitUntil: 'load' })
      await page.waitForSelector('[data-section-id]', { timeout: 15000 })
      const content = await readContent()
      measured[locale] = content
      const ids = Object.keys(content)
      report.note(`板块顺序：${ids.join(' → ')}`)
      const missing = EXPECTED_SECTIONS.filter((id) => !ids.includes(id))
      if (missing.length > 0) throw new Error(`缺少板块：${missing.join(', ')}`)
      const wrongOrder = EXPECTED_SECTIONS.filter((id, index) => ids[index] !== id)
      if (wrongOrder.length > 0) {
        throw new Error(`板块顺序与预期不符，首个不对的是「${wrongOrder[0]}」`)
      }
      const empty = EXPECTED_SECTIONS.filter((id) => id !== 'summary' && content[id].entries < 1)
      if (empty.length > 0) throw new Error(`这些板块没有条目：${empty.join(', ')}`)
      report.note(
        EXPECTED_SECTIONS.map((id) => `${content[id].heading}(${content[id].entries})`).join('  '),
      )
    })
  }

  await report.check('统计卡片的图片真的加载出来了（不是破图）', async () => {
    await page.goto(TARGET, { waitUntil: 'load' })
    // 只等元素挂上，不要等「可见」：每张卡片有两个 img（浅/深变体），
    // 其中一个必然被 display:none 隐藏，而 waitForSelector 默认要可见，
    // 又只会盯着第一个匹配，于是会一直等那个隐藏的变体。
    await page.waitForSelector('section figure img', { state: 'attached', timeout: 15000 })
    // 等可见的那一版加载完：深色版被 display:none 隐藏，浏览器不会加载它，
    // 所以只断言「当前显示的那一版」。
    await page.waitForFunction(
      () => {
        const visible = [...document.querySelectorAll('section figure img')].filter(
          (img) => getComputedStyle(img).display !== 'none',
        )
        return visible.length > 0 && visible.every((img) => img.complete)
      },
      undefined,
      { timeout: 15000 },
    )
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('section figure img')]
        .filter((img) => getComputedStyle(img).display !== 'none')
        .filter((img) => img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    )
    if (broken.length > 0) throw new Error(`这些统计卡片图片加载失败：${broken.join(', ')}`)
    const loaded = await page.evaluate(
      () =>
        [...document.querySelectorAll('section figure img')].filter(
          (img) => getComputedStyle(img).display !== 'none',
        ).length,
    )
    // 卡片 SVG 内部各行带入场动画（tr 从 translateX(-200%) 滑入，耗时 2s 且有递减延迟）。
    // 动画发生在图片文档内部、从页面侧观察不到，所以只能按已知时长等待，
    // 否则回看页里留下的会是「滑到一半」的误导性截图。
    await page.waitForTimeout(2600)
    report.note(`当前明暗下可见的统计卡片图片 ${loaded} 张，均加载成功（已等入场动画结束）`)
  })

  await report.check('统计卡片按明暗切换显示版本，且深色配色规则确实在产物里', async () => {
    await page.goto(TARGET, { waitUntil: 'load' })

    const readVisible = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('section figure img')]
          .filter((img) => getComputedStyle(img).display !== 'none')
          .map((img) => (img.classList.contains('stats-dark') ? 'dark' : 'light')),
      )

    await page.getByRole('button', { name: '浅色' }).click()
    await waitForTransitionsToSettle(page)
    const inLight = await readVisible()
    await page.getByRole('button', { name: '深色' }).click()
    await waitForTransitionsToSettle(page)
    const inDark = await readVisible()
    report.note(`浅色方案显示：${inLight.join(',') || '(无)'} ｜ 深色方案显示：${inDark.join(',') || '(无)'}`)

    if (inLight.length === 0 || inLight.some((variant) => variant !== 'light')) {
      throw new Error(`浅色方案下应只显示浅色版，实际 ${inLight.join(',') || '(无)'}`)
    }
    if (inDark.length === 0 || inDark.some((variant) => variant !== 'dark')) {
      throw new Error(`深色方案下应只显示深色版，实际 ${inDark.join(',') || '(无)'}`)
    }

    // 深色变体是同一份文件靠 SVG 内部的 :target 规则切色，
    // 所以产物里必须真的存在这条规则，否则片段带了也不会变深。
    // （不能用 canvas 取像素验证：该 SVG 含 foreignObject，会被浏览器标记为
    //   「已污染」而禁止读回像素。）
    const response = await fetch(`${TARGET}${STATS_PUBLIC_DIR}/overview.svg`)
    const svg = await response.text()
    if (!svg.includes(':target')) {
      throw new Error('产物里的统计卡片 SVG 不含 :target 规则，深色变体不会生效')
    }
    report.note(`产物 SVG 含 :target 规则，长度 ${svg.length}`)
  })

  await report.check('两种语言的条目数与 DOM 结构一致（一套组件服务两种语言）', async () => {
    const zh = measured.zh
    const en = measured.en
    const mismatched = EXPECTED_SECTIONS.filter((id) => zh[id]?.entries !== en[id]?.entries)
    if (mismatched.length > 0) {
      throw new Error(
        mismatched.map((id) => `${id}: zh ${zh[id]?.entries} vs en ${en[id]?.entries}`).join('；'),
      )
    }
    report.note(EXPECTED_SECTIONS.map((id) => `${id}=${zh[id]?.entries}`).join('  '))
    await page.goto(TARGET, { waitUntil: 'load' })
    const zhFingerprint = await structureFingerprint(page)
    await page.goto(EN_URL, { waitUntil: 'load' })
    const enFingerprint = await structureFingerprint(page)
    if (zhFingerprint !== enFingerprint) {
      throw new Error('两种语言的 DOM 结构不一致，说明存在文案之外的结构差异')
    }
    report.note(`两种语言 DOM 骨架一致，指纹长度 ${zhFingerprint.length}`)
  })
}

/** 套件四：版式（同一份 DOM 的三套编排）。 */
async function layoutSuite(page, report) {
  report.section('版式套件')

  const LAYOUTS = [
    { id: 'editorial', label: '编辑式' },
    { id: 'terminal', label: '终端' },
    { id: 'bento', label: '便当格' },
  ]

  const measured = {}

  /** 量：横向溢出、大标题每行的字符数（用来抓「末行只剩 1–2 个字」的怪折行）、板块顺序。 */
  const probe = () =>
    page.evaluate(() => {
      const root = document.documentElement
      const h1 = document.querySelector('h1')
      let lines = []
      if (h1) {
        const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT)
        const nodes = []
        while (walker.nextNode()) nodes.push(walker.currentNode)
        const byLine = new Map()
        for (const node of nodes) {
          for (let i = 0; i < node.length; i += 1) {
            const range = document.createRange()
            range.setStart(node, i)
            range.setEnd(node, i + 1)
            const rect = range.getBoundingClientRect()
            if (rect.width === 0) continue
            const key = Math.round(rect.top)
            byLine.set(key, (byLine.get(key) ?? 0) + 1)
          }
        }
        lines = [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([, n]) => n)
      }
      const sections = [...document.querySelectorAll('[data-section-id]')].map((el) => ({
        id: el.dataset.sectionId,
        entries: el.querySelectorAll('[data-entry]').length,
      }))
      return {
        overflow: root.scrollWidth - root.clientWidth,
        lines,
        sections,
        railVisible: (() => {
          const rail = document.querySelector('.rail-nav')
          return rail ? getComputedStyle(rail).display !== 'none' : null
        })(),
      }
    })

  /** 两种视口都要过：粗体排版最容易在窄屏折出孤立单字或横向溢出。 */
  const VIEWPORTS = [
    { name: '桌面 1280', width: 1280, height: 900 },
    { name: '窄屏 390', width: 390, height: 844 },
    { name: '窄屏 360', width: 360, height: 800 },
  ]

  for (const viewport of VIEWPORTS) {
    for (const layout of LAYOUTS) {
      await report.check(
        `${viewport.name}｜版式「${layout.label}」：无横向溢出、大标题无孤立单字、结构完整`,
        async () => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height })
          await page.goto(TARGET, { waitUntil: 'load' })
          await page.evaluate(
            (id) => document.documentElement.setAttribute('data-layout', id),
            layout.id,
          )
          await page.waitForTimeout(600)
          const info = await probe()
          if (viewport.width === VIEWPORTS[0].width) measured[layout.id] = info
          report.note(
            `横向溢出 ${info.overflow}px ｜ h1 每行字数 [${info.lines.join(', ')}] ｜ 板块 ${info.sections.length} 个 ｜ 侧栏 ${info.railVisible ? '显示' : '隐藏'}`,
          )
          if (info.overflow > 0) throw new Error(`出现横向溢出 ${info.overflow}px`)
          if (info.sections.length < 11) {
            throw new Error(`板块数仅 ${info.sections.length} 个，结构钩子可能有缺失`)
          }
          const last = info.lines.at(-1)
          if (info.lines.length > 1 && last !== undefined && last <= 2) {
            throw new Error(
              `大标题末行只剩 ${last} 个字符，属于怪异折行：[${info.lines.join(', ')}]`,
            )
          }
          // 侧栏导航只在桌面宽度的终端版式下出现：窄屏隐藏它是刻意的设计决定
          // （否则页头会叠成很高的一块，实测一度到 241px）
          const expectRail = layout.id === 'terminal' && viewport.width >= 1024
          if (expectRail && info.railVisible !== true) {
            throw new Error('桌面宽度下终端版式应显示侧栏导航')
          }
          if (!expectRail && info.railVisible === true) {
            throw new Error(`视口 ${viewport.name} 下版式「${layout.label}」不该显示侧栏导航`)
          }
        },
      )
      await report.shot(`${viewport.name}｜版式 ${layout.label}`)
    }
  }

  await report.check('三套版式的板块顺序与条目数完全一致（版式只改编排，不改内容）', async () => {
    const [reference, ...others] = LAYOUTS.map((layout) => measured[layout.id])
    if (others.some((entry) => entry === undefined)) {
      throw new Error('有版式没有采到数据，无法比较')
    }
    const fingerprint = (entry) => JSON.stringify(entry.sections)
    const mismatch = others.filter((entry) => fingerprint(entry) !== fingerprint(reference))
    if (mismatch.length > 0) {
      throw new Error('不同版式下的板块顺序或条目数不一致')
    }
    report.note(`三套版式的板块指纹一致：${reference.sections.length} 个板块`)
  })
}

async function main() {
  const run = createRun({ root: ARTIFACTS_ROOT, title: '站点回归：外观 × 双语 × 内容' })
  const report = createReport({ title: '站点回归：外观 × 双语 × 内容', run })
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

    report.note(`中文页：${TARGET}`)
    report.note(`英文页：${EN_URL}`)
    report.note(`浏览器：${handle.executablePath}（${handle.source}）`)

    // 截图是视口截图，而页面远比默认视口高。先把视口调到整页高度，
    // 否则回看页里只能看到上半页，下方的板块根本没有证据。
    await page.goto(TARGET, { waitUntil: 'load' })
    await page.waitForSelector('h1', { timeout: 15000 })
    const pageHeight = await page.evaluate(() => document.body.scrollHeight)
    const captureHeight = Math.min(Math.max(pageHeight, 900), 4000)
    await page.setViewportSize({ width: 1280, height: captureHeight })
    report.note(`视口高度设为 ${captureHeight}px（页面实际 ${pageHeight}px）`)

    await appearanceSuite(page, report)
    await i18nSuite(page, report)
    await contentSuite(page, report)
    await layoutSuite(page, report)

    await report.check('整个过程中控制台没有任何报错', async () => {
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
