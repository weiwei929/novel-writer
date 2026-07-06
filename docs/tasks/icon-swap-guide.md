# 图标替换指南 — lucide → 定制图标集

> 用途：将全应用 lucide-react 图标替换为定制的 `IconSet`。
> 新图标集位于 `frontend/src/components/ui/icons.tsx`，共 50 个图标。
> 风格：暖调 + 文学感 + 精工细节。

---

## 操作说明

### 1. 导入方式

```typescript
// 替换前
import { Lightbulb, ClipboardList, PenSquare } from 'lucide-react'

// 替换后
import { IconCreative, IconPlanning, IconWriting } from '../components/ui/icons'
```

> 新图标组件名以 `Icon` 开头，Props 接口兼容 lucide（`size` / `className`），额外支持 `accentFill` 双色。

### 2. 替换映射表

#### 导航 & 全局图标（Layout.tsx）

| lucide 图标 | 替换为 | 位置 |
|-------------|--------|------|
| `Lightbulb` | `IconCreative` | 创意组 |
| `ClipboardList` | `IconPlanning` | 企划课 |
| `PenSquare` / `PenLine` | `IconWriting` | 创作室 |
| `Search` / `ClipboardCheck` | `IconReview` | 编审部 |
| `Archive` / `Library` | `IconLibrary` | 文集库 |
| `BarChart3` | `IconStats` | 数据统计 |
| `Settings` | `IconSettings` | 系统设置 |
| `Archive`（第二个） | `IconShelf` | 暂存阁 |
| `Feather` | `IconFeather` | 品牌 Logo |

#### 通用操作图标（全应用）

| lucide | 替换为 | 说明 |
|--------|--------|------|
| `Plus` | `IconPlus` | 新建/添加 |
| `X` | `IconClose` | 关闭 |
| `ArrowLeft` | `IconArrowLeft` | 返回 |
| `ArrowRight` | `IconArrowRight` | 前进 |
| `ArrowUp` / `ArrowDown` | `IconArrowUp` / `IconArrowDown` | 排序 |
| `Save` | `IconSave` | 保存 |
| `Edit` / `Edit2` / `Edit3` / `Pencil` | `IconEdit` | 编辑 |
| `Trash2` | `IconDelete` | 删除 |
| `Search` | `IconSearch` | 搜索 |
| `User` / `Users` | `IconUser` | 用户 |
| `FileText` | `IconFile` | 文档 |
| `Eye` | `IconEye` | 查看 |
| `EyeOff` | `IconEyeOff` | 隐藏 |
| `Download` | `IconDownload` | 下载 |
| `Upload` | `IconUpload` | 上传 |
| `Check` | `IconCheck` | 勾选 |
| `CheckCheck` | `IconCheckCheck` | 双勾 |
| `AlertTriangle` | `IconAlert` | 警告 |
| `AlertCircle` | `IconInfo` | 信息 |
| `Info` | `IconInfo` | 信息 |
| `Home` | `IconHome` | 首页 |
| `Sparkles` | `IconSparkles` | AI 火花 |
| `Bot` | `IconBot` | AI 机器人 |
| `Loader` / `Loader2` | `IconLoading` | 加载（自带旋转动画） |
| `Menu` | `IconMenu` | 菜单 |
| `FolderOpen` | `IconFolder` | 文件夹 |
| `Calendar` | `IconCalendar` | 日历 |
| `Grip` / `GripVertical` | `IconDrag` | 拖拽手柄 |
| `BookOpen` / `BookMarked` | `IconBookOpen` | 打开的书 |
| `Tag` / `Tags` | `IconTag` | 标签 |
| `List` / `LayoutList` | `IconList` | 列表视图 |
| `LayoutGrid` / `Grid` | `IconGrid` | 卡片视图 |
| `MoveRight` | `IconMoveRight` | 流转/移动 |
| `PenTool` | `IconPenTool` | 笔工具 |
| `Send` | `IconSend` | 发送 |
| `RefreshCw` | `IconRefresh` | 刷新 |
| `Star` | `IconStar` | 星标 |
| `Copy` | `IconCopy` | 复制 |
| `ExternalLink` / `Link` | `IconExternalLink` | 外部链接 |
| `Maximize2` | `IconMaximize` | 全屏 |
| `Minimize2` | `IconMinimize` | 退出全屏 |
| `Palette` | `IconPalette` | 调色板 |
| `CheckCircle` / `CheckCircle2` | `IconCheckCircle` | 完成标记 |
| `Lock` | `IconLock` | 锁定 |
| `Inbox` | `IconShelf` | 暂存/收件 |
| `Play` | `IconArrowRight` | 播放/进入 |

### 3. 需要替换的文件列表

按优先级排列：

| 优先级 | 文件 | 改动量 |
|--------|------|--------|
| P0 | `Layout.tsx` | ~8 个图标，最显眼 |
| P1 | `WorkDetailPage.tsx` | ~5 个 |
| P1 | `KanbanBoard.tsx` | ~3 个 |
| P1 | `ProjectCard.tsx` | ~10 个 |
| P2 | 其余文件 | 逐个替换 |

### 4. 验证

```bash
cd frontend && npx tsc --noEmit
```
