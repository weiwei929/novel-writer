@echo off
echo ================================
echo  Novel-Writer 本地开发环境启动
echo ================================

:: 检查Node.js
echo 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 请先安装Node.js 18+
    pause
    exit /b 1
)

:: 检查环境变量文件
if not exist .env (
    echo 警告: .env文件不存在，正在创建...
    copy .env.example .env
    echo 请编辑.env文件，设置GROK_API_KEY后重新运行
    pause
    exit /b 1
)

:: 创建必要目录
echo 创建数据目录...
if not exist data mkdir data
if not exist data\collections mkdir data\collections
if not exist data\projects mkdir data\projects
if not exist data\backups mkdir data\backups
if not exist data\media mkdir data\media
if not exist data\media\images mkdir data\media\images
if not exist data\media\videos mkdir data\media\videos
if not exist logs mkdir logs

:: 检查依赖
echo 检查依赖安装...
if not exist node_modules (
    echo 安装根依赖...
    npm install
)

if not exist frontend\node_modules (
    echo 安装前端依赖...
    cd frontend
    npm install
    cd ..
)

if not exist backend\node_modules (
    echo 安装后端依赖...
    cd backend
    npm install
    cd ..
)

:: 启动开发服务器
echo.
echo ================================
echo  启动开发服务器
echo ================================
echo 前端: http://localhost:3000
echo 后端: http://localhost:5000
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause