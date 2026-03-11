# Docker 部署指南

## 快速开始

### 方法 1: 使用构建脚本（推荐）

```bash
# 运行交互式构建脚本
./docker-build.sh
```

脚本会引导你完成：
1. 选择镜像仓库（默认 docker.io）
2. 设置镜像名称（默认 kiro-rs）
3. 输入 Docker Hub 用户名（可选）
4. 是否启用敏感日志（默认否）
5. 是否推送到远程仓库

### 方法 2: 手动构建

```bash
# 构建镜像（当前版本 + latest）
docker build -t kiro-rs:1.1.5 -t kiro-rs:latest .

# 构建并启用敏感日志（仅用于排障）
docker build --build-arg ENABLE_SENSITIVE_LOGS=true -t kiro-rs:1.1.5 .
```

## 推送到 Docker Hub

### 1. 登录 Docker Hub

```bash
docker login
```

### 2. 标记镜像

```bash
# 替换 username 为你的 Docker Hub 用户名
docker tag kiro-rs:1.1.5 username/kiro-rs:1.1.5
docker tag kiro-rs:latest username/kiro-rs:latest
```

### 3. 推送镜像

```bash
docker push username/kiro-rs:1.1.5
docker push username/kiro-rs:latest
```

## 推送到其他镜像仓库

### 阿里云容器镜像服务

```bash
# 登录
docker login --username=your-username registry.cn-hangzhou.aliyuncs.com

# 标记
docker tag kiro-rs:1.1.5 registry.cn-hangzhou.aliyuncs.com/namespace/kiro-rs:1.1.5

# 推送
docker push registry.cn-hangzhou.aliyuncs.com/namespace/kiro-rs:1.1.5
```

### GitHub Container Registry

```bash
# 登录（使用 Personal Access Token）
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 标记
docker tag kiro-rs:1.1.5 ghcr.io/username/kiro-rs:1.1.5

# 推送
docker push ghcr.io/username/kiro-rs:1.1.5
```

## 运行容器

### 基础运行

```bash
docker run -d \
  --name kiro-rs \
  -p 8990:8990 \
  -v $(pwd)/config:/app/config \
  kiro-rs:latest
```

### 完整配置

```bash
docker run -d \
  --name kiro-rs \
  --restart unless-stopped \
  -p 8990:8990 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/data:/app/data \
  -e RUST_LOG=info \
  -e TZ=Asia/Shanghai \
  kiro-rs:latest
```

### 使用 docker-compose

```bash
# 复制示例配置
cp docker-compose.example.yml docker-compose.yml

# 编辑配置（修改镜像地址等）
vim docker-compose.yml

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 配置文件准备

在运行容器前，需要准备配置文件：

```bash
# 创建配置目录
mkdir -p config

# 复制示例配置
cp config.example.json config/config.json
cp credentials.example.social.json config/credentials.json

# 编辑配置
vim config/config.json
vim config/credentials.json
```

## 常用命令

```bash
# 查看容器日志
docker logs -f kiro-rs

# 进入容器
docker exec -it kiro-rs sh

# 重启容器
docker restart kiro-rs

# 停止容器
docker stop kiro-rs

# 删除容器
docker rm kiro-rs

# 查看容器状态
docker ps -a | grep kiro-rs

# 查看镜像
docker images | grep kiro-rs
```

## 镜像大小优化

当前 Dockerfile 已经使用了多阶段构建和 Alpine Linux，镜像大小约 20-30MB。

如果需要进一步优化：

```dockerfile
# 在 Dockerfile 的 builder 阶段添加
RUN cargo build --release && \
    strip target/release/kiro-rs
```

## 健康检查

容器内置健康检查，检查 HTTP 端口是否可访问：

```bash
# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' kiro-rs

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' kiro-rs | jq
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker logs kiro-rs

# 检查配置文件是否存在
docker exec kiro-rs ls -la /app/config/

# 检查配置文件内容
docker exec kiro-rs cat /app/config/config.json
```

### 启用敏感日志排障

```bash
# 重新构建镜像（启用敏感日志）
docker build --build-arg ENABLE_SENSITIVE_LOGS=true -t kiro-rs:debug .

# 运行调试版本
docker run -d \
  --name kiro-rs-debug \
  -p 8990:8990 \
  -v $(pwd)/config:/app/config \
  -e RUST_LOG=debug \
  kiro-rs:debug
```

### 网络问题

```bash
# 检查端口映射
docker port kiro-rs

# 测试容器内网络
docker exec kiro-rs wget -O- http://localhost:8990/

# 检查防火墙
sudo ufw status
```

## 更新镜像

```bash
# 拉取最新镜像
docker pull username/kiro-rs:latest

# 停止并删除旧容器
docker stop kiro-rs
docker rm kiro-rs

# 启动新容器
docker run -d \
  --name kiro-rs \
  -p 8990:8990 \
  -v $(pwd)/config:/app/config \
  username/kiro-rs:latest
```

## 备份与恢复

### 备份配置

```bash
# 备份配置目录
tar -czf kiro-config-backup-$(date +%Y%m%d).tar.gz config/

# 备份数据目录（如果有）
tar -czf kiro-data-backup-$(date +%Y%m%d).tar.gz data/
```

### 恢复配置

```bash
# 解压备份
tar -xzf kiro-config-backup-20240101.tar.gz

# 重启容器
docker restart kiro-rs
```

## 生产环境建议

1. **使用固定版本标签**：避免使用 `latest`，使用具体版本号如 `1.1.5`
2. **配置资源限制**：使用 `--memory` 和 `--cpus` 限制资源使用
3. **启用自动重启**：使用 `--restart unless-stopped`
4. **定期备份配置**：定期备份 `config/` 和 `data/` 目录
5. **监控日志**：使用日志收集工具（如 ELK、Loki）
6. **反向代理**：使用 Nginx/Caddy 作为反向代理，启用 HTTPS
7. **健康检查**：配置健康检查和告警

## 安全建议

1. **不要在镜像中包含敏感信息**：配置文件通过 volume 挂载
2. **使用非 root 用户运行**（当前 Dockerfile 已使用 Alpine 默认用户）
3. **定期更新基础镜像**：及时更新 Rust 和 Alpine 版本
4. **扫描镜像漏洞**：使用 `docker scan` 或 Trivy 扫描
5. **限制容器权限**：使用 `--read-only` 和 `--cap-drop`

## 参考链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Rust Docker 最佳实践](https://docs.docker.com/language/rust/)
