@echo off
echo ================================
echo  Novel-Writer 生产环境部署
echo ================================

:: 检查PM2
echo 检查PM2...
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 安装PM2...
    npm install -g pm2
)

:: 构建项目
echo 构建项目...
npm run build

:: 创建日志目录
if not exist logs mkdir logs

:: 启动服务
echo 启动服务...
pm2 start ecosystem.config.js

:: 显示状态
pm2 status

echo.
echo ================================
echo  部署完成
echo ================================
echo 应用已启动，使用以下命令管理:
echo   pm2 status          - 查看状态
echo   pm2 logs            - 查看日志
echo   pm2 restart all     - 重启服务
echo   pm2 stop all        - 停止服务
echo.

pause