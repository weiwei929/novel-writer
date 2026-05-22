# 元数据字段约定（Metadata Field Convention）

**版本**: v0.1  
**日期**: 2026-05-22  
**状态**: 基线治理 — 新增写入必须遵循本文 canonical 字段

---

## 1. 项目元数据（Project.metadata）

存储于 `Project.metadata` JSON 对象，值为**平字符串**（非 `{ current }` 包装）。

### Canonical 字段（新增写入必须使用）

| 字段 | 含义 | UI 标签示例 |
|------|------|-------------|
| `synopsis` | 项目梗概 | 项目梗概 |
| `characters` | 人物设定 | 人物设定 |
| `timeline` | 时间线 | 时间线 |
| `settings` | 世界观 / 设定 | 世界观/设定 |
| `relationships` | 关系网 | 关系网 |
| `plotStructure` | 情节结构 | 情节结构 |

### Legacy alias（只读兼容，禁止新增写入）

| Legacy | 映射到 canonical | 说明 |
|--------|------------------|------|
| `worldBuilding` | `settings` | 导入审核 Modal 历史字段 |
| `worldview` | `settings` | 旧 AI 助手写入名 |
| `logline` | `synopsis` | 旧 AI 助手写入名 |

读取时：优先 canonical；若为空可 fallback 读 legacy（按需，未统一自动化）。

### 读取兼容（UI）

```typescript
readMetadataFieldValue(metadata.synopsis)
// string → 直接返回
// { current: string } → 返回 current（历史形态）
// 其他 → ''
```

实现：`frontend/src/utils/metadataField.ts` → `readMetadataFieldValue`

---

## 2. 章节梗概

| 存储 | 角色 |
|------|------|
| `Chapter.summary`（DB 列） | **主存储（canonical）** |
| `Chapter.metadata.synopsis` | Legacy fallback |

**写入**：通过 `chaptersApi.updateMetadata(chapterId, 'synopsis', content)` 时，客户端映射到 `summary` 列。

**读取**：`summary` 优先，其次 `readMetadataFieldValue(metadata.synopsis)`。

---

## 3. AI 助手写入（AIAssistantPanel）

| 用户操作 | 写入字段 |
|----------|----------|
| 存为世界观 | `settings` |
| 存为角色 | `characters` |
| 存为梗概 | `synopsis`（替换，非追加） |

---

## 4. 系统字段（勿作业务展示）

| 字段 | 用途 |
|------|------|
| `_draft` | AI 提取待确认草稿 |
| `_extractedAt` | 提取时间戳 |
| `_lastModified` | 字段级修改记录（若存在） |

---

## 5. 相关组件对照

| 组件 | 项目字段列表 |
|------|-------------|
| `ProjectMetadataPanel` | canonical 六字段 |
| `MetadataReviewModal` | 含 legacy `worldBuilding`（待后续对齐） |
| `ContextManager`（后端） | 读 `settings` / `worldview` |

---

**维护**：字段增删须同步更新本文与 `baseline-e2e-v01.mjs` 相关断言。
