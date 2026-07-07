/**
 * 快速写作闭环人工 smoke（一次性脚本，不纳入产品构建）
 * 对应任务卡：Cursor 执行卡：novel-writer 快速写作闭环（2026-07-07）任务 4
 *
 * 已知阻塞（2026-07-07 会诊前）：步骤 4 起会失败 —— POST /projects 落库的新作品
 * 原始状态为 Prisma 默认 'draft'，GET 读路径统一经 withMappedProjectStatus 映射为
 * 'planning'，getWorkPermissions('planning').body === false，写作页 loadData 据此
 * 重定向回 /work/:id，而非停留在写作页。这是设计假设失效，非本脚本或 UI 代码 bug，
 * 详见执行卡回报。步骤 1-3（入口可见、最小表单、仅建 1 作品 1 章）仍可通过。
 *
 * 用法：cd frontend && npm install --no-save playwright && npx playwright install chromium
 *       node scripts/quick-writing-loop-smoke.mjs
 *
 * 前置：backend (localhost:5000) 与 frontend (localhost:3000) dev server 均已启动
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const AUTOSAVE_DELAY = 1000
const OBSERVE_MS = AUTOSAVE_DELAY + 1200

function readPassword() {
  try {
    const env = readFileSync(join(ROOT, 'backend', '.env'), 'utf8')
    const m = env.match(/^APP_PASSWORD=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  } catch {
    /* ponytail: default only for local smoke, matches backend/src/routes/auth.ts fallback */
  }
  return 'novel2024'
}

async function loginToken() {
  const res = await fetch(`${BASE_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: readPassword() }),
  })
  const json = await res.json()
  if (!json?.data?.sessionId) throw new Error('login failed: ' + JSON.stringify(json))
  return json.data.sessionId
}

async function apiGet(token, path) {
  const res = await fetch(`${BASE_URL}/api/v2${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

async function apiDelete(token, path) {
  const res = await fetch(`${BASE_URL}/api/v2${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.status
}

function assert(cond, label, evidence) {
  evidence.checks.push({ label, pass: !!cond })
  if (!cond) evidence.failures.push(label)
}

async function run() {
  const evidence = {
    at: new Date().toISOString(),
    baseUrl: BASE_URL,
    checks: [],
    failures: [],
    consoleErrors: [],
    createdProjectId: null,
    createdChapterId: null,
    passed: false,
  }

  const token = await loginToken()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(t => {
    localStorage.setItem('novel_auth_token', t)
    localStorage.setItem(
      'novel-settings',
      JSON.stringify({
        state: {
          ai: { partner: true, writer: true, reviewer: false, auditor: true },
          editor: {
            theme: 'novel-light',
            fontSize: 16,
            autoSave: true,
            autoSaveDelay: 1000,
            referenceSidebar: false,
          },
        },
        version: 0,
      }),
    )
  }, token)

  const page = await context.newPage()
  page.on('console', msg => {
    if (msg.type() === 'error') evidence.consoleErrors.push(msg.text())
  })

  try {
    // --- 1. HomePage 快速入口可见 ---
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const quickBtn = page.getByRole('button', { name: /快速开始写作/ })
    await quickBtn.waitFor({ state: 'visible', timeout: 15000 })
    assert(true, '1. HomePage 顶部可见「快速开始写作」入口', evidence)

    // --- 2. 只填作品名称创建 ---
    await quickBtn.click()
    const titleInput = page.locator('input[placeholder="输入作品名称"]')
    await titleInput.waitFor({ state: 'visible', timeout: 5000 })
    const title = `冒烟测试作品-${Date.now()}`
    await titleInput.fill(title)
    assert(true, '2. 快速创建表单仅展示作品名称输入框', evidence)

    await page.getByRole('button', { name: '开始写作 →' }).click()

    // --- 3. 直接进入写作路由；只产生 1 个作品 + 1 章 ---
    await page.waitForURL(/\/writing\/[^/]+\/[^/]+/, { timeout: 15000 })
    const url = new URL(page.url())
    const parts = url.pathname.split('/').filter(Boolean) // ['writing', pid, cid]
    const projectId = parts[1]
    const chapterId = parts[2]
    evidence.createdProjectId = projectId
    evidence.createdChapterId = chapterId
    assert(!!projectId && !!chapterId, '3. 创建成功后 URL 落在 /writing/:projectId/:chapterId', evidence)

    const chaptersOfProject = await apiGet(token, `/chapters/project/${projectId}`)
    assert(
      Array.isArray(chaptersOfProject.data) && chaptersOfProject.data.length === 1,
      '3b. 该作品下只有 1 章（未重复创建）',
      evidence,
    )

    // --- 4. 默认纯净态：章节导航面板不可见 ---
    try {
      await page.waitForSelector('.monaco-editor', { timeout: 20000 })
    } catch (e) {
      await page.screenshot({ path: join(ROOT, 'reports', 'smoke-debug.png'), fullPage: true })
      writeFileSync(join(ROOT, 'reports', 'smoke-debug.html'), await page.content())
      evidence.debugUrl = page.url()
      throw e
    }
    await page.waitForTimeout(500)
    const navVisibleInitially = await page.getByText('编辑作品章节').isVisible().catch(() => false)
    assert(!navVisibleInitially, '4. 写作页默认收起章节导航（无「编辑作品章节」可见）', evidence)
    const chapterPosVisible = await page.getByText(/第 1 章/).first().isVisible().catch(() => false)
    assert(chapterPosVisible, '4b. 顶栏始终显示「第 1 章」位置提示', evidence)

    // --- 5. 输入正文，等待自动保存 ---
    const marker = `冒烟正文-${Date.now()}`
    await page.locator('.monaco-editor').click()
    await page.keyboard.type(marker)
    await page.waitForTimeout(OBSERVE_MS)
    const savedVisible = await page.getByText(/已保存/).first().isVisible().catch(() => false)
    assert(savedVisible, '5. 自动保存后顶栏出现「已保存」', evidence)

    const chapterAfterSave = await apiGet(token, `/chapters/${chapterId}`)
    assert(
      typeof chapterAfterSave.data?.content === 'string' && chapterAfterSave.data.content.includes(marker),
      '5b. 后端内容确实写入了刚输入的正文',
      evidence,
    )

    // --- 6. 刷新恢复 ---
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.monaco-editor', { timeout: 20000 })
    await page.waitForTimeout(500)
    const editorText = await page.locator('.monaco-editor').innerText().catch(() => '')
    assert(editorText.includes(marker), '6. 刷新后正文恢复（编辑器内容含标记）', evidence)

    // --- 7. 展开/收起章节目录 ---
    const catalogBtn = page.getByRole('button', { name: '目录' })
    await catalogBtn.click()
    await page.waitForTimeout(300)
    const navVisibleExpanded = await page.getByText('编辑作品章节').isVisible().catch(() => false)
    assert(navVisibleExpanded, '7. 点击「目录」后章节导航展开', evidence)
    await catalogBtn.click()
    await page.waitForTimeout(300)
    const navVisibleCollapsed = await page.getByText('编辑作品章节').isVisible().catch(() => false)
    assert(!navVisibleCollapsed, '7b. 再次点击「目录」后收起', evidence)

    // --- 8. 模拟保存失败：常驻提示 + 正文仍在 + 编辑器未被整页错误替换 ---
    await page.route(`**/api/v2/chapters/${chapterId}`, route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 500, body: JSON.stringify({ success: false, error: { code: 500, message: 'simulated failure' } }) })
      } else {
        route.continue()
      }
    })
    const failMarker = `失败态标记-${Date.now()}`
    await page.locator('.monaco-editor').click()
    await page.keyboard.press('Control+End')
    await page.keyboard.type(failMarker)
    await page.waitForTimeout(OBSERVE_MS)
    const failVisible = await page.getByText(/保存失败/).first().isVisible().catch(() => false)
    assert(failVisible, '8. 保存失败后顶栏出现常驻「保存失败」提示', evidence)
    const editorStillThere = await page.locator('.monaco-editor').isVisible().catch(() => false)
    assert(editorStillThere, '8b. 保存失败未被整页错误屏替换，编辑器仍在', evidence)
    const editorTextAfterFail = await page.locator('.monaco-editor').innerText().catch(() => '')
    assert(editorTextAfterFail.includes(failMarker), '8c. 保存失败后正文仍保留在编辑器中', evidence)

    // --- 9. 手动重试恢复「已保存」 ---
    await page.unroute(`**/api/v2/chapters/${chapterId}`)
    await page.getByText(/保存失败/).first().click()
    await page.waitForTimeout(1500)
    const recoveredVisible = await page.getByText(/已保存/).first().isVisible().catch(() => false)
    assert(recoveredVisible, '9. 点击重试后顶栏恢复「已保存」', evidence)
    const failGone = await page.getByText(/保存失败/).first().isVisible().catch(() => false)
    assert(!failGone, '9b. 「保存失败」提示消失', evidence)

    const chapterAfterRetry = await apiGet(token, `/chapters/${chapterId}`)
    assert(
      chapterAfterRetry.data?.content?.includes(failMarker),
      '9c. 重试保存后后端内容包含失败态时输入的正文（无丢稿）',
      evidence,
    )
  } finally {
    await browser.close()
    if (evidence.createdProjectId) {
      const status = await apiDelete(token, `/projects/${evidence.createdProjectId}`)
      evidence.cleanup = { projectId: evidence.createdProjectId, deleteStatus: status }
    }
  }

  evidence.passed = evidence.failures.length === 0
  mkdirSync(join(ROOT, 'reports'), { recursive: true })
  const outPath = join(ROOT, 'reports', `quick-writing-loop-smoke-${Date.now()}.json`)
  writeFileSync(outPath, JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence, null, 2))
  console.log(`\n证据文件：${outPath}`)
  if (!evidence.passed) {
    console.error('\n未通过项：', evidence.failures)
    process.exit(1)
  }
  console.log('\n全部检查通过。')
}

run().catch(err => {
  console.error('SMOKE SCRIPT ERROR:', err)
  process.exit(1)
})
