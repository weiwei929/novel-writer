# TASK-616-C-A2：confirm-greenlight 接入章节 readiness

**状态**：待执行
**基线**：`feature/workdetail-p1`（616-C-A 已合并 PR #9）
**目标分支**：`feature/616-c-a2-confirm-chapter-readiness`
**前置**：[TASK-616-C-A.md](./TASK-616-C-A.md) · [TASK-616-B-closure.md](./TASK-616-B-closure.md)

---

## 背景

616-B 已在 `confirm-greenlight` 硬拦 **workSetting 三必**（前后端双保险）。
616-C-A 已落地 `metadata.chapterPlanning` canonical 与 `getChapterPlanningReadiness()`，但 confirm 仍未检查章节。

0608-616 协同稿「完成企划」= **B 三必 + C 最低章节**。本卡补齐 C 侧门槛，与 B 对称并列检查。

---

## 目标

在「确认企划完成」（`POST /projects/:id/confirm-greenlight`）前：

- **前端硬拦**：B 未达标 + C 未达标均阻止提交，给出缺项提示
- **后端双保险**：`confirm-greenlight` 同步检查 B + C，未达标 400

**C 最低章节规则**（沿用 C-A helper）：

- 至少 1 章
- 每章非空 `title`
- 每章非空 `summary`

---

## 范围

1. **后端** `backend/src/utils/chapterPlanning.ts`
   - 新增 `assertChapterPlanningReady(metadata)`（或等价函数）
   - 错误信息可读（缺章 / 缺标题 / 缺梗概）

2. **后端** `POST /:id/confirm-greenlight`（`projects.ts`）
   - 在现有 `assertPlanningSettingReady` 之后（或合并为一次检查）调用章节 assert
   - B、C 均未达标时：400 + 明确 message（可并列两段，或合并一句）

3. **前端** `planningConfirm.ts` + `chapterPlanning.ts`
   - 新增 `assertChapterPlanningReadyForConfirm`（镜像 `assertPlanningSettingReadyForConfirm`）
   - `confirmPlanningWithReadiness` 同时检查 B + C 再调 API

4. **错误 surfaced**（最小改动）
   - confirm 入口（`PlanningInProgressPage` / `PlanningPage` / `PlanningActions`）应把 assert 抛出的 message 展示给用户（若现状吞掉 Error.message，本卡顺手修）

---

## 明确不做

- 不改 `release-to-studio` / `start-writing`
- 不 materialize `chapterPlanning` → `chapters`
- 不做 616-D 实现
- 不改章节编辑 UI / Tab 结构（C-A 已收口）
- 不硬编码「先设定后章节」save 顺序
- 不做 legacy 数据迁移

---

## 执行步骤

1. 只读核验：
   - `assertPlanningSettingReady` / `confirmPlanningWithReadiness` 现有路径
   - `getChapterPlanningReadiness` 规则与 C-A 一致
2. 后端 assert + confirm-greenlight 接入
3. 前端 assert + `planningConfirm` 接入
4. 验证：
   - `frontend npm run build` / `backend npm run build`
   - smoke：三必未填 → 400；章节未填 → 400；均填 → 200 `planning → planned`

---

## 验收标准

- 仅 B 缺项：confirm 被拦，提示作品设定缺项
- 仅 C 缺项：confirm 被拦，提示章节规划缺项
- B + C 均达标：`confirm-greenlight` 200，status → `planned`
- 后端绕过前端直接 POST：仍 400（双保险）
- 不改动 C-A 已确定的 planning 保存行为（仍不写 `chapters`）

---

## 回报格式

```md
## 做了什么
## 改了哪些文件
## 如何验证
## 还剩什么
## 风险或阻塞
```

---

## 风险边界

- 只读 `metadata.chapterPlanning`（经 normalize），**不**读 `chapters` 表做 confirm 门槛
- 若现有 confirm 入口 >3 处，统一走 `confirmPlanningWithReadiness`，禁止旁路
- 本卡只做 readiness 硬拦，不扩 confirm 副作用（不改 metadata 键、不触发 materialize）
