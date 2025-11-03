# Novel-Writer 快速启动指南

🚀 **版本**: V1.0 核心功能版本  
📅 **更新**: 2025年11月3日

## ⚡ 快速启动

### 📋 系统要求
- Node.js 18+ 
- npm 或 yarn
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 🏃‍♂️ 一键启动

1. **克隆或下载项目**
   ```bash
   git clone <repository-url>
   cd novel-writer
   ```

2. **安装依赖**
   ```bash
   # 安装后端依赖
   cd backend
   npm install
   
   # 安装前端依赖  
   cd ../frontend
   npm install
   ```

3. **启动应用**
   
   **方式一: 分别启动 (推荐开发)**
   ```bash
   # 终端1: 启动后端
   cd backend
   npm run build
   npm start
   
   # 终端2: 启动前端
   cd frontend  
   npm run dev
   ```
   
   **方式二: 生产模式**
   ```bash
   # 构建前端
   cd frontend
   npm run build
   
   # 启动后端 (会serve前端静态文件)
   cd ../backend
   npm run build  
   npm start
   ```

4. **访问应用**
   - 开发模式: http://localhost:3000
   - 生产模式: http://localhost:5000

## 🎮 功能导览

### 📚 文集管理
- **位置**: 导航栏 → 文集管理
- **功能**: 创建、编辑、删除文集，管理标签
- **用法**: 作为项目的容器，用于组织相关作品

### 📖 项目管理  
- **位置**: 导航栏 → 项目管理
- **功能**: 创建小说项目，设置基本信息，关联文集
- **用法**: 每个小说作品对应一个项目

### ✍️ 写作编辑器
- **位置**: 导航栏 → 写作编辑器
- **功能**: Markdown编辑、实时预览、自动保存
- **快捷键**: 
  - `Ctrl+S`: 手动保存
  - `Ctrl+B`: 粗体
  - `Ctrl+I`: 斜体

### ⚙️ 应用设置
- **位置**: 导航栏 → 设置  
- **功能**: AI助手开关、编辑器配置、界面主题
- **重要**: AI功能需要配置Grok API Key

## 🤖 AI助手使用

### 🔧 配置步骤
1. 获取Grok API Key: https://console.x.ai/
2. 进入设置页面
3. 输入API Key
4. 启用AI助手开关

### 💡 AI功能
- **写作建议**: 续写、改进、创意拓展
- **角色生成**: 基于描述生成详细设定  
- **自定义生成**: 灵活的内容创作

## 📁 数据存储

### 💾 数据位置
```
backend/data/
├── collections.json    # 文集数据
├── projects.json      # 项目数据  
├── chapters.json      # 章节数据
└── workspace.json     # 工作空间配置
```

### 🔒 数据备份
- **手动备份**: 复制整个 `data` 文件夹
- **重要**: 定期备份数据文件夹以防数据丢失

## 🐛 常见问题

### ❓ 应用无法启动
1. 检查Node.js版本 (需要18+)
2. 删除node_modules重新安装依赖
3. 检查端口占用 (5000, 3000)

### ❓ AI功能不工作  
1. 确认已在设置中启用AI助手
2. 检查API Key配置
3. 确认网络连接

### ❓ 数据丢失
1. 检查 `backend/data` 目录是否存在
2. 确认JSON文件格式正确
3. 恢复备份数据

### ❓ 编辑器问题
1. 清除浏览器缓存
2. 检查浏览器控制台错误
3. 尝试刷新页面

## 🔧 开发模式

### 🛠️ 开发环境
```bash
# 后端开发 (支持热重载)
cd backend
npm run dev

# 前端开发 (支持热重载)  
cd frontend
npm run dev
```

### 🏗️ 构建生产版本
```bash
# 构建前端
cd frontend
npm run build

# 编译后端
cd backend  
npm run build
```

## 📊 性能优化

### ⚡ 前端优化
- 使用生产构建 (`npm run build`)
- 启用浏览器缓存
- 考虑CDN加速

### 🚀 后端优化  
- 使用PM2进程管理
- 配置反向代理 (Nginx)
- 启用gzip压缩

## 🔐 安全建议

### 🛡️ 生产部署
- 使用HTTPS
- 配置防火墙
- 定期更新依赖
- 备份数据

### 🔑 API安全
- 妥善保管Grok API Key
- 不要在公共仓库提交API Key
- 考虑环境变量管理

## 📞 支持和反馈

### 🐞 问题报告
- 详细描述问题场景
- 提供错误日志
- 说明复现步骤

### 💡 功能建议
- 描述具体需求
- 说明使用场景  
- 提供界面建议

---

**享受你的创作之旅！** ✨

有任何问题随时查阅此指南或寻求帮助。