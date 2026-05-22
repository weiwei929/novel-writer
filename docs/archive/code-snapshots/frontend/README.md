# Frontend 孤儿组件归档

从 `frontend/src` 移出、不参与 TS 编译的历史组件快照。

| 原路径 | 原因 |
|--------|------|
| `components/editor/AIAssistant.tsx` | 无引用；旧版 AI 助手，已被 `writer/AIAssistantPanel` 替代 |
| `components/project/ChapterOutlineView.tsx` | 无引用；章节大纲视图实验组件 |
| `components/writing/WritingAssistant.tsx` | 无引用；旧版写作助手 |
| `pages/EditorPage.tsx` | 无路由注册；已被 `EnhancedEditorPage` 替代 |

恢复时请将文件移回对应 `frontend/src` 路径并修复 API 签名。
