# Novel-Writer 代码规范文档

> **状态**：现役 · 最后核对 2026-07-27
> ⚠️ 本文所述规范目前**未被 eslint 强制**（规则集近乎空，见 [ROADMAP.md](../ROADMAP.md) 第一期），执行靠自觉。

**版本**: 1.0.0  
**最后更新**: 2025年12月08日  
**适用范围**: 前后端所有代码

---

## 📋 目录

1. [总体原则](#总体原则)
2. [后端代码规范](#后端代码规范)
3. [前端代码规范](#前端代码规范)
4. [类型定义规范](#类型定义规范)
5. [错误处理规范](#错误处理规范)
6. [API设计规范](#api设计规范)
7. [代码格式化规范](#代码格式化规范)
8. [提交规范](#提交规范)

---

## 总体原则

### 核心原则

1. **一致性优先**: 所有代码必须遵循统一规范
2. **类型安全**: 充分利用TypeScript类型系统
3. **错误处理**: 统一的错误处理机制
4. **可维护性**: 代码清晰、易读、易维护
5. **文档完善**: 关键代码必须有注释

### 禁止事项

- ❌ 禁止使用 `any` 类型（特殊情况需注释说明）
- ❌ 禁止直接使用 `console.log/error/warn`（使用统一日志服务）
- ❌ 禁止本地定义已存在的类型（使用统一类型定义）
- ❌ 禁止手动构建API响应（使用辅助函数）
- ❌ 禁止使用字符串错误代码（使用枚举）

---

## 后端代码规范

### 1. 导入规范

#### Express 导入

```typescript
// ✅ 正确：统一使用命名导入
import { Router, Request, Response, NextFunction } from 'express'
const router = Router()

// ❌ 错误：默认导入
import express from 'express'
const router = express.Router()

// ❌ 错误：混合导入
import express, { Request, Response } from 'express'
```

#### 类型和工具导入

```typescript
// ✅ 正确：从统一类型文件导入
import { 
  ApiResponse, 
  ApiErrorCode, 
  createSuccessResponse, 
  createErrorResponse,
  ErrorCodeToHttpStatus 
} from '../types/api.js'

// ❌ 错误：本地定义类型
interface ApiResponse<T = any> {
  success: boolean
  data?: T
}
```

### 2. API响应格式规范

#### 成功响应

```typescript
// ✅ 正确：使用 createSuccessResponse
import { createSuccessResponse } from '../types/api.js'

const response = createSuccessResponse(data, { projectId: id })
res.json(response)

// ✅ 带分页的成功响应
const response = createSuccessResponse(
  items,
  { projectId: id },
  {
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5
  }
)
res.json(response)

// ❌ 错误：手动构建响应
res.json({
  success: true,
  data: data
})
```

#### 错误响应

```typescript
// ✅ 正确：使用 createErrorResponse 和枚举
import { 
  createErrorResponse, 
  ApiErrorCode, 
  ErrorCodeToHttpStatus 
} from '../types/api.js'

const response = createErrorResponse(
  ApiErrorCode.DATABASE_ERROR,
  error instanceof Error ? error.message : 'Operation failed',
  process.env.NODE_ENV === 'development' ? error : undefined
)
res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)

// ❌ 错误：手动构建错误响应
res.status(500).json({
  success: false,
  error: {
    code: 'DATABASE_ERROR',
    message: 'Failed'
  }
})

// ❌ 错误：使用字符串错误代码
res.status(400).json({
  success: false,
  error: { message: 'Validation failed' }
})
```

### 3. 错误处理规范

#### 统一错误处理模式

```typescript
// ✅ 正确：统一错误处理
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const item = await db.getItemById(id)
    
    if (!item) {
      const response = createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'Item not found'
      )
      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
    }
    
    const response = createSuccessResponse(item)
    res.json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch item'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})
```

#### 使用 asyncHandler

```typescript
// ✅ 正确：使用 asyncHandler 包装异步函数
import { asyncHandler } from '../middleware/errorHandler.js'

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const item = await db.getItemById(id)
  
  if (!item) {
    throw new ApiError(ApiErrorCode.NOT_FOUND, 'Item not found')
  }
  
  const response = createSuccessResponse(item)
  res.json(response)
}))
```

### 4. 类型使用规范

#### 禁止使用 any

```typescript
// ❌ 错误：使用 any
catch (error: any) {
  console.error(error.message)
}

// ✅ 正确：使用 unknown
catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', { error: error.message })
  }
}

// ✅ 正确：定义具体类型
interface UpdateRequest {
  title?: string
  description?: string
  status?: ProjectStatus
}

router.put('/:id', async (req: Request, res: Response) => {
  const updates: UpdateRequest = req.body
  // ...
})
```

#### 类型断言规范

```typescript
// ❌ 错误：不安全的类型断言
const status = (mappedStatus as any) || created.status

// ✅ 正确：使用类型守卫
function isValidStatus(status: string): status is ProjectStatus {
  return ['draft', 'writing', 'completed'].includes(status)
}

if (mappedStatus && isValidStatus(mappedStatus)) {
  patch.status = mappedStatus
}
```

### 5. 日志记录规范

```typescript
// ❌ 错误：直接使用 console
console.error('Error occurred:', error)
console.log('Operation completed')
console.warn('Warning message')

// ✅ 正确：使用统一日志服务
import { logger } from '../utils/logger.js'

logger.error('Error occurred', { error, context: 'route handler' })
logger.info('Operation completed', { itemId: id })
logger.warn('Warning message', { details })
```

### 6. 路由文件结构规范

```typescript
// ✅ 标准路由文件结构
import { Router, Request, Response } from 'express'
import { db } from '../services/database.js'
import { 
  ApiErrorCode, 
  createSuccessResponse, 
  createErrorResponse,
  ErrorCodeToHttpStatus 
} from '../types/api.js'
import { logger } from '../utils/logger.js'

const router = Router()

/**
 * 获取资源列表
 * GET /api/v1/resource
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await db.getItems()
    const response = createSuccessResponse(items)
    res.json(response)
  } catch (error) {
    logger.error('Failed to fetch items', { error })
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch items'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

export default router
```

---

## 前端代码规范

### 1. 组件导出规范

```typescript
// ✅ 正确：统一使用默认导出
const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  // 组件实现
  return <div>...</div>
}

export default ComponentName

// ❌ 错误：混合导出
export const ComponentName: React.FC<...> = ...
export default ComponentName
```

### 2. 类型定义规范

```typescript
// ✅ 正确：接口命名规范
interface ComponentNameProps {
  title: string
  onAction: () => void
  optional?: boolean
}

// ✅ 正确：类型导出
export interface ComponentNameProps { ... }

// ✅ 正确：使用类型而不是接口（当需要联合类型时）
type Status = 'loading' | 'success' | 'error'
```

### 3. Hooks 使用规范

```typescript
// ✅ 正确：自定义 Hook 命名
export const useComponentName = () => {
  const [state, setState] = useState()
  // ...
  return { state, setState }
}

// ✅ 正确：Hook 依赖数组
useEffect(() => {
  // 副作用
}, [dependency1, dependency2])
```

### 4. API 调用规范

```typescript
// ✅ 正确：使用统一的 API 服务
import { projectsApi } from '../services/api'

const loadProject = async (id: string) => {
  try {
    const project = await projectsApi.getById(id)
    setProject(project)
  } catch (error) {
    handleError(error)
  }
}
```

---

## 类型定义规范

### 1. 类型文件组织

```typescript
// ✅ 正确：统一类型定义文件
// backend/src/types/api.ts
export interface ApiResponse<T = any> { ... }
export enum ApiErrorCode { ... }
export function createSuccessResponse<T>(...): ApiResponse<T> { ... }
export function createErrorResponse(...): ApiResponse { ... }

// ✅ 正确：业务类型定义
// backend/src/types/index.ts
export interface Project { ... }
export interface Chapter { ... }
export interface Collection { ... }
```

### 2. 类型命名规范

```typescript
// ✅ 正确：接口使用 PascalCase
interface ProjectMetadata { ... }
interface CreateProjectRequest { ... }

// ✅ 正确：类型别名使用 PascalCase
type ProjectStatus = 'draft' | 'writing' | 'completed'
type ApiResponse<T> = { ... }

// ✅ 正确：枚举使用 PascalCase
enum ApiErrorCode { ... }
enum ProjectStatus { ... }
```

---

## 错误处理规范

### 1. 错误码使用

```typescript
// ✅ 正确：使用枚举
import { ApiErrorCode } from '../types/api.js'

throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Invalid input')

// ❌ 错误：使用字符串
throw new Error('VALIDATION_ERROR')
```

### 2. 错误传播

```typescript
// ✅ 正确：使用 ApiError 类
import { ApiError, ApiErrorCode } from '../types/api.js'

if (!item) {
  throw new ApiError(ApiErrorCode.NOT_FOUND, 'Item not found')
}

// ✅ 正确：在路由中使用
router.get('/:id', asyncHandler(async (req, res) => {
  const item = await db.getItemById(req.params.id)
  if (!item) {
    throw new ApiError(ApiErrorCode.NOT_FOUND, 'Item not found')
  }
  res.json(createSuccessResponse(item))
}))
```

---

## API设计规范

### 1. RESTful 路由规范

```typescript
// ✅ 正确：RESTful 路由
GET    /api/v1/projects          // 获取项目列表
GET    /api/v1/projects/:id      // 获取单个项目
POST   /api/v1/projects          // 创建项目
PUT    /api/v1/projects/:id      // 更新项目
DELETE /api/v1/projects/:id      // 删除项目

// ✅ 正确：嵌套资源
GET    /api/v1/projects/:id/chapters      // 获取项目的章节列表
POST   /api/v1/projects/:id/chapters      // 为项目创建章节
```

### 2. 请求验证规范

```typescript
// ✅ 正确：使用 Joi 验证
import Joi from 'joi'

const createProjectSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('draft', 'writing', 'completed').optional()
})

router.post('/', async (req: Request, res: Response) => {
  const { error, value } = createProjectSchema.validate(req.body)
  
  if (error) {
    const response = createErrorResponse(
      ApiErrorCode.VALIDATION_ERROR,
      error.details[0].message
    )
    return res.status(ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR]).json(response)
  }
  
  // 使用验证后的数据
  const project = await db.createProject(value)
  // ...
})
```

---

## 代码格式化规范

### 1. Prettier 配置

项目使用 Prettier 进行代码格式化，配置如下：

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### 2. 格式化命令

```bash
# 格式化所有文件
npm run format

# 检查格式
npm run format:check
```

### 3. 自动格式化

提交代码前会自动格式化（通过 Git hooks）

---

## 提交规范

### 1. 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 2. 类型说明

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 3. 示例

```
feat(api): 统一API响应格式

- 删除所有本地ApiResponse定义
- 统一使用createSuccessResponse和createErrorResponse
- 更新所有路由文件

Closes #123
```

---

## 检查清单

提交代码前请确认：

- [ ] 所有API响应使用 `createSuccessResponse` 或 `createErrorResponse`
- [ ] 所有错误代码使用 `ApiErrorCode` 枚举
- [ ] 没有使用 `any` 类型（特殊情况已注释说明）
- [ ] 没有直接使用 `console.log/error/warn`（使用日志服务）
- [ ] 所有导入使用统一方式
- [ ] 代码已通过 Prettier 格式化
- [ ] 代码已通过 ESLint 检查
- [ ] 提交信息符合规范

---

**文档维护**: 本文档随项目发展持续更新  
**问题反馈**: 发现规范问题请及时更新本文档

