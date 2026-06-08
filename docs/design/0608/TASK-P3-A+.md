# TASK P3-A+：WorkDetailPage 编审部上下文 + G6 + api/statusLabels

**基线**：5022026  
**文件**：`api.ts`（submitReview/markReviewed/markWritten）、`statusLabels.ts`（G1）、`WorkDetailPage.tsx`

**后端**：`mark-reviewed` 已存在（#8b），无需重复新增。

**G6**：`case 'writing'` + `isWritingContext` →「确认创作完成」→ `markWritten`（`writing→written`）。

详见指挥部完整任务卡。
