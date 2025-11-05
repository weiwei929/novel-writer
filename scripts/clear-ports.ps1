# Novel-Writer 端口清理脚本
# 用于清理开发环境中被占用的端口

Write-Host "小说创作器 - 端口清理工具" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# 定义需要清理的端口
$ports = @(3000, 3001, 5000, 5001)

foreach ($port in $ports) {
    Write-Host "检查端口 $port..." -ForegroundColor Yellow
    
    try {
        # 查找占用端口的进程
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        
        if ($connections) {
            foreach ($connection in $connections) {
                $processId = $connection.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                
                if ($process) {
                    Write-Host "  发现进程: $($process.ProcessName) (PID: $processId)" -ForegroundColor Red
                    
                    # 询问是否终止进程
                    $choice = Read-Host "  是否终止此进程? (y/N)"
                    
                    if ($choice -eq 'y' -or $choice -eq 'Y') {
                        try {
                            Stop-Process -Id $processId -Force
                            Write-Host "  ✓ 进程已终止" -ForegroundColor Green
                        }
                        catch {
                            Write-Host "  ✗ 无法终止进程: $($_.Exception.Message)" -ForegroundColor Red
                        }
                    }
                    else {
                        Write-Host "  ○ 跳过此进程" -ForegroundColor Gray
                    }
                }
            }
        }
        else {
            Write-Host "  ✓ 端口 $port 未被占用" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ✗ 检查端口时出错: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "端口清理完成!" -ForegroundColor Cyan

# 显示当前端口使用情况
Write-Host ""
Write-Host "当前端口状态:" -ForegroundColor Yellow
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "  端口 $port : 占用中" -ForegroundColor Red
    }
    else {
        Write-Host "  端口 $port : 空闲" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "提示: 现在可以启动开发服务了" -ForegroundColor Cyan
Write-Host "  后端: cd backend; npm run dev" -ForegroundColor Gray  
Write-Host "  前端: cd frontend; npm run dev" -ForegroundColor Gray