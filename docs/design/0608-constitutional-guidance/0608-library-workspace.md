# 0608-library-workspace.md — 文集库三工作区前端设计

> **文档角色**：文集库（文集库）的三工作区实施蓝图。文集库是 5 部门管线的终态部门。
> **优先级**：P4（编审部之后）。
> **关系**：引用 `0608-dept-workspace-model.md` §2（文集库状态映射）、`0608-status-context-labeling.md` §3.4（文集库标签）、`0608-file-staging-pool.md`（文件暂存语义）、`0608-release-protocol.md` §4（放行至文集库协议）。

---

## §0 文集库在 0608 模型中的定位

文集库是 5 部门管线的终态部门。编审部放行的作品进入文集库，作者在此将作品归入文集、管理成书输出。

**与其它部门的区别**：
- 文集库是只读的——不提供正文编辑（错别字也不在文集库修）
- `archived` 是状态机终态——不回流到任何其他 status
- 但文件暂存池机制仍然适用——`archived` 作品可软删后 restore 回 `archived`

---

## §1 三工作区映射

### 1.1 Project 状态映射

| 0608 三工作区 | `Project.status` | 上下文标签 | 含义 |
|--------------|-----------------|-----------|------|
| 待处理 | `reviewed` | 待归库作品 | 编审部审阅完成，等待归入文集 |
| 进行中 | — | 归类操作 | 将作品归入文集/设定文集元数据 |
| 已完成 | `archived` | 已归档作品 | 已归入文集并归档 |

**注意**：文集库的"进行中"不直接对应某个 `Project.status`，而是一组用户操作（创建文集、把作品归入文集、设定文集元数据）。

### 1.2 信息架构

```
L1: 文集库
  ├ 待处理
  │   └ Project.status = 'reviewed'（已放行至文集库但未归档）
  │   └ 动作：[归入文集 →] [📂 文件暂存]
  │
  ├ 收集册（进行中的文集操作）
  │   └ Collection 列表（每个文集包含若干作品）
  │   └ 动作：[查看文集] [创建文集] [编辑文集元数据]
  │
  └ 已完成
      └ Project.status = 'archived'
      └ 动作：[只读查看] [导出] [📂 文件暂存]
```

### 1.3 与现有 LibraryPage 的关系

现有 `LibraryPage.tsx` 负责文集库展示。0608 三工作区解释：

```typescript
// 待处理：可归档的作品（reviewed，已放行至文集库）
const pending = projects.filter(p => p.status === 'reviewed')

// 进行中：文集列表（Collection）
const collections = await collectionsApi.getAll()

// 已完成：已归档作品
const completed = projects.filter(p => p.status === 'archived')
```

---

## §2 关键动作

### 2.1 归入文集（reviewed → archived）

**触发**：用户在待处理区选择作品，点击"归入文集"

**流程**：
1. 打开文集选择器（现有 `CollectionPickerModal`）
2. 或在无合适文集时创建新文集（现有 `CreateCollectionModal`）
3. 调用 `PUT /projects/:id { collectionId }` 关联作品到文集
4. 调用 `POST /projects/:id/transition { to: 'archived' }` 标记归档

**端点**：
| 动作 | 端点 | 状态 |
|------|------|------|
| 更新文集归属 | `PUT /projects/:id { collectionId }` | ✅ 现有 |
| 状态归档 | `POST /projects/:id/transition { to: 'archived' }` | ✅ 现有 |

### 2.2 文集管理

| 动作 | 端点 | 状态 |
|------|------|------|
| 创建文集 | `POST /collections` | ✅ 现有 |
| 查看文集 | `GET /collections/:id` | ✅ 现有 |
| 编辑文集元数据 | `PUT /collections/:id` | ✅ 现有 |
| 删除文集 | `DELETE /collections/:id` | ✅ 现有 |

### 2.3 文件暂存

- `archived` 作品可 `POST /projects/:id/soft-delete` → 进入文件暂存池
- restore → 回到 `archived`
- 详见 `0608-file-staging-pool.md`

### 2.4 作品导出

| 动作 | 端点 | 状态 |
|------|------|------|
| 导出作品 | `GET /projects/:id/export` | ✅ 现有 |

---

## §3 禁止

| # | 禁止项 | 原因 |
|---|--------|------|
| ❌ | 在文集库编辑作品正文 | 文集库是只读的，错别字也不在文集库修 |
| ❌ | `archived → writing` 回流 | archived 是状态机终态 |
| ❌ | 文集库直接拉取创作室作品 | 必须经编审部放行 |
| ❌ | 在文集库中做审阅操作 | 审阅是编审部的职能 |
| ❌ | 文集库降级为创作室/编审部的侧栏 | 文集库是独立 L1 部门 |

---

## §4 与其它部门设计文档的关系

| 文档 | 关系 |
|------|------|
| `0608-release-protocol.md` §4 | 放行至文集库协议 |
| `0608-file-staging-pool.md` | 文件暂存池语义（archived 可软删） |
| `0608-status-context-labeling.md` | 文集库标签映射 |
| `0608-overall-architecture.md` | 系统整体架构 |
