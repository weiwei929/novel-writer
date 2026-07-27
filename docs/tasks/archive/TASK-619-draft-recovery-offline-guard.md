# TASK-619: Studio Offline Draft Backup & Recovery

> **状态**：已完成 / 已集成
> **关联设计**：[docs/CURRENT_BASELINE.md](../CURRENT_BASELINE.md)

---

## 1. 任务目标

提升 `WritingEditorPage` 创作室正文数据的安全防护级别，防止因断网、服务报错、意外刷掉标签页导致未保存正文丢失。

---

## 2. 成果清单

- `frontend/src/utils/draftStorage.ts`：自动本地草稿持久化、差异判定与擦除工具类。
- `frontend/src/pages/WritingEditorPage.tsx`：
  - 正文 800ms 防抖写入 `localStorage`。
  - 未同步草稿检测与恢复横幅（Recovery Banner）。
  - 保存成功自动清除已同步草稿。
  - 网络离线状态（`online` / `offline`）友好告知提示。
