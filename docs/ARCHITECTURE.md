# 系统架构与业务逻辑流程 (System Architecture)

本文档详细说明了 **Novel Writer** 小说创作应用的系统技术架构及核心业务流程。

## 1. 高层系统架构 (High-Level Architecture)

本系统采用现代化的 **B/S 架构 (Client-Server)**，实现 React 前端与 Fastify 后端的分离。

```mermaid
graph TD
    User["用户 / 浏览器"]
    
    subgraph Frontend ["前端 (React + Vite)"]
        Router["React Router 路由"]
        Pages["页面 (文集, 编辑器, 导入)"]
        Services["API 服务 (Axios)"]
        
        User --> Router
        Router --> Pages
        Pages --> Services
    end
    
    subgraph Backend ["后端 (Fastify + Prisma)"]
        API["API 路由接口 (/api/v2/*)"]
        Controllers["业务逻辑控制器"]
        Prisma["Prisma ORM 层"]
        
        Services -- "JSON / HTTP 请求" --> API
        API --> Controllers
        Controllers --> Prisma
    end
    
    subgraph Database ["数据存储"]
        SQLite[("SQLite 数据库")]
        Prisma -- "SQL 查询" --> SQLite
    end
```

## 2. 统一创作心流 (Unified User Flow)

无论通过“外部导入”还是“从零创造”，用户最终都将汇聚于统一的创作心流中。

```mermaid
stateDiagram-v2
    direction LR
    
    state "入口选择 (Entry)" as Entry {
        [*] --> Import: "外部导入 (Smart Import)"
        [*] --> Create: "从零创造 (New Project)"
    }
    
    state "项目初始化 (Init)" as Init {
        Import --> ProjectReady: "清洗 & 结构化"
        Create --> MetaGen: "填写元数据"
        MetaGen --> AI_Plan: "AI 辅助规划 (可选)"
        AI_Plan --> ProjectReady: "生成章节架构"
    }

    state "核心创作循环 (Writing Loop)" as Loop {
        ProjectReady --> Editor: "进入编辑器"
        Editor --> AI_Write: "AI 续写/扩写"
        AI_Write --> Editor
        Editor --> Draft: "保存草稿"
        Draft --> Editor: "修改/润色"
    }

    state "定稿与输出 (Finalize)" as Final {
        Draft --> AI_Review: "AI 深度审校 (错别字/逻辑/点评)"
        AI_Review --> FinalVersion: "确认定稿"
        FinalVersion --> Archive: "归入完成文集"
        FinalVersion --> Export: "导出 (Markdown/EPUB)"
    }
```

## 3. AI 全生命周期介入 (AI Integration Lifecycle)

AI 不仅仅是打字机，而是贯穿创作全流程的合作伙伴。

*   **规划期 (Planning)**:
    *   **伴侣模式**: 在创建项目时，根据简单的“一句话灵感”，AI 协助扩展世界观、人物小传和章节大纲。
*   **写作期 (Writing)**:
    *   **助手模式**: 续写卡文处、生成环境描写、优化对话对白。
*   **审校期 (Reviewing)**:
    *   **编辑模式**: 在定稿前，AI 扮演“严厉编辑”，检查时间线冲突、人物性格OOC（角色崩坏）、错别字及行文节奏。

## 4. 文集管理策略 (Collection Strategy)

采用 **“三列看板 (Kanban)”** + **“标签系统 (Tags)”** 结合的视觉化管理。

| 看板泳道 (Kanban Column) | 对应状态 (Status) | 交互行为 (Interaction) |
| :--- | :--- | :--- |
| **外部导入 (Imported)** | `imported` | **黄色卡片**。来自 Smart Import 的素材暂存区，点击“开始创作”可移动至下一阶段。 |
| **原创构思 (Original)** | `draft` / `writing` | **蓝色卡片**。核心创作区。支持 `#标签` 筛选（如 `#玄幻` `#大女主`）。点击“完成”移动至归档。 |
| **完结归档 (Completed)** | `completed` | **绿色卡片**。荣誉殿堂。支持一键导出 Markdown。**支持“返回修改”**（回退到原创构思列）。 |

## 5. 项目功能思维导图 (Project Mind Map)

```mermaid
mindmap
  root(("Novel Writer 小说创作器"))
    FE["前端 (React + Vite)"]
      Pages["页面 (Pages)"]
        Dash["文集看板 (三列布局)"]
        Editor["沉浸式编辑器"]
        ImpExp["导入 / 导出"]
      Comps["组件 (Components)"]
        AI_Chat["AI 对话控制台 (Socratic Chat)"]
        TagSys["标签筛选条"]
        RichText["富文本核心"]
    BE["后端 (Fastify + Prisma)"]
      Services["核心服务"]
        ProjSvc["项目全生命周期管理"]
        AISvc["AI 编排引擎 (llm)"]
        FileSvc["文件处理 (Import/Export)"]
      DB["数据库 (SQLite)"]
        Project["项目 (含 Tags & MasterPrompt)"]
        Chapters["章节"]
        Tags["标签 JSON"]
    Feat["核心特性"]
      Unified["统一创作流"]
      LocalFirst["本地优先 (Privacy)"]
      AILifecycle["AI 全程伴随"]
        Plan["规划: 苏格拉底式引导"]
        Write["写作: 影子模式生成"]
        Review["审校: 深度报告"]
```
