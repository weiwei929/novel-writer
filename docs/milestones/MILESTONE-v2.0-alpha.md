# 🏁 里程碑: V2.0-Alpha 奠基
> **日期**: 2025-12-13
> **状态**: Productive Alpha (高产出的 Alpha 版)
> **标签**: `v2.0-alpha-foundation`

## 📋 概览

**Novel-Writer** 完成了从纯本地原型到具有稳健架构的 Web 应用的转型。本阶段固化了核心数据结构（Prisma Json）、API 类型安全（Zod Schema）和基础 UI 体验（看板、编辑器）。

## 🏗️ 技术栈状态

| 组件 | 技术 | 版本 / 状态 |
| :--- | :--- | :--- |
| **前端** | React 18 + Vite | 稳定，TypeScript 严格模式 |
| **后端** | Fastify + Prisma | 稳定，原生支持 `Json` 类型 |
| **数据库** | SQLite | Schema v2.0 (原生 JSON) |
| **API** | REST (Axios) | v2 路由 (`/api/v2/*`) |
| **AI** | 模拟服务 (Mock Service) | 准备好集成真实 Provider |

## 📦 已交付核心功能

1.  **看板项目管理 (Kanban)**
    *   动态三列看板（📥 已导入、✒️ 创作中、✅ 已完结）。
    *   支持拖拽操作（通过模拟或按钮）。
    *   状态流转逻辑完全实现。

2.  **创作引擎**
    *   项目/章节的增删改查及关联元数据。
    *   带有标签系统的文集管理。
    *   Monaco 编辑器集成（基础版）。

3.  **AI 基础设施**
    *   定义了 `AIService` 接口。
    *   实现了前端 `AIAssistant` UI 组件（写作建议、角色生成、自定义）。
    *   激活了 Mock 提供商用于功能演示。

## ⚠️ 已知问题

1.  **认证**: 硬编码密码 "novel2024"（不安全，但为第一阶段有意为之）。
2.  **类型**: 复杂前端组件中残留少量 `any` 类型（低优先级，不影响运行）。
3.  **测试**: 自动化测试套件极简；目前依赖手动冒烟测试。

## 🔮 下一阶段

**Phase 2.2: AI 深度规划师 (AI Deep Planner)**
重点实现以下实际 AI 逻辑：
*   深度故事规划（大纲生成）。
*   角色弧光映射 (Character Arc mapping)。
*   场景拆解 (Scene breakdown)。
