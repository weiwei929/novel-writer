# TASK-016（暂存卡）：作品暂存 — shelved 列表/还原/彻底删除

> `shelved` 完整闭环 + 「暂存阁」→「作品暂存」改名。

## 实现

- 后端：`POST /projects/:id/shelve`、`POST /projects/:id/restore`、`GET /projects?status=shelved`
- 前端：`ShelfPage`、`projectsApi.shelve/restore/getShelved`
- 文案：`PROJECT_STATUS_LABEL`、`Layout` title、用户可见「暂存阁」→「作品暂存」
