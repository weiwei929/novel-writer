# TASK-616-B 闭环记录

**状态**：B 阶段（设定侧）已收官（2026-06-17）  
**目标分支**：`feature/workdetail-p1`  
**HEAD**：`0447350`（616-B-A3 merged）

---

## PR 与提交

| PR | 子战役 | 摘要 |
|----|--------|------|
| [#4](https://github.com/weiwei929/novel-writer/pull/4) | **616-B-A** | `workSetting` 四块编辑器；企划课主写入路径 |
| [#5](https://github.com/weiwei929/novel-writer/pull/5) | **616-B-A2** | 立项 `_settingSketch` → `workSetting`；确认企划三必硬拦 |
| [#6](https://github.com/weiwei929/novel-writer/pull/6) | **616-B-A3** | 创意组设定雏形 UI；三条保存链路带 `_settingSketch` |

---

## B 解决了什么（设定侧闭环）

**企划课**

- Canonical 键：`Project.metadata.workSetting`（人物与关系 / 时间与地点 / 事件与情节 / 叙事风格）
- `WorkSettingEditor`：描述式四块，`save` 只写内容、不推进 `status`
- 「确认企划完成」：三必硬拦（列表 + `confirm-greenlight` 后端双保险）

**创意组 → 企划课承接**

- 立项时 `Proposal.metadata._settingSketch` 非空块 seed 到 `workSetting`
- 提案详情可编辑四块设定雏形（全部可选，不阻断提交企划课）
- `保存` / `开始创意构思` / `提交企划课` 均持久化 `_settingSketch`
- `coreSetting` 保留，不映射、不迁移

**工程**

- 共享 helper：`frontend/src/services/workSetting.ts`、`backend/src/utils/workSetting.ts`
- `planningConfirm.ts` 封装 confirm 前 readiness 检查

---

## B 明确未解决（留给后续）

| 项 | 建议归属 |
|----|----------|
| legacy 六字段全局禁止新写入 | 迁移专项 / 616-B 后续小卡 |
| legacy → `workSetting` 自动迁移 | 迁移专项 |
| 删除 `coreSetting` / 旧六字段 UI | 迁移专项 |
| 完成企划的**章节**成熟度门槛 | **616-C** |
| `release-to-studio` / 创作室放行门槛 | 0608 流程专项 |
| `ContentMetadataCard` 梗概无 description fallback | 可选 A2.5 或随迁移 |
| 作品预期（`_workExpectation`）UI | 未立项 |
| 编审 / 文集四块同模型视图 | **616-C** 或更后 |
| Prisma schema / DB 迁移 | 未立项 |

---

## 验收摘要

- [x] 企划课四块可编辑、可保存、不隐式改 status
- [x] 三必未填无法 confirm-planning（前后端）
- [x] 有设定雏形的提案立项后，企划课可见继承内容
- [x] 创意组四块可选填，提交企划课不被设定雏形拦截
- [x] frontend / backend `npm run build` 通过（各子战役）
- [ ] `baseline-e2e-v01.mjs` 全量（可补）

---

## 下一步

1. ~~616-B 设定侧闭环~~（本文档）
2. **P1-a** 入口治理（裸链 + dashboard 绕路）— 轻量实现卡，待授权
3. **616-C** 章节模型 — 仅设计会诊，不开实现
4. 根目录历史 `TASK-*.md` 不入库；以 `docs/CURRENT_BASELINE.md` 为准
