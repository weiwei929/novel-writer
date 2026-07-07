/**
 * 任务 2/3 独立验证（目录抽屉 + 保存四态），绕开 Task 1 的设计假设失效点
 * 直接对既有 writing 状态作品/章节操作，测试结束恢复原文，不留痕迹。
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const BASE_URL = 'http://127.0.0.1:3000'
const PROJECT_ID = '39a0972a-606d-446c-b031-76ac789c466b'
const CHAPTER_ID = 'df30f427-a74d-45da-9d75-135c3d625dac'
const AUTOSAVE_DELAY = 1000
const OBSERVE_MS = AUTOSAVE_DELAY + 1200

function readPassword() {
  try {
    const env = readFileSync(join(ROOT, 'backend', '.env'), 'utf8')
    const m = env.match(/^APP_PASSWORD=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  } catch {}
  return 'novel2024'
}

async function loginToken() {
  const res = await fetch(`${BASE_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: readPassword() }),
  })
  const json = await res.json()
  return json.data.sessionId
}

async function getChapter(token) {
  const res = await fetch(`${BASE_URL}/api/v2/chapters/${CHAPTER_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return (await res.json()).data
}

async function putChapter(token, content) {
  await fetch(`${BASE_URL}/api/v2/chapters/${CHAPTER_ID}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

function assert(cond, label, evidence) {
  evidence.checks.push({ label, pass: !!cond })
  if (!cond) evidence.failures.push(label)
}

async function run() {
  const evidence = { at: new Date().toISOString(), checks: [], failures: [], passed: false }
  const token = await loginToken()
  const original = await getChapter(token)
  const originalContent = original.content

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(t => {
    localStorage.setItem('novel_auth_token', t)
    localStorage.setItem(
      'novel-settings',
      JSON.stringify({
        state: {
          ai: { partner: true, writer: true, reviewer: false, auditor: true },
          editor: { theme: 'novel-light', fontSize: 16, autoSave: true, autoSaveDelay: 1000, referenceSidebar: false },
        },
        version: 0,
      }),
    )
  }, token)
  const page = await context.newPage()

  try {
    await page.goto(`${BASE_URL}/writing/${PROJECT_ID}/${CHAPTER_ID}?from=writing`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.waitForSelector('.monaco-editor', { timeout: 20000 })
    await page.waitForTimeout(500)

    // 任务 2：默认纯净态
    const navVisibleInitially = await page.getByText('编辑作品章节').isVisible().catch(() => false)
    assert(!navVisibleInitially, '写作页默认收起章节导航', evidence)
    const posVisible = await page.getByText(/第 1 章/).first().isVisible().catch(() => false)
    assert(posVisible, '顶栏显示当前章节位置', evidence)

    // 展开/收起
    const catalogBtn = page.getByRole('button', { name: '目录' })
    await catalogBtn.click()
    await page.waitForTimeout(300)
    assert(
      await page.getByText('编辑作品章节').isVisible().catch(() => false),
      '点击「目录」后章节导航展开',
      evidence,
    )
    assert(
      await page.getByText(/第 2 章/).first().isVisible().catch(() => false),
      '展开态可见其他章节（第 2 章）',
      evidence,
    )
    await catalogBtn.click()
    await page.waitForTimeout(300)
    assert(
      !(await page.getByText('编辑作品章节').isVisible().catch(() => false)),
      '再次点击「目录」后收起',
      evidence,
    )

    // 任务 3：保存四态
    const marker = `T23-ok-${Date.now()}`
    await page.locator('.monaco-editor').click()
    await page.keyboard.press('Control+End')
    await page.keyboard.type(marker)
    await page.waitForTimeout(200)
    const dirtyVisible = await page.getByText('编辑中…').isVisible().catch(() => false)
    assert(dirtyVisible, '输入后立即显示「编辑中…」', evidence)
    await page.waitForTimeout(OBSERVE_MS)
    assert(
      await page.getByText(/已保存/).first().isVisible().catch(() => false),
      '自动保存后显示「已保存」',
      evidence,
    )
    const afterOk = await getChapter(token)
    assert(afterOk.content.includes(marker), '后端内容确实写入', evidence)

    // 模拟失败
    await page.route(`**/api/v2/chapters/${CHAPTER_ID}`, route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 500, body: JSON.stringify({ success: false, error: { code: 500, message: 'simulated' } }) })
      } else route.continue()
    })
    const failMarker = `T23-fail-${Date.now()}`
    await page.locator('.monaco-editor').click()
    await page.keyboard.press('Control+End')
    await page.keyboard.type(failMarker)
    await page.waitForTimeout(OBSERVE_MS)
    assert(
      await page.getByText(/保存失败/).first().isVisible().catch(() => false),
      '保存失败后常驻提示出现',
      evidence,
    )
    assert(
      await page.locator('.monaco-editor').isVisible().catch(() => false),
      '保存失败未替换整页（编辑器仍在）',
      evidence,
    )
    const editorText = await page.locator('.monaco-editor').innerText().catch(() => '')
    assert(editorText.includes(failMarker), '保存失败后正文仍在编辑器中', evidence)

    // 重试恢复
    await page.unroute(`**/api/v2/chapters/${CHAPTER_ID}`)
    await page.getByText(/保存失败/).first().click()
    await page.waitForTimeout(1500)
    assert(
      await page.getByText(/已保存/).first().isVisible().catch(() => false),
      '点击重试后恢复「已保存」',
      evidence,
    )
    const afterRetry = await getChapter(token)
    assert(afterRetry.content.includes(failMarker), '重试保存后后端内容包含失败态时输入的正文', evidence)
  } finally {
    await browser.close()
    await putChapter(token, originalContent) // 恢复原文，不留痕迹
    const restored = await getChapter(token)
    evidence.restoredOk = restored.content === originalContent
  }

  evidence.passed = evidence.failures.length === 0
  mkdirSync(join(ROOT, 'reports'), { recursive: true })
  const outPath = join(ROOT, 'reports', `task23-smoke-${Date.now()}.json`)
  writeFileSync(outPath, JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence, null, 2))
  console.log('证据文件：', outPath)
  if (!evidence.passed) process.exit(1)
}

run().catch(e => {
  console.error('ERROR', e)
  process.exit(1)
})
