#!/bin/bash

echo "�� 启动 SoulLink - 数字灵魂匹配系统"
echo "=================================="

# 启动后端
echo "🚀 启动后端服务..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# 启动前端
echo "🚀 启动前端服务..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ SoulLink 启动成功！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端API: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait
