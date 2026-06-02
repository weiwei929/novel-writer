# 协作对齐记录 — 创意组故障复盘

> 对齐时间：2026-06-02  
> 参与方：Claude（设计/任务卡） ↔ Cursor Agent（实现/热修）  
> 触发事件：TASK-102 验收期创意组故障（详见 `docs/tasks/REPORT-TASK-102-CREATIVE-GROUP-INCIDENT-2026-06-02.md`）  
> 目的：各自认领改进项，后续出卡和执行按约定规范走。

---

## 一、故障根源回顾

| 问题 | 根因 | 设计侧可堵 | 实现侧可防 |
|------|------|-----------|-----------|
| 列表页无限 reload | `useNotifications` 不稳定引用 | 任务卡加实现指引 | React Hook 依赖审查 |
| API 401 但显示已认证 | AuthGuard 不复检 + 内存会话 | 工程规范注明重启行为 | 认证边界测试 |
| 502 重启 | nodemon 监听会话文件 | 无需（运维细节） | 配置 `watch` 排除 |
| 旧 `tags` 字符串 | 数据格式演进 | 验收加数据兼容项 | 迁移脚本统一处理 |
| chunk 404 | 缓存旧 index.html | 验收加 hard refresh | 部署加 no-cache |
| 空状态显示「加载中」 | 无空状态分支 | 验收加空状态引导 | 前端兜底 UI |

**两侧各有疏忽，但都没有致命错误。** 堵上缺口后，后续不会再出同类问题。

---

## 二、Claude（设计侧）改进项

### 2.1 任务卡结构升级

以后每张任务卡末尾增加「工程注意事项」一节：

```markdown
---
## 工程注意事项

### 数据兼容
- xxx 字段在 DB 中可能为 {格式}，实现时做 normalize
- 示例：tags 可能为 JSON 数组或逗号字符串

### 会话与认证
- 后端重启后 token 可能失效，前端需有复检机制
- 使用 useEffect + AbortController 避免竞态

### 部署验证
- production build 后 hard refresh 测试所有页面
- 确认懒加载 chunk 路径正确
```

### 2.2 验收标准补充

三类新增验收项：

| 类别 | 验收项 |
|------|--------|
| **持久化** | 后端重启 + 页面刷新，数据和会话正常 |
| **边界** | 空数据不崩溃，显示引导文案 |
| **部署** | production build 后 hard refresh 无 404 |

### 2.3 CURSOR_REFERENCE.md 补充

在 `docs/tasks/CURSOR_REFERENCE.md` 增加「VPS 开发规范」章节（已由 Cursor 落地，见该文件第十一节）。

---

## 三、Cursor（实现侧）改进项

### 3.1 自测清单（每次提交前）

```
□ tsc --noEmit
□ npm run build
□ hard refresh 后页面不报 chunk 404
□ 后端重启后页面不崩溃（token 失效时有友好提示）
□ 空数据页面有引导文案（非「加载中」）
□ 列表页切换/刷新不触发重复 API 请求
□ 标签/状态等枚举字段兼容旧数据格式
```

### 3.2 Hook 稳定性审查

对每个包含 `useEffect` + `useCallback` 的列表组件，检查：

- `useCallback` 的依赖是否包含可能每次重建的函数
- `useEffect` 的依赖是否可能导致无限循环
- 优先使用 `useRef` 存储稳定回调 + 顶层 `useEffect`

### 3.3 认证边界测试

- 启动后首次访问（未登录）→ 跳转登录页
- 登录后 → 正常请求
- 后端重启后 → token 失效 → 401 → 自动跳回登录页
- 登出后 → 路由保护正常

---

## 四、双方共同承诺

### 4.1 故障响应协议

| 阶段 | 职责 |
|------|------|
| 用户报告故障 | Cursor 优先排查实现层问题 |
| 确认非实现层 | Cursor 输出报告 + 复现步骤，给 Claude 判断设计层 |
| 设计层问题 | Claude 出修正方案，Cursor 落地 |
| 修复后 | 双方一起确认验收 |

### 4.2 信息同步

- Claude 出卡时主动标注「工程注意事项」
- Cursor 在实现中发现的预期外情况（旧数据格式、配置陷阱等），回传给 Claude 更新参考文档
- 重大故障后出一份类似本次的简短报告，双方对齐

### 4.3 关键原则

**设计问题不要用实现修，实现问题不要用设计补。** —— 各归各的，但信息要互通。

---

## 五、本次热修的提交建议

```
fix: 创意组稳定性 — 认证复检/通知 Hook/会话与部署

- AuthGuard 移入路由树，401 派发 novel:auth-expired
- useNotifications 回调稳定化
- session 持久化（/tmp）+ nodemon 仅 watch src/
- index.html no-cache（Caddy，服务器配置）
- tags 字段兼容逗号分隔字符串
```

关联文档：

- `docs/tasks/REPORT-TASK-102-CREATIVE-GROUP-INCIDENT-2026-06-02.md`
- `docs/tasks/CURSOR_REFERENCE.md` §十一 VPS 开发规范
