# Novel-Writer 小说创作器

## 🚀 项目状态：产品化开发阶段

**重大突破 (2025/11/4)**: 成功解决API路由架构问题，前后端连接完全打通！  
**当前状态**: 稳固的全栈架构基础已建立，进入快速功能迭代阶段

基于AI辅助的个人小说创作工具，支持文集管理、无审查内容生成和媒体补充。

## 🎯 项目概述

Novel-Writer是一个完整的个人创作管理平台，从单篇小说到系列作品的全生命周期管理。采用React + Node.js + Grok API技术栈，支持本地VPS部署，确保隐私和创作自由。

### 📅 最新成就 (2025年11月4日)
- ✅ **API路由系统修复** - 解决Express.js路由冲突，实现前后端稳定连接
- ✅ **开发环境优化** - 前端(3001)和后端(5000)端口稳定运行，支持热重载  
- ✅ **API测试体系** - 完整的接口测试页面 `/api-test` 可用
- ✅ **技术文档体系** - 建立了完善的技术文档和经验总结

## ✨ 核心功能

- 📚 **文集管理**：多项目归类、系列管理、批量操作
- 🤖 **AI辅助创作**：基于Grok API的无审查内容生成
- ✏️ **Markdown编辑**：实时预览、媒体嵌入、交叉引用
- 🎨 **可视化工具**：人物关系图、时间线编辑器
- 🖼️ **媒体处理**：图片视频上传、自动嵌入
- 💾 **数据安全**：本地存储、自动备份、加密保护

## 🚀 快速开始

> 🎉 **V1.0 核心版本已发布！** - [查看里程碑](./MILESTONE-v1.0.md)

### 📋 系统要求
- Node.js 18+
- npm 或 yarn 
- 现代浏览器

### ⚡ 快速启动

```bash
# 1. 克隆项目
git clone <your-repo> && cd novel-writer

# 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 3. 启动应用
# 终端1: 启动后端
cd backend && npm run build && npm start

# 终端2: 启动前端  
cd frontend && npm run dev
```

**访问地址**:
- 前端应用: http://localhost:3000
- 后端API: http://localhost:5000

> 📖 **完整指南**: [QUICK-START.md](./QUICK-START.md) | **里程碑记录**: [MILESTONE-v1.0.md](./MILESTONE-v1.0.md)

### 生产环境部署

```bash
# 1. 构建项目
npm run build

# 2. 本地部署
npm start

# 3. 使用PM2管理进程
npm install -g pm2
pm2 start ecosystem.config.js
```

## 📁 项目结构

```
novel-writer/
├── frontend/          # React前端应用
├── backend/           # Node.js后端服务
├── deployment/        # Docker和Caddy配置
├── docs/              # 项目文档
├── data/              # 数据存储目录
└── README.md
```

## 📖 文档

### 核心文档
- **[📚 文档索引](./docs/INDEX.md)** - 完整文档导航
- **[🚀 快速开始](./QUICKSTART.md)** - 快速启动指南
- **[📋 需求文档](./docs/requirements/小说创作器应用需求文档（优化版）.md)** - 产品需求规格  
- **[🏗️ 技术文档](./docs/architecture/小说创作器应用技术文档（优化版）.md)** - 系统架构设计

### 开发相关  
- **[🏆 技术成就](./docs/development/TECHNICAL_ACHIEVEMENTS.md)** - 重要技术突破
- **[📝 开发日志](./docs/development/DEVELOPMENT_LOG.md)** - 开发过程记录
- **[🔧 API路由修复](./docs/technical/API_ROUTING_FIX.md)** - 技术问题解决案例

## 🛠️ 技术栈

### 前端
- **框架**：React 18 + TypeScript
- **UI库**：Material-UI 5
- **状态管理**：Redux Toolkit
- **编辑器**：Monaco Editor
- **可视化**：React Flow
- **构建**：Vite

### 后端
- **框架**：Express.js + TypeScript
- **AI集成**：Grok API (xAI)
- **文件处理**：Multer + FFmpeg
- **数据存储**：JSON文件 + LowDB
- **安全**：加密存储 + HTTPS

### 部署
- **容器化**：Docker + Docker Compose
- **Web服务器**：Caddy (自动HTTPS)
- **进程管理**：PM2
- **监控**：日志轮转 + 健康检查

## 🔒 隐私和安全

- ✅ 完全本地化部署，无云端数据传输
- ✅ AES加密存储创作内容
- ✅ Grok API仅传输必要提示，不记录敏感信息
- ✅ 自动备份和恢复机制
- ✅ 防火墙和HTTPS安全防护

## 📚 重要文档索引

### 🎯 快速导航
- **[📚 完整文档索引](./docs/INDEX.md)** - 所有文档的详细导航
- **[🚀 快速开始指南](./QUICKSTART.md)** - 5分钟启动项目

### 📋 核心文档
- **[需求规格](./docs/requirements/小说创作器应用需求文档（优化版）.md)** - 产品功能和用户需求
- **[技术架构](./docs/architecture/小说创作器应用技术文档（优化版）.md)** - 系统架构和实现规格  
- **[技术成就](./docs/development/TECHNICAL_ACHIEVEMENTS.md)** - 重要技术突破总结
- **[开发日志](./docs/development/DEVELOPMENT_LOG.md)** - 详细开发进展记录

### 🔗 快速链接  
- **前端应用**: http://localhost:3001
- **API测试页面**: http://localhost:3001/api-test
- **后端健康检查**: http://localhost:5000/health

## 🏆 项目里程碑

**2025年11月4日** - API路由架构修复重大突破  
标志着项目从概念验证阶段正式进入产品化开发阶段，建立了稳固的全栈架构基础。

## �📄 许可证

MIT License - 仅限个人使用，请遵守当地法律法规。

---
**项目状态**: 🚀 产品化开发中  
**最后更新**: 2025年11月4日  
**维护团队**: Novel-Writer开发团队

## 🤝 贡献

这是个人项目，当前不接受外部贡献。

## 📞 联系

如有问题请查看文档或创建Issue。

---

**⚠️ 重要提示**：本应用支持无审查内容生成，用户需自行承担内容责任，确保遵守当地法律法规。