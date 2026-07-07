/**
 * 「继续写作」入口人工 smoke（一次性脚本，不纳入产品构建）
 * 对应任务卡：Cursor 修复卡：novel-writer「继续写作」入口（2026-07-07）任务 1
 *
 * 业务语义（会诊裁决后）：HomePage「继续写作」只恢复最近的创作中（status=writing）
 * 作品与其最近更新的章节；不创建任何 Project / Chapter；无创作中作品时进入创作室
 * 列表并提示「暂无创作中作品」。
 *
 * 本脚本原为「快速新建作品并直达写作页」的旧假设验证脚本，已被 2026-07-07 会诊证伪
 * （新建作品落库为 Prisma 默认 'draft'，GET 统一映射为 'planning'，写作页据此重定向），
 * 现改写为验证会诊裁决后的新语义，不再验证旧假设。
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

function assert(cond, label, evidence) {
  evidence.checks.push({ label, pass: !!cond })
  if (!cond) evidence.failures.push(label)
}

async function newContext(browser, token) {
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
  return context
}

async function run() {
  const evidence = {
    at: new Date().toISOString(),
    baseUrl: BASE_URL,
    checks: [],
    failures: [],
    passed: false,
  }

  const token = await loginToken()
  const browser = await chromium.launch({ headless: true })

  try {
    // --- 0. 落盘前证据：当前 writing 作品与其最近章节（现有稳定排序：Project/Chapter.updatedAt） ---
    const writingRes = await apiGet(token, '/projects?status=writing')
    const writingProjects = (writingRes.data || [])
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    evidence.writingProjectsBefore = writingProjects.map(p => ({ id: p.id, updatedAt: p.updatedAt }))

    const projectsBeforeRes = await apiGet(token, '/projects')
    const projectCountBefore = (projectsBeforeRes.data || []).length
    evidence.projectCountBefore = projectCountBefore

    let expectedProject = null
    let expectedChapter = null
    let chapterCountBefore = null
    if (writingProjects.length > 0) {
      expectedProject = writingProjects[0]
      const chaptersRes = await apiGet(token, `/chapters/project/${expectedProject.id}`)
      const chapters = (chaptersRes.data || [])
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      chapterCountBefore = chapters.length
      expectedChapter = chapters[0] || null
    }
    evidence.expectedProjectId = expectedProject?.id ?? null
    evidence.expectedChapterId = expectedChapter?.id ?? null
    evidence.chapterCountBefore = chapterCountBefore

    // ============ 场景 A：存在 writing 作品 → 恢复最近作品的最近章节 ============
    {
      const context = await newContext(browser, token)
      const page = await context.newPage()
      try {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        const continueBtn = page.getByRole('button', { name: '继续写作' })
        await continueBtn.waitFor({ state: 'visible', timeout: 15000 })
        assert(true, 'A1. HomePage 显示「继续写作」入口', evidence)

        assert(
          !(await page.getByRole('button', { name: /快速开始写作/ }).isVisible().catch(() => false)),
          'A1b. 旧「快速开始写作」文案已不再出现',
          evidence,
        )

        if (expectedProject && expectedChapter) {
          await continueBtn.click()
          await page.waitForURL(/\/writing\/[^/]+\/[^/]+/, { timeout: 15000 })
          const url = new URL(page.url())
          const parts = url.pathname.split('/').filter(Boolean)
          assert(parts[1] === expectedProject.id, 'A2. 进入的是最近更新的 writing 作品', evidence)
          assert(parts[2] === expectedChapter.id, 'A3. 进入的是该作品最近更新的章节', evidence)

          const quickFormVisible = await page
            .locator('input[placeholder="输入作品名称"]')
            .isVisible()
            .catch(() => false)
          assert(!quickFormVisible, 'A4. 未打开任何「快速创建作品」表单（原错误行为已不发生）', evidence)
        } else {
          assert(false, 'A2/A3. 环境中不存在 writing 作品，场景 A 无法验证（见 writingProjectsBefore）', evidence)
        }
      } finally {
        await context.close()
      }
    }

    // --- 场景 A 后：确认点击未创建任何 Project / Chapter ---
    const projectsAfterRes = await apiGet(token, '/projects')
    const projectCountAfter = (projectsAfterRes.data || []).length
    evidence.projectCountAfter = projectCountAfter
    assert(projectCountAfter === projectCountBefore, 'A5. 点击「继续写作」前后 Project 总数不变', evidence)

    if (expectedProject) {
      const chaptersAfterRes = await apiGet(token, `/chapters/project/${expectedProject.id}`)
      const chapterCountAfter = (chaptersAfterRes.data || []).length
      evidence.chapterCountAfter = chapterCountAfter
      assert(chapterCountAfter === chapterCountBefore, 'A6. 点击「继续写作」前后该作品 Chapter 总数不变', evidence)
    }

    // ============ 场景 B：不存在 writing 作品 → 进入创作室列表 + 提示 ============
    {
      const context = await newContext(browser, token)
      const page = await context.newPage()
      try {
        await page.route('**/api/v2/projects?status=writing', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] }),
          })
        })
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        const continueBtn = page.getByRole('button', { name: '继续写作' })
        await continueBtn.waitFor({ state: 'visible', timeout: 15000 })
        await continueBtn.click()

        await page.waitForURL(/\/writing\/projects/, { timeout: 15000 })
        assert(true, 'B1. 无 writing 作品时进入创作室列表（/writing/projects）', evidence)

        const emptyHint = await page.getByText('暂无创作中作品').first().isVisible().catch(() => false)
        assert(emptyHint, 'B2. 页面显示「暂无创作中作品」提示', evidence)
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }

  evidence.passed = evidence.failures.length === 0
  mkdirSync(join(ROOT, 'reports'), { recursive: true })
  const outPath = join(ROOT, 'reports', `continue-writing-smoke-${Date.now()}.json`)
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
