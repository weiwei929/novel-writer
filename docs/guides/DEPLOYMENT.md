# Novel-Writer 部署指南

## 🌐 生产环境部署

### VPS环境要求

**最低配置：**
- CPU: 2核
- 内存: 4GB RAM  
- 存储: 20GB SSD
- 网络: 10Mbps带宽
- 系统: Ubuntu 20.04+ / CentOS 8+

**推荐配置：**
- CPU: 4核
- 内存: 8GB RAM
- 存储: 50GB SSD
- 网络: 100Mbps带宽

### 1. 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装Node.js (可选，用于直接部署)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装FFmpeg (媒体处理)
sudo apt install -y ffmpeg

# 配置防火墙
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. 域名和SSL配置

```bash
# 1. 设置域名DNS A记录指向VPS IP
# 例如: novel-writer.example.com -> 192.168.1.100

# 2. 验证域名解析
dig novel-writer.example.com

# 3. Caddy会自动获取SSL证书，无需手动配置
```

### 3. 项目部署

#### 方式一：Docker部署（推荐）

```bash
# 1. 克隆项目到VPS
git clone <your-repo-url> /opt/novel-writer
cd /opt/novel-writer

# 2. 配置环境变量
cp .env.example .env
vim .env

# 编辑关键配置：
# APP_PASSWORD=<必须设置，否则回落到硬编码默认值>
# DOMAIN=novel-writer.example.com
# HTTPS_EMAIL=your-email@example.com
# NODE_ENV=production
#
# 注意：AI 功能当前已冻结，无需配置 provider API key

# 3. 创建数据目录
sudo mkdir -p /opt/novel-writer/data/{collections,projects,backups,media}
sudo chown -R $USER:$USER /opt/novel-writer/data

# 4. 启动服务
docker-compose up -d --build

# 5. 检查服务状态
docker-compose ps
docker-compose logs -f
```

#### 方式二：直接部署

```bash
# 1. 项目准备
cd /opt/novel-writer

# 2. 安装依赖
npm run install:all

# 3. 构建项目
npm run build

# 4. 使用PM2管理进程
sudo npm install -g pm2

# 5. 启动应用
pm2 start ecosystem.config.js

# 6. 设置开机启动
pm2 startup
pm2 save
```

### 4. Caddy配置

编辑 `deployment/caddy/Caddyfile`：

```caddy
novel-writer.example.com {
    # 自动HTTPS
    tls your-email@example.com
    
    # 安全头
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000"
    }
    
    # API路由
    handle /api/* {
        reverse_proxy localhost:5000
    }
    
    # 静态文件
    handle /* {
        reverse_proxy localhost:3000
    }
}
```

### 5. 数据库初始化

```bash
# 创建初始数据结构
mkdir -p data/{collections,projects,backups,media}
mkdir -p data/projects/sample
mkdir -p data/media/{images,videos}

# 设置权限
chmod 755 data
chmod 644 data/workspace.json
```

### 6. 备份配置

```bash
# 1. 自动备份脚本
cat > /opt/novel-writer/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/novel-writer/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
  /opt/novel-writer/data

# 保留最近30天的备份
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.tar.gz"
EOF

chmod +x /opt/novel-writer/backup.sh

# 2. 添加定时任务
crontab -e

# 添加以下行（每天凌晨3点备份）
0 3 * * * /opt/novel-writer/backup.sh >> /var/log/novel-writer-backup.log 2>&1
```

## 🔒 安全加固

### 1. 系统安全

```bash
# 禁用root登录
sudo vim /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no

# 重启SSH服务
sudo systemctl restart sshd

# 设置fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 2. 应用安全

```bash
# 1. 设置文件权限
chmod 600 .env
chmod 700 data/
chown -R www-data:www-data data/

# 2. 限制API访问（可选）
# 在Caddy配置中添加IP白名单
```

### 3. 数据加密

确保`.env`文件中的`ENCRYPTION_KEY`是随机生成的32字符密钥：

```bash
# 生成加密密钥
openssl rand -hex 16
```

## 📊 监控和维护

### 1. 服务监控

```bash
# 检查服务状态
docker-compose ps
systemctl status docker

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 资源使用情况
docker stats
htop
df -h
```

### 2. 性能监控

```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 监控磁盘空间
df -h /opt/novel-writer/data

# 监控内存使用
free -h

# 网络连接
netstat -tulnp | grep :443
```

### 3. 日志管理

```bash
# 配置日志轮转
sudo vim /etc/logrotate.d/novel-writer

/opt/novel-writer/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    create 644 www-data www-data
}
```

## 🚨 故障排除

### 常见问题

1. **容器启动失败**
```bash
# 查看详细错误
docker-compose logs backend

# 检查端口占用
sudo netstat -tulnp | grep :5000

# 重启服务
docker-compose restart
```

2. **SSL证书问题**
```bash
# 检查域名解析
dig novel-writer.example.com

# 查看Caddy日志
docker-compose logs caddy

# 手动续期证书
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

3. **数据备份问题**
```bash
# 手动创建备份
npm run backup

# 检查备份文件
ls -la data/backups/

# 测试恢复
npm run restore backup_20231103_030000.tar.gz
```

4. **性能问题**
```bash
# 检查资源使用
docker stats

# 清理Docker镜像
docker system prune -a

# 重启服务
docker-compose restart
```

## 📈 扩容升级

### 垂直扩容
```bash
# 增加服务器配置后重启
docker-compose restart

# 调整Docker资源限制
# 编辑docker-compose.yml
```

### 水平扩容
```bash
# 负载均衡配置（nginx/caddy）
# 数据库分离
# CDN配置
```

## 🔄 更新部署

```bash
# 1. 备份当前版本
./backup.sh

# 2. 拉取新代码
git pull origin main

# 3. 重新构建
docker-compose build

# 4. 滚动更新
docker-compose up -d

# 5. 验证更新
curl -f https://novel-writer.example.com/health
```

## 📞 技术支持

如遇到部署问题：

1. 查看系统日志：`journalctl -u docker`
2. 检查应用日志：`docker-compose logs`
3. 验证网络连接：`curl -I https://your-domain.com`
4. 确认防火墙设置：`sudo ufw status`

**紧急恢复：**
```bash
# 从备份恢复
cd /opt/novel-writer
./restore.sh backup_20231103_030000.tar.gz
docker-compose restart
```