#!/bin/bash

# SoulLink 云端部署脚本
echo "🚀 SoulLink 云端部署脚本"

# 配置信息
DOCKER_USERNAME="marcus489"  # 请填入你的Docker Hub用户名
IMAGE_TAG="latest"
FRONTEND_IMAGE="soullink-frontend"
BACKEND_IMAGE="soullink-backend"

# 检查Docker Hub登录状态
check_docker_login() {
    echo "🔍 检查Docker Hub登录状态..."
    if [ -z "$DOCKER_USERNAME" ]; then
        echo "❌ 请在脚本中设置DOCKER_USERNAME变量"
        exit 1
    fi
    
    if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
        echo "🔑 请先登录Docker Hub："
        echo "docker login"
        exit 1
    fi
    echo "✅ Docker Hub已登录"
}

# 构建镜像
build_images() {
    echo "🏗️  构建Docker镜像..."
    
    echo "📦 构建前端镜像..."
    docker build -t $DOCKER_USERNAME/$FRONTEND_IMAGE:$IMAGE_TAG ./frontend
    
    echo "📦 构建后端镜像..."
    docker build -t $DOCKER_USERNAME/$BACKEND_IMAGE:$IMAGE_TAG ./backend
    
    echo "✅ 镜像构建完成"
}

# 推送镜像到Docker Hub
push_images() {
    echo "📤 推送镜像到Docker Hub..."
    
    echo "📤 推送前端镜像..."
    docker push $DOCKER_USERNAME/$FRONTEND_IMAGE:$IMAGE_TAG
    
    echo "📤 推送后端镜像..."
    docker push $DOCKER_USERNAME/$BACKEND_IMAGE:$IMAGE_TAG
    
    echo "✅ 镜像推送完成"
}

# 生成云端docker-compose文件
generate_cloud_compose() {
    echo "📝 生成云端docker-compose文件..."
    
    # 生成标准版本（3.8）
    cat > docker-compose.cloud.yml << EOF
version: '3.8'

services:
  frontend:
    image: $DOCKER_USERNAME/$FRONTEND_IMAGE:$IMAGE_TAG
    container_name: soullink-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf

  backend:
    image: $DOCKER_USERNAME/$BACKEND_IMAGE:$IMAGE_TAG
    container_name: soullink-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./data/soullink.db
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - HOST=0.0.0.0
      - PORT=8000
    volumes:
      - soullink-db:/app/data
      - ./.env:/app/.env

volumes:
  soullink-db:

networks:
  default:
    name: soullink-network
EOF

    echo "✅ 云端docker-compose.yml文件已生成: docker-compose.cloud.yml"
    
    # 生成兼容低版本的compose文件
    cat > docker-compose.legacy.yml << EOF
version: '3.3'

services:
  frontend:
    image: $DOCKER_USERNAME/$FRONTEND_IMAGE:$IMAGE_TAG
    container_name: soullink-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf

  backend:
    image: $DOCKER_USERNAME/$BACKEND_IMAGE:$IMAGE_TAG
    container_name: soullink-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./data/soullink.db
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - HOST=0.0.0.0
      - PORT=8000
    volumes:
      - soullink-db:/app/data
      - ./.env:/app/.env

volumes:
  soullink-db:
EOF

    echo "✅ 兼容版docker-compose文件已生成: docker-compose.legacy.yml"
}

# 生成部署说明
generate_deploy_docs() {
    echo "📚 生成部署说明..."
    
    cat > DEPLOY.md << 'EOF'
# SoulLink 云端部署指南

## 准备工作

1. 购买云服务器（推荐配置：2核4G，Ubuntu 20.04+）
2. 安装Docker和Docker Compose
3. 确保防火墙开放80和8000端口

## 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用用户组更改
exit
```

## 部署步骤

1. **上传部署文件到服务器：**
```bash
# 创建项目目录
mkdir -p ~/soullink
cd ~/soullink

# 上传文件（使用scp或其他方式）
# - docker-compose.cloud.yml
# - nginx.conf
# - .env
```

2. **配置环境变量：**
```bash
# 编辑.env文件
nano .env
```

添加以下内容：
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

3. **启动服务：**
```bash
# 重命名compose文件
mv docker-compose.cloud.yml docker-compose.yml

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

## 访问应用

- 前端：http://你的服务器IP
- 后端API：http://你的服务器IP:8000
- API文档：http://你的服务器IP:8000/docs

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 更新应用
docker-compose pull
docker-compose up -d

# 备份数据
docker run --rm -v soullink_soullink-db:/data -v $(pwd):/backup alpine tar czf /backup/soullink-backup.tar.gz -C /data .

# 恢复数据
docker run --rm -v soullink_soullink-db:/data -v $(pwd):/backup alpine tar xzf /backup/soullink-backup.tar.gz -C /data
```

## 域名配置（可选）

如果你有域名，可以配置nginx反向代理：

1. 安装nginx：`sudo apt install nginx`
2. 配置站点文件：`sudo nano /etc/nginx/sites-available/soullink`
3. 添加SSL证书（推荐使用Let's Encrypt）
EOF

    echo "✅ 部署说明已生成: DEPLOY.md"
}

# 主菜单
main_menu() {
    echo ""
    echo "请选择操作："
    echo "1) 构建并推送镜像到Docker Hub"
    echo "2) 仅构建镜像"
    echo "3) 仅推送镜像"
    echo "4) 生成云端部署文件"
    echo "5) 全部执行（构建+推送+生成文件）"
    echo "6) 退出"
    echo ""
    read -p "请输入选项 (1-6): " choice
    
    case $choice in
        1)
            check_docker_login
            build_images
            push_images
            ;;
        2)
            build_images
            ;;
        3)
            check_docker_login
            push_images
            ;;
        4)
            generate_cloud_compose
            generate_deploy_docs
            ;;
        5)
            check_docker_login
            build_images
            push_images
            generate_cloud_compose
            generate_deploy_docs
            echo ""
            echo "🎉 所有操作完成！"
            echo "📝 请查看 DEPLOY.md 文件了解部署步骤"
            echo "📤 镜像已推送到: https://hub.docker.com/u/$DOCKER_USERNAME"
            ;;
        6)
            echo "👋 退出部署脚本"
            exit 0
            ;;
        *)
            echo "❌ 无效选项，请重新选择"
            main_menu
            ;;
    esac
}

# 执行主程序
main_menu 