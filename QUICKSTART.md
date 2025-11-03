# Novel-Writer 本地开发快速启动指南

## 🚀 5分钟快速启动

### 第一步：环境检查 ✅
确保已安装 Node.js 18+：
```bash
node --version  # 应该显示 v18.x.x 或更高版本
```

### 第二步：项目配置 ⚙️
1. **复制环境变量文件**
```bash
copy .env.example .env
```

2. **编辑 .env 文件，设置必需配置**
```
GROK_API_KEY=your_actual_grok_api_key_here
```
> ⚠️ **重要**：必须设置真实的 Grok API Key 才能使用AI功能

### 第三步：一键启动 🎯

**Windows用户：**
```bash
# 双击运行启动脚本
start-dev.bat
```

**或手动启动：**
```bash
# 安装所有依赖
npm run install:all

# 启动开发服务器
npm run dev
```

### 访问应用 🌐
- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:5000  
- **健康检查**: http://localhost:5000/health

## 📋 开发命令速查

```bash
# 开发环境
npm run dev              # 同时启动前后端
npm run dev:frontend     # 只启动前端
npm run dev:backend      # 只启动后端

# 构建
npm run build            # 构建整个项目
npm run build:frontend   # 构建前端
npm run build:backend    # 构建后端

# 生产环境
npm start               # 启动生产服务器 (需要先构建)
start-prod.bat          # Windows一键生产部署

# 项目维护
npm run clean           # 清理依赖和构建文件
npm run lint            # 代码格式检查
npm run test            # 运行测试
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
```bash
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# 修改端口 (在.env文件中)
PORT=5001
FRONTEND_PORT=3001
```

2. **依赖安装失败**
```bash
# 清理缓存重新安装
npm cache clean --force
npm run clean
npm run install:all
```

3. **Grok API调用失败**
```bash
# 验证API密钥设置
echo %GROK_API_KEY%

# 测试网络连接
curl https://api.x.ai/v1/models
```

4. **TypeScript编译错误**
```bash
# 前端类型检查
cd frontend && npm run type-check

# 后端类型检查  
cd backend && npm run build
```

## 📁 项目目录说明

```
novel-writer/
├── frontend/           # React前端 (端口3000)
├── backend/            # Node.js后端 (端口5000)  
├── data/              # 数据存储目录
├── logs/              # 日志文件
├── start-dev.bat      # 开发环境启动脚本
└── start-prod.bat     # 生产环境启动脚本
```

## 🎯 开发流程

1. **启动开发环境**: `npm run dev`
2. **访问前端**: http://localhost:3000
3. **开发功能**: 编辑 `frontend/src` 或 `backend/src`
4. **热重载**: 保存文件自动刷新
5. **测试功能**: 浏览器查看效果
6. **构建部署**: `npm run build && npm start`

## 🔄 下一步

1. **熟悉项目结构**: 查看 `docs/DEVELOPMENT.md`
2. **阅读技术文档**: 了解详细的功能设计
3. **开始编码**: 从文集管理功能开始实现

---
🎉 **恭喜！Novel-Writer 开发环境已就绪，开始您的创作工具开发之旅吧！**