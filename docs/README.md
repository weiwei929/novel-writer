# 📚 Novel Writer 文档

欢迎查阅 Novel Writer 的文档！本目录包含项目的所有技术文档、指南和规格说明。

---

## 🚀 快速导航

### 新手入门
1. **[项目概述](../README.md)** - 了解 Novel Writer 是什么
2. **[快速开始](./guides/QUICK_START.md)** - 5 分钟运行项目
3. **[开发指南](./DEVELOPMENT.md)** - 开始开发

### 深入了解
1. **[架构说明](./ARCHITECTURE.md)** - 理解系统设计
2. **[AI 功能规格](./specs/AI_FEATURES_SPECIFICATION.md)** - 了解 AI 能力
3. **[编码规范](./guides/CODING_STANDARDS.md)** - 保持代码质量

---

## 📁 文档结构

```
docs/
├── INDEX.md                    # 📋 文档索引（详细导航）
├── README.md                   # 📚 本文件
├── ARCHITECTURE.md             # 🏗️ 架构说明
├── DEVELOPMENT.md              # 💻 开发指南
├── README_FOR_CURSOR.md        # 🤖 Cursor AI 指南
├── guides/                     # 📖 详细指南
│   ├── DEPLOYMENT.md           # 部署指南
│   ├── CODING_STANDARDS.md     # 编码规范
│   ├── QUICK_START.md          # 快速开始
│   └── TESTING_SETUP.md        # 测试设置
├── specs/                      # 📐 规格说明
│   └── AI_FEATURES_SPECIFICATION.md
├── thinklogs/                  # 💭 开发随笔
│   ├── 2025-12-15_Thinklog_Architecture_Calibration.md
│   └── 2025-12-24_Thinklog_From_Review_to_Rebirth.md
└── archive/                    # 📦 归档文档
    ├── evaluations/            # 评估报告
    ├── plans/                  # 历史计划
    └── presentations/          # 演示文档
```

---

## 📖 核心文档

### [INDEX.md](./INDEX.md)
完整的文档索引，包含所有文档的链接和说明。

### [ARCHITECTURE.md](./ARCHITECTURE.md)
系统架构、技术栈、设计决策的详细说明。

### [DEVELOPMENT.md](./DEVELOPMENT.md)
开发环境设置、工作流程、最佳实践。

### [README_FOR_CURSOR.md](./README_FOR_CURSOR.md)
为 Cursor AI 准备的项目说明，包含项目结构、技术栈、开发规范。

---

## 📚 详细指南

位于 `guides/` 目录：

- **[DEPLOYMENT.md](./guides/DEPLOYMENT.md)** - 生产环境部署、配置、维护
- **[CODING_STANDARDS.md](./guides/CODING_STANDARDS.md)** - 代码风格、命名约定
- **[QUICK_START.md](./guides/QUICK_START.md)** - 5 分钟快速上手
- **[TESTING_SETUP.md](./guides/TESTING_SETUP.md)** - 测试环境和策略

---

## 📐 规格说明

位于 `specs/` 目录：

- **[AI_FEATURES_SPECIFICATION.md](./specs/AI_FEATURES_SPECIFICATION.md)** - AI 辅助功能的完整规格说明，包括上下文管理、核心功能、API 端点等

---

## 💭 开发随笔

位于 `thinklogs/` 目录，记录开发过程中的思考、决策和经验：

- **[2025-12-15: 架构的自我校准](./thinklogs/2025-12-15_Thinklog_Architecture_Calibration.md)**
- **[2025-12-24: 从审查到重生](./thinklogs/2025-12-24_Thinklog_From_Review_to_Rebirth.md)**

---

## 📦 归档文档

位于 `archive/` 目录，包含历史文档、评估报告、计划文档等：

- `evaluations/` - AI 功能复盘、系统审查、优化建议
- `plans/` - 历史实施计划、审查指南
- `presentations/` - 应用介绍、功能演示

---

## 🔍 查找文档

### 按主题查找
- **架构和设计**: `ARCHITECTURE.md`, `specs/`
- **开发和贡献**: `DEVELOPMENT.md`, `guides/CODING_STANDARDS.md`
- **部署和运维**: `guides/DEPLOYMENT.md`
- **AI 功能**: `specs/AI_FEATURES_SPECIFICATION.md`

### 按角色查找
- **新手**: `../README.md`, `guides/QUICK_START.md`
- **开发者**: `DEVELOPMENT.md`, `guides/CODING_STANDARDS.md`
- **运维**: `guides/DEPLOYMENT.md`
- **AI 协作**: `README_FOR_CURSOR.md`

---

## 📝 文档维护

### 更新文档
- 修改文档后，请更新 `INDEX.md` 中的相关链接
- 重大变更请在 `thinklogs/` 中记录决策过程
- 过时文档请移动到 `archive/` 目录

### 文档规范
- 使用 Markdown 格式
- 包含清晰的标题和目录
- 代码示例使用代码块
- 重要信息使用引用或提示框

---

**文档最后更新**: 2025-12-24
