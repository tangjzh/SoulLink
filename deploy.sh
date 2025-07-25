#!/bin/bash

# SoulLink 项目部署脚本
echo "🚀 开始部署 SoulLink 项目..."

# 检查是否安装了必要的工具
check_dependencies() {
    echo "🔍 检查依赖工具..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        echo "安装指南: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
        echo "安装指南: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo "✅ 依赖检查完成"
}

# 构建前端
build_frontend() {
    echo "🏗️  构建前端..."
    cd frontend
    
    if [ ! -f "package.json" ]; then
        echo "❌ 前端目录不正确，请在项目根目录运行此脚本"
        exit 1
    fi
    
    echo "📦 更新前端依赖..."
    # 删除package-lock.json并重新安装，解决版本不同步问题
    rm -f package-lock.json
    npm install
    
    echo "🔨 构建前端应用..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ 前端构建完成"
    else
        echo "❌ 前端构建失败"
        exit 1
    fi
    
    cd ..
}

# 准备环境变量
setup_env() {
    echo "⚙️  设置环境变量..."
    
    if [ ! -f "backend/.env" ]; then
        echo "📝 创建后端环境变量文件..."
        cat > backend/.env << EOF
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 数据库配置
DATABASE_URL=sqlite:///./soullink.db

# 服务器配置
HOST=0.0.0.0
PORT=8000
DEBUG=false

# 前端URL配置
FRONTEND_URL=http://localhost
EOF
        echo "⚠️  请编辑 backend/.env 文件，设置你的 OpenAI API Key"
        echo "   获取API Key: https://platform.openai.com/api-keys"
    fi
    
    if [ ! -f ".env" ]; then
        echo "📝 创建Docker环境变量文件..."
        cat > .env << EOF
# OpenAI API Key (请替换为你的实际API Key)
OPENAI_API_KEY=your_openai_api_key_here
EOF
        echo "⚠️  请编辑 .env 文件，设置你的 OpenAI API Key"
    fi
}

# 更新nginx配置
update_nginx_config() {
    echo "🔧 更新nginx配置..."
    
    # 获取前端build目录的绝对路径
    BUILD_PATH=$(pwd)/frontend/build
    
    # 更新nginx.conf中的路径
    sed -i "s|/path/to/your/frontend/build|/usr/share/nginx/html|g" nginx.conf
    
    echo "✅ Nginx配置更新完成"
}

# 使用Docker部署
deploy_with_docker() {
    echo "🐳 使用Docker部署..."
    
    # 停止已有的容器
    echo "🛑 停止已有容器..."
    docker-compose down
    
    # 构建并启动服务
    echo "🚀 启动服务..."
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        echo "✅ 部署成功！"
        echo ""
        echo "🌐 访问地址:"
        echo "   前端: http://localhost:8080"
        echo "   后端API: http://localhost:8000"
        echo "   API文档: http://localhost:8000/docs"
        echo ""
        echo "📊 查看运行状态:"
        echo "   docker-compose ps"
        echo ""
        echo "📋 查看日志:"
        echo "   docker-compose logs -f"
    else
        echo "❌ 部署失败，请检查错误信息"
        exit 1
    fi
}

# 直接nginx部署（可选方案）
deploy_with_nginx() {
    echo "🌐 使用直接nginx部署..."
    
    # 检查nginx是否安装
    if ! command -v nginx &> /dev/null; then
        echo "❌ Nginx 未安装，请先安装nginx或使用Docker部署"
        echo "Ubuntu/Debian: sudo apt-get install nginx"
        echo "CentOS/RHEL: sudo yum install nginx"
        return 1
    fi
    
    # 获取前端build目录的绝对路径
    BUILD_PATH=$(pwd)/frontend/build
    
    # 更新nginx配置中的路径
    sed -i "s|/path/to/your/frontend/build|$BUILD_PATH|g" nginx.conf
    
    echo "📝 Nginx配置文件已生成: nginx.conf"
    echo "请手动将此配置复制到nginx配置目录，例如:"
    echo "sudo cp nginx.conf /etc/nginx/sites-available/soullink"
    echo "sudo ln -s /etc/nginx/sites-available/soullink /etc/nginx/sites-enabled/"
    echo "sudo nginx -t && sudo systemctl reload nginx"
}

# 主菜单
main_menu() {
    echo ""
    echo "请选择部署方式:"
    echo "1) Docker部署 (推荐)"
    echo "2) 直接Nginx部署"
    echo "3) 仅构建前端"
    echo "4) 退出"
    echo ""
    read -p "请输入选项 (1-4): " choice
    
    case $choice in
        1)
            # check_dependencies
            setup_env
            update_nginx_config
            deploy_with_docker
            ;;
        2)
            build_frontend
            setup_env
            deploy_with_nginx
            ;;
        3)
            build_frontend
            echo "✅ 前端构建完成，build文件在 frontend/build 目录"
            ;;
        4)
            echo "👋 退出部署"
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