# WorkDetailPage 语义返回修复

> 单一改动：`WorkDetailPage.tsx` 返回按钮从 `navigate(-1)` 改为读 `?from=` + `project.status` 做语义导航

---

## 改动

### 文件
`frontend/src/pages/WorkDetailPage.tsx`

### 1. 新增 import
在 `:3` 的 `useNavigate, useParams` 后追加 `useSearchParams`：
```typescript
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
```

### 2. 新增语义返回函数

在组件内添加（约 `:80` 区域，`const navigate` 之后）：

```typescript
const [searchParams] = useSearchParams()
const from = searchParams.get('from')

const handleBack = useCallback(() => {
  if (from === 'planning') {
    if (project.status === 'planning') {
      navigate('/planning/proposals')
    } else if (project.status === 'planned') {
      navigate('/planning/projects')
    } else {
      navigate('/planning/proposals')
    }
    return
  }
  if (from === 'writing') {
    navigate('/writing/projects')
    return
  }
  // 无 ?from= 时 fallback 浏览器历史
  navigate(-1)
}, [from, project?.status, navigate])
```

### 3. 替换返回按钮 `:442`

```
// 改前
onClick={() => navigate(-1)}

// 改后
onClick={() => void handleBack()}
```

---

## 验证

```
npm run build → exit 0
```

手动测试路径：
1. 企划课 approve → `/work/:id?from=planning`（status=planning）→ 返回 → `/planning/proposals` ✅
2. 正式立项后 → `/work/:id?from=planning`（status=planned）→ 返回 → `/planning/projects` ✅
3. 创作室章节编辑 → `/work/:id?from=writing` → 返回 → `/writing/projects` ✅
4. 无 `?from=` 的旧链接 → 退化为 `navigate(-1)` ✅
