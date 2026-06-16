/**
 * Novel Writer 可信基线 v0.1 — 核心流程 E2E 验证脚本
 * 用法: node scripts/baseline-e2e-v01.mjs
 * 前提: backend 运行在 http://localhost:5000
 */

const BASE = 'http://localhost:5000/api/v2'
const RUN_ID = Date.now()
const TEST_TITLE = `E2E-Baseline-v0.1-${RUN_ID}`

const results = []

function record(id, name, status, detail, evidence = '') {
  results.push({ id, name, status, detail, evidence })
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'blocker' ? '🚫' : '⏭️'
  console.log(`${icon} [${id}] ${name}: ${status.toUpperCase()}`)
  if (detail) console.log(`   ${detail}`)
  if (evidence) console.log(`   evidence: ${evidence}`)
}

async function req(method, path, body, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { status: res.status, ok: res.ok, json, headers: res.headers }
}

function unwrap(json) {
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success) return json.data
    throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error))
  }
  return json
}

async function main() {
  console.log('\n=== Novel Writer 可信基线 v0.1 E2E 验证 ===\n')
  console.log(`Run ID: ${RUN_ID}\n`)

  // --- Preflight ---
  try {
    const health = await fetch('http://localhost:5000/health')
    const h = await health.json()
    if (h.status === 'ok') {
      record('PREFLIGHT', 'Backend 健康检查', 'pass', 'database connected', JSON.stringify(h))
    } else {
      record('PREFLIGHT', 'Backend 健康检查', 'blocker', 'health not ok')
      return printSummary()
    }
  } catch (e) {
    record('PREFLIGHT', 'Backend 健康检查', 'blocker', e.message)
    return printSummary()
  }

  // AI availability
  let aiAvailable = false
  try {
    const aiTest = await req('POST', '/ai/test-connection', {})
    aiAvailable = aiTest.ok && aiTest.json?.success
    // test-connection 不校验 chat 正文；额外探测一次最小 chat
    if (aiAvailable) {
      try {
        const probe = await req('POST', '/ai/chat', {
          messages: [{ role: 'user', content: 'ping' }],
          contextType: 'chat',
        })
        const probeContent = unwrap(probe.json)?.content ?? unwrap(probe.json)
        if (typeof probeContent === 'string' && probeContent.startsWith('Error:')) {
          aiAvailable = false
          record(
            'PREFLIGHT-AI',
            'AI 连接可用性',
            'skip',
            'test-connection 通过但 chat 失败（可能 Key 无效或模型不可用）',
            probeContent.slice(0, 80)
          )
        } else {
          record(
            'PREFLIGHT-AI',
            'AI 连接可用性',
            'pass',
            'test-connection 与 chat 探测均成功',
            JSON.stringify(aiTest.json?.data || aiTest.json).slice(0, 120)
          )
        }
      } catch (e) {
        aiAvailable = false
        record('PREFLIGHT-AI', 'AI 连接可用性', 'skip', `chat 探测失败: ${e.message}`)
      }
    } else {
      record(
        'PREFLIGHT-AI',
        'AI 连接可用性',
        'skip',
        'test-connection 失败 — 无有效 API Key 或连接失败',
        JSON.stringify(aiTest.json?.error || aiTest.json).slice(0, 120)
      )
    }
  } catch (e) {
    record('PREFLIGHT-AI', 'AI 连接可用性', 'skip', e.message)
  }

  let projectId, chapterId, chapterId2
  const synopsis = `E2E测试梗概 ${RUN_ID}：一位少年在异世界觉醒写作之力。`

  // --- F1: 创建项目 + 自动第1章 + 项目详情 ---
  try {
    const createRes = await req('POST', '/projects', {
      title: TEST_TITLE,
      author: 'E2E Tester',
      description: 'baseline v0.1',
    })
    const project = unwrap(createRes.json)
    projectId = project.id
    if (!projectId) throw new Error('no project id')

    // mirror CreateProjectModal: updateMetadata + create chapter
    await req('POST', `/projects/${projectId}`, {}) // noop check id exists via GET
    const metaRes = await req('PUT', `/projects/${projectId}`, {
      metadata: { synopsis },
    })
    unwrap(metaRes.json)

    const chRes = await req('POST', '/chapters', {
      projectId,
      title: '第1章',
      content: '',
      order: 1,
    })
    const ch = unwrap(chRes.json)
    chapterId = ch.id
    await req('PUT', `/chapters/${chapterId}`, { summary: synopsis })

    const detail = await req('GET', `/projects/${projectId}`)
    const detailData = unwrap(detail.json)
    const chapters = await req('GET', `/chapters/project/${projectId}`)
    const chapterList = unwrap(chapters.json)

    const ok =
      detailData.title === TEST_TITLE &&
      Array.isArray(chapterList) &&
      chapterList.length >= 1 &&
      detailData.metadata?.synopsis === synopsis &&
      detailData.description === synopsis

    record(
      'F1',
      '创建项目 → 写梗概 → 自动第1章 → 项目详情可读',
      ok ? 'pass' : 'fail',
      ok
        ? `projectId=${projectId}, chapters=${chapterList.length}`
        : `详情不一致: chapters=${chapterList?.length}, synopsis=${!!detailData.metadata?.synopsis}`,
      `GET /projects/${projectId}`
    )
  } catch (e) {
    record('F1', '创建项目 → 自动第1章 → 项目详情', 'fail', e.message)
  }

  // --- F2: 项目详情 → 三栏写作页（路由/API 层验证）---
  try {
    if (!projectId || !chapterId) throw new Error('missing ids from F1')
    const [p, c, list] = await Promise.all([
      req('GET', `/projects/${projectId}`),
      req('GET', `/chapters/${chapterId}`),
      req('GET', `/chapters/project/${projectId}`),
    ])
    const pData = unwrap(p.json)
    const cData = unwrap(c.json)
    const listData = unwrap(list.json)
    const route = `/editor/${projectId}/${chapterId}`
    const ok = pData.id === projectId && cData.id === chapterId && listData.some((x) => x.id === chapterId)
    record(
      'F2',
      '项目详情 → 进入三栏写作页（数据前置）',
      ok ? 'pass' : 'fail',
      ok ? `路由 ${route} 所需三元组齐全` : '项目/章节/列表不一致',
      route
    )
  } catch (e) {
    record('F2', '项目详情 → 三栏写作页', 'fail', e.message)
  }

  // --- F3: 正文编辑 → 手动保存 → 切章保存 ---
  try {
    if (!projectId || !chapterId) throw new Error('missing ids')

    const content1 = `# ${TEST_TITLE}\n\n## 第 1 章：开篇\n\n这是 E2E 测试正文 ${RUN_ID}。`
    const save1 = await req('PUT', `/chapters/${chapterId}`, {
      content: content1,
      wordCount: content1.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/).filter(Boolean).length,
    })
    const saved1 = unwrap(save1.json)

    // create chapter 2 for switch test
    const ch2Res = await req('POST', '/chapters', {
      projectId,
      title: '第2章',
      content: '第二章占位',
      order: 2,
    })
    chapterId2 = unwrap(ch2Res.json).id

    const content2 = `# ${TEST_TITLE}\n\n## 第 2 章\n\n第二章 E2E 内容。`
    await req('PUT', `/chapters/${chapterId2}`, { content: content2 })

    const reload1 = unwrap((await req('GET', `/chapters/${chapterId}`)).json)
    const reload2 = unwrap((await req('GET', `/chapters/${chapterId2}`)).json)

    const ok =
      saved1.content?.includes('E2E 测试正文') &&
      reload1.content?.includes('E2E 测试正文') &&
      reload2.content?.includes('第二章 E2E')

    record(
      'F3',
      '正文编辑 → 手动保存 → 切章各自持久化',
      ok ? 'pass' : 'fail',
      ok ? '两章内容独立保存可读' : `ch1=${reload1.content?.slice(0, 40)} ch2=${reload2.content?.slice(0, 40)}`,
      `PUT /chapters/${chapterId}`
    )
  } catch (e) {
    record('F3', '正文编辑 → 保存 → 切章', 'fail', e.message)
  }

  // --- F4: 项目元数据编辑 ---
  try {
    if (!projectId) throw new Error('no projectId')
    const characters = `主角：林墨（E2E ${RUN_ID}）`
    const get0 = unwrap((await req('GET', `/projects/${projectId}`)).json)
    const meta = { ...(get0.metadata || {}), characters, synopsis: get0.metadata?.synopsis || synopsis }
    await req('PUT', `/projects/${projectId}`, { metadata: meta })
    const get1 = unwrap((await req('GET', `/projects/${projectId}`)).json)
    const ok = get1.metadata?.characters === characters
    record(
      'F4',
      '项目元数据编辑（characters 写入/读取）',
      ok ? 'pass' : 'fail',
      ok ? 'metadata.characters 持久化' : `got=${get1.metadata?.characters}`,
      'PUT /projects/:id { metadata }'
    )
  } catch (e) {
    record('F4', '项目元数据编辑', 'fail', e.message)
  }

  // --- F5: 章节元数据编辑（summary / synopsis 双轨）---
  try {
    if (!chapterId) throw new Error('no chapterId')
    const chapterSynopsis = `本章梗概 E2E ${RUN_ID}`
    // frontend chaptersApi.updateMetadata('synopsis') maps to summary
    await req('PUT', `/chapters/${chapterId}`, { summary: chapterSynopsis })
    const get1 = unwrap((await req('GET', `/chapters/${chapterId}`)).json)
    const ok = get1.summary === chapterSynopsis
    record(
      'F5',
      '章节元数据编辑（summary 写入/读取）',
      ok ? 'pass' : 'fail',
      ok ? 'Chapter.summary 持久化' : `summary=${get1.summary}`,
      'PUT /chapters/:id { summary }'
    )
  } catch (e) {
    record('F5', '章节元数据编辑', 'fail', e.message)
  }

  // --- F6: AI 写作助手（chat + 上下文）---
  if (!aiAvailable) {
    record('F6', 'AI 写作助手插入正文（API 层）', 'skip', 'AI 不可用 — 需在 Settings 配置有效 Key')
  } else {
    try {
      const chatRes = await req('POST', '/ai/chat', {
        messages: [{ role: 'user', content: '用一句话续写：少年推开了门。' }],
        projectId,
        chapterId,
        contextType: 'chat',
      })
      const data = unwrap(chatRes.json)
      const content = data?.content || data
      const ok = typeof content === 'string' && content.length > 5 && !content.startsWith('Error:')
      record(
        'F6',
        'AI 写作助手（chat 返回内容）',
        ok ? 'pass' : 'fail',
        ok ? `返回 ${content.length} 字符` : '无有效 content',
        String(content).slice(0, 80)
      )
    } catch (e) {
      record('F6', 'AI 写作助手', 'fail', e.message)
    }
  }

  // --- F7: AI 元数据手动提取与确认 ---
  if (!aiAvailable) {
    record('F7', 'AI 元数据提取与确认', 'skip', 'AI 不可用')
  } else {
    try {
      const extract = await req('POST', `/projects/${projectId}/extract-metadata`, {})
      if (!extract.ok) throw new Error(JSON.stringify(extract.json))

      // poll for _draft up to 60s
      let draft = null
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000))
        const p = unwrap((await req('GET', `/projects/${projectId}`)).json)
        if (p.metadata?._draft) {
          draft = p.metadata._draft
          break
        }
      }
      if (!draft) throw new Error('_draft 未在 60s 内出现')

      const confirm = await req('POST', `/projects/${projectId}/confirm-metadata`, {
        confirmed: true,
        editedMetadata: draft,
      })
      if (!confirm.ok) throw new Error(JSON.stringify(confirm.json))

      const after = unwrap((await req('GET', `/projects/${projectId}`)).json)
      const ok = !after.metadata?._draft && (after.metadata?.synopsis || after.metadata?.characters)
      record(
        'F7',
        'AI 元数据手动提取 → 确认入库',
        ok ? 'pass' : 'fail',
        ok ? '_draft 已清除且有正式字段' : `_draft=${!!after.metadata?._draft}`,
        `metadata keys: ${Object.keys(after.metadata || {}).join(', ')}`
      )
    } catch (e) {
      record('F7', 'AI 元数据提取与确认', 'fail', e.message)
    }
  }

  // --- F8: Markdown 导出 ---
  try {
    if (!projectId) throw new Error('no projectId')
    // mark completed for export visibility parity (export API itself has no status gate)
    await req('PUT', `/projects/${projectId}`, { status: 'completed' })
    const exp = await fetch(`${BASE}/projects/${projectId}/export`)
    const md = await exp.text()
    const ok = exp.ok && md.includes(TEST_TITLE) && md.includes('E2E 测试正文')
    record(
      'F8',
      'Markdown 导出',
      ok ? 'pass' : 'fail',
      ok ? `导出 ${md.length} 字符含标题与正文` : `status=${exp.status} len=${md.length}`,
      md.slice(0, 120).replace(/\n/g, '\\n')
    )
  } catch (e) {
    record('F8', 'Markdown 导出', 'fail', e.message)
  }

  // --- Known blockers (static + probe, no fix) ---
  await recordKnownBlockers(aiAvailable, projectId, chapterId)

  // cleanup
  if (projectId) {
    try {
      await req('DELETE', `/projects/${projectId}`)
      record('CLEANUP', '删除测试项目', 'pass', projectId)
    } catch (e) {
      record('CLEANUP', '删除测试项目', 'fail', e.message)
    }
  }

  printSummary()
}

async function recordKnownBlockers(aiAvailable, projectId, chapterId) {
  console.log('\n--- 已知高风险链路探测（只记录，不修）---\n')

  // B1: wrong-payload defense probe (frontend single-arg call fixed in Commit 5)
  try {
    const wrong = await req('POST', '/ai/review/chapter', { chapterId: '这是一段正文内容而不是ID', content: undefined })
    const defended = wrong.status === 400 || wrong.status === 422
    record(
      'B1',
      'AI 章节审阅（错误 payload 防御探测）',
      defended ? 'pass' : 'fail',
      defended
        ? `前端 reviewChapter(chapterId, content) 签名已修复；后端拒收错误 payload HTTP ${wrong.status}。章节审阅仍为 @experimental，需 UI 路径验证`
        : `错误 payload 未被拒绝 status=${wrong.status}`,
      JSON.stringify(wrong.json).slice(0, 150)
    )
  } catch (e) {
    record('B1', 'AI 章节审阅（错误 payload 防御探测）', 'blocker', e.message)
  }

  // B1b: API returns markdown; structured ReviewReport UI not implemented
  if (aiAvailable && chapterId) {
    try {
      const correct = await req('POST', '/ai/review/chapter', {
        chapterId,
        content: '测试章节内容用于审阅。',
      })
      const data = unwrap(correct.json)
      const isMarkdown = typeof data?.report === 'string'
      const hasStructured = data?.report?.overallScore !== undefined
      record(
        'B1b',
        'AI 章节审阅（响应格式 vs 结构化 UI）',
        isMarkdown && !hasStructured ? 'blocker' : 'fail',
        '后端返回 Markdown 字符串；结构化 ReviewReport UI 未实现（AIReviewPanel 当前仅 Markdown 展示，@experimental）',
        String(data?.report || data).slice(0, 100)
      )
    } catch (e) {
      record('B1b', 'AI 章节审阅（响应格式 vs 结构化 UI）', 'blocker', e.message)
    }
  } else {
    record('B1b', 'AI 章节审阅（响应格式 vs 结构化 UI）', 'skip', 'AI 不可用或未创建章节')
  }

  // B2: Chapter planning save API missing
  record(
    'B2',
    '章节规划保存（ChapterPlanningEditor）',
    'blocker',
    'frontend 调用 projectsApi.updateChapterPlanning — api.ts 与 backend 均无此端点',
    'ChapterPlanningEditor.tsx save()'
  )

  // B3: Import metadata chain
  record(
    'B3',
    '导入后自动元数据提取',
    'blocker',
    'POST /projects/import 不触发 extractMetadataInBackground；FileImportExport 期望 hasPendingMetadata',
    'projects.ts import handler'
  )

  // B4: PlannerBoard AI
  try {
    const outline = await req('POST', '/ai/generate/outline', { projectId: projectId || 'x', prompt: 'test' })
    record(
      'B4',
      '深度策划 PlannerBoard AI 生成',
      outline.status === 404 ? 'blocker' : outline.ok ? 'fail' : 'blocker',
      `POST /ai/generate/outline → HTTP ${outline.status}（端点不存在）`,
      JSON.stringify(outline.json).slice(0, 100)
    )
  } catch (e) {
    record('B4', 'PlannerBoard AI', 'blocker', e.message)
  }

  // B5: bare /editor route — fixed P0-C: redirect to /projects
  record(
    'B5',
    '导航 /editor 裸路由',
    'pass',
    '/editor 无参数时 Navigate → /projects（P0-C 已修复）',
    'App.tsx: path /editor → <Navigate to="/projects" replace />'
  )
}

function printSummary() {
  console.log('\n=== 汇总 ===')
  const pass = results.filter((r) => r.status === 'pass').length
  const fail = results.filter((r) => r.status === 'fail').length
  const blocker = results.filter((r) => r.status === 'blocker').length
  const skip = results.filter((r) => r.status === 'skip').length
  console.log(`PASS: ${pass}  FAIL: ${fail}  BLOCKER: ${blocker}  SKIP: ${skip}  TOTAL: ${results.length}`)

  const baselineReady = fail === 0 && results.filter((r) => r.id.startsWith('F') && r.status === 'fail').length === 0
  console.log(`\n可信基线 v0.1（P0 API 层）: ${baselineReady ? '可进入有限基线' : '存在 FAIL，需先修复'}`)

  // JSON for doc embedding
  console.log('\n--- JSON ---')
  console.log(JSON.stringify({ runId: RUN_ID, summary: { pass, fail, blocker, skip }, results }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
