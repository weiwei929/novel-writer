# 重复请求问题修复

**日期**: 2025年12月08日  
**问题**: 前端存在重复请求，导致速率限制频繁触发

---

## 🔍 问题分析

### 发现的问题

1. **后端路由重复定义**
   - `apiRouter` (`/api/v1`) 中定义了 `/collections` 和 `/projects` 路由
   - 同时 `collectionsRouter` 和 `projectsRouter` 也定义了相同的路由
   - 导致同一个请求可能被两个路由处理器处理

2. **前端 useEffect 依赖问题**
   - `ProjectsList.tsx` 中的 `useEffect` 依赖项可能导致重复调用
   - `loadData` 函数没有使用 `useCallback`，导致每次渲染都创建新函数

3. **日志显示的问题**
   ```
   [http]: GET /api/v1/collections
   [http]: GET /collections
   ```
   这表明可能有路由匹配问题

---

## ✅ 已实施的修复

### 1. 前端优化

**文件**: `frontend/src/components/projects/ProjectsList.tsx`

**修复内容**:
- 使用 `useCallback` 包装 `loadData` 函数，避免不必要的重新创建
- 修复 `useEffect` 依赖项，确保只在必要时调用

**修复前**:
```typescript
useEffect(() => {
  const fromUrl = searchParams.get('collectionId') || ''
  if (fromUrl && fromUrl !== selectedCollection) {
    setSelectedCollection(fromUrl)
  } else {
    loadData()
  }
}, [selectedCollection, searchParams])

const loadData = async () => {
  // ...
}
```

**修复后**:
```typescript
const loadData = useCallback(async () => {
  // ...
}, [selectedCollection])

useEffect(() => {
  const fromUrl = searchParams.get('collectionId') || ''
  if (fromUrl && fromUrl !== selectedCollection) {
    setSelectedCollection(fromUrl)
  } else {
    loadData()
  }
}, [selectedCollection, searchParams, loadData])
```

### 2. 后端路由检查

**问题**: `apiRouter` 中定义了与独立路由重复的路由

**建议**: 
- 检查 `backend/src/routes/api.ts` 中的路由定义
- 如果 `collectionsRouter` 和 `projectsRouter` 已经处理了这些路由，应该从 `apiRouter` 中移除
- 或者移除独立的 `collectionsRouter` 和 `projectsRouter`，只使用 `apiRouter`

---

## 🔧 建议的进一步优化

### 1. 移除重复路由

如果 `apiRouter` 是旧的路由定义，建议：

**选项 A**: 移除 `apiRouter` 中的重复路由
```typescript
// backend/src/routes/api.ts
// 移除 /collections 和 /projects 路由，因为已经有独立的路由器
```

**选项 B**: 移除独立的路由器，只使用 `apiRouter`
```typescript
// backend/src/index.ts
// 移除 app.use('/api/v1/collections', collectionsRouter)
// 移除 app.use('/api/v1/projects', projectsRouter)
// 只使用 app.use('/api/v1', apiRouter)
```

### 2. 添加请求去重

在前端添加请求去重机制：

```typescript
// 使用 AbortController 取消重复请求
const abortControllerRef = useRef<AbortController | null>(null)

const loadData = useCallback(async () => {
  // 取消之前的请求
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }
  
  abortControllerRef.current = new AbortController()
  
  try {
    // 使用 signal 发送请求
    const [projectsData, collectionsData] = await Promise.all([
      projectsApi.getAll(selectedCollection || undefined),
      collectionsApi.getAll(),
    ])
    // ...
  } catch (err) {
    if (err.name === 'AbortError') {
      return // 请求被取消，忽略错误
    }
    // 处理其他错误
  }
}, [selectedCollection])
```

### 3. 添加请求缓存

使用 React Query 或 SWR 来缓存请求结果，避免重复请求：

```typescript
import { useQuery } from '@tanstack/react-query'

const { data: collections } = useQuery({
  queryKey: ['collections'],
  queryFn: () => collectionsApi.getAll(),
  staleTime: 30000, // 30秒内不重新请求
})
```

---

## 📊 验证方法

### 1. 检查网络请求

打开浏览器开发者工具 → Network 标签：
- 查看是否有重复的 API 请求
- 检查请求的触发时间
- 确认是否有不必要的请求

### 2. 检查日志

查看后端日志：
- 确认每个请求只被处理一次
- 检查是否有重复的路由匹配

### 3. 性能监控

- 使用 React DevTools Profiler 检查组件渲染
- 确认 `useEffect` 不会导致无限循环

---

## ✅ 修复清单

- [x] 修复 `ProjectsList` 中的 `useEffect` 依赖问题
- [x] 使用 `useCallback` 优化 `loadData` 函数
- [ ] 检查并移除后端重复路由（需要确认路由策略）
- [ ] 添加请求去重机制（可选）
- [ ] 添加请求缓存（可选）

---

## 🎯 下一步

1. **确认路由策略**: 决定是使用 `apiRouter` 还是独立的路由器
2. **移除重复路由**: 根据策略移除重复的路由定义
3. **测试验证**: 确认重复请求问题已解决

---

**总结**: 已修复前端的 `useEffect` 依赖问题，使用 `useCallback` 优化了函数创建。后端路由重复问题需要根据项目策略决定如何处理。


