# TASK: P1-A 范围评估 — dashboard + 首页入口治理

> **模式**：只读评估，不修改代码
> **基线**：`v2-dev` @ `dc4331f`（HEAD）
> **范围**：仅 `dashboard.ts` + `HomePage.tsx`
> **司令部裁定**：P1-A 正式范围已确认，见下文目标与约束

---

## 背景

P0-A/P0-B 已解决 WorkDetailPage 上下文识别和无 from= 的动作暴露。P1 进入入口架构治理阶段。

P1-A 是 P1 的第一枪，聚焦 **dashboard 首页移除所有绕过五部门子页的 WDP 直达入口**。

---

## P1-A 目标

1. 首页不再提供绕过五部门子页的 WorkDetailPage 直达入口
2. `dashboard.ts` 生成的作品条目不再链接 `/work/:id`
3. 最近动态若需要链接，应链接到对应部门子页，或改为不可点状态提醒
4. 首页保留五部门卡片、数量、提醒
5. **不做**继续写作强入口
6. **不改** ProjectCard
7. **不改** 创意组
8. **不改** ShelfPage
9. **不删** 旧路由（App.tsx L41/L50/L57）

---

## 司令部预设倾向（供评估参考）

评估时请以这三个倾向为基准校验可行性，如果发现技术阻塞或反直觉的副作用，如实回报。

### 倾向 1 — 切片列表条目点击：选项 B（跳部门子页）
- 不再跳 `/work/:id`
- 改为跳对应部门子页
- 目的：首页引导用户进入五部门工作区，而非绕过流程

### 倾向 2 — 动态活动条目：选项 C（混合）
- 能明确归属部门的 → 链到对应部门子页
- 只是提醒/日志性质的 → 先不可点
- 一律不得链接 WorkDetailPage

### 倾向 3 — `DashboardListItem.href`：保持必填
- 优先把 `href` 改为部门路由，减少 HomePage 改动
- 如 Cursor 发现无法合理映射，再提出可选 href 方案

---

## 评估项 1 — dashboard.ts 需改什么

### 1a. mapProjectItem（L41-48）

当前代码：
```typescript
function mapProjectItem(p: Project): DashboardListItem {
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    updatedAt: p.updatedAt,
    href: `/work/${p.id}`,  // 或 ?from=...
  }
}
```

**评估问题**：
- 切片列表（planning/writing/review/library 分区）显示作品标题时，用户点击后应跳转到什么位置？
- **司令部倾向 B**：跳转到部门子页（如 review 分区 → `/editorial`；planning 分区 → `/planning/projects` 或 `/planning/in-progress`）
- 请验证：每个分区对应的部门子页路由是什么？是否存在一一映射关系？
- 选项 C（移除整个切片列表）：请对比 B 的优劣势

### 1b. 动态活动（L98/L114/L121 附近）

当前三条动态活动生成 `/work/` 链接：

| 行 | 文案 | 当前 href | 建议改为 |
|----|------|----------|---------|
| L98 | "创意组「X」已通过 → 进入企划课" | `/work/${p.projectId}` | `/planning/in-progress` 或不可点 |
| L114 | "创作室「X」有更新" | `/work/${p.id}` | `/writing/projects` 或不可点 |
| L121 | "文集库「X」已完成" | `/work/${p.id}` | `/library` 或不可点 |

**评估问题**：
- **司令部倾向 C**：能明确归属部门的链到部门子页，纯提醒的不可点
- 每条活动能映射到哪个部门路由？
- 是否有无法归属的活动？（保持不可点）
- 一律不得链接 WorkDetailPage

### 1c. continueWriting 数据结构（暂缓，仅确认）

司令部裁定 D1="继续写作"暂缓。确认当前 dashboard.ts **无** `continueWriting` 相关字段。

---

## 评估项 2 — HomePage.tsx 需要如何适配

### 2a. 切片列表消费方（L193-194 附近）

当前代码渲染每个切片条目：
```tsx
<Link to={item.href} className="...">
  <span>{item.title}</span>
  {item.statusLabel && <span>{item.statusLabel}</span>}
</Link>
```

**评估问题**：
- 若 dashboard.ts 不再生成 `href`（或 `href` 改为部门路由），HomePage 需要如何改？
- 建议改为纯 `<span>` 展示，还是保留 `<Link>` 但指向部门页？
- 当前 `DashboardListItem.href` 是必填字段（`href: string`），是否需要改为可选？

### 2b. 动态活动区（L216-235）

**评估问题**：
- activity 列表的 `href` 改为部门路由后，HomePage 的渲染逻辑是否不变？
- 若改为不可点，如何处理 `{a.href ? <Link> : <span>}` 的条件渲染？

### 2c. 五部门卡片区（L133-174）

**评估问题**：
- 是否有需要改动的部分？（司令部裁定保留五部门卡片+数量）
- 各卡片的 `stage.to` 路由是否正确？

---

## 评估项 3 — 作品条目点击后的行为

### 3a. 切片列表条目

**选项分析**：

| 选项 | dashboard.ts 改动 | HomePage.tsx 改动 | 用户体验 | 推荐？ |
|------|------------------|------------------|---------|-------|
| A: 纯展示不可点 | 移除/清空 `href` | `<Link>` → `<span>` | 用户看到标题但无法点击 | 最保守 |
| B: 链到部门子页 | `href` 改为 `stage.to` | `<Link>` 不变 | 点击进入部门列表，再点进入详情 | 次推荐 |
| C: 移除切片列表 | 不再生成切片 items | 移除切片渲染区 | 首页信息变少 | 不推荐 |

**评估**：
- 每种方案的 diff 大小
- 风险高低
- 对现有功能的破坏性

### 3b. 动态活动条目

**选项分析**：

| 选项 | 实现方式 | diff | 风险 |
|------|---------|------|------|
| A: 全不可点 | activity `href` 置空或移除 | 小 | 低 |
| B: 链部门子页 | activity `href` 改为 `/planning/...` 等 | 中 | 低-中 |
| C: 混合（有明确部门就链，否则不可点） | 按行判断 | 中 | 中 |

---

## 评估项 4 — 预计 diff

| 修改项 | 文件 | 预估行数 |
|--------|------|---------|
| mapProjectItem href 改造 | dashboard.ts | ~5-15 行 |
| 动态活动 href 改造 | dashboard.ts | ~5-10 行 |
| 切片列表消费方适配 | HomePage.tsx | ~5-15 行 |
| 动态活动区适配 | HomePage.tsx | ~3-8 行 |
| **合计** | 2 文件 | **~18-48 行** |

---

## 评估项 5 — build 风险

| 风险点 | 说明 | 级别 |
|--------|------|------|
| `DashboardListItem.href` 改为可选 | 使用方的条件渲染 | 低 |
| `activity[].href` 改为可选 | 同上 | 低 |
| 切片列表变为不可点 | 纯 UI 变化 | 极低 |
| 类型变更 | 若 `href` 从 `string` 改为 `string | undefined`，TypeScript 会强制检查 | 中（有益） |

---

## 回报格式

```
=== P1-A 范围评估 ===

## 1. dashboard.ts 改动分析
1a. mapProjectItem:
    - 当前 href 值: ...
    - 选项评估（A/B/C）: ...
    - 推荐选项: ...（理由）
1b. 动态活动:
    - 3 条活动当前 href: ...
    - 建议: ...
1c. continueWriting: 确认不存在

## 2. HomePage.tsx 适配分析
2a. 切片列表消费方:
    - 当前渲染方式: ...
    - 适配方案: ...
2b. 动态活动区:
    - 当前渲染方式: ...
    - 适配方案: ...
2c. 五部门卡片: 无需改动

## 3. 点击行为选项
推荐: ...（A/B/C 选一）

## 4. 预计 diff
dashboard.ts: ~N 行
HomePage.tsx: ~N 行
合计: ~N 行 / 风险: 低

## 5. build 风险
- 类型变更: ...
- 其他: ...
```
