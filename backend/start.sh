#!/bin/bash

echo "🚀 SoulLink 容器启动中..."

# 检查数据目录
mkdir -p /app/data

# 检查数据库是否需要初始化
if [ ! -f "/app/data/soullink.db" ] || [ ! -s "/app/data/soullink.db" ]; then
    echo "📊 初始化数据库..."
    rm -f /app/data/soullink.db  # 删除空文件
    python init_db.py
else
    # 检查表是否存在
    if ! python -c "
from models.database import SessionLocal, engine
from sqlalchemy import inspect
db = SessionLocal()
inspector = inspect(db.get_bind())
tables = inspector.get_table_names()
db.close()
exit(0 if 'users' in tables else 1)
" 2>/dev/null; then
        echo "📊 表结构不完整，重新初始化数据库..."
        rm -f /app/data/soullink.db
        python init_db.py
    else
        echo "📊 数据库已存在且完整，跳过初始化"
    fi
fi

# 启动应用
echo "🌐 启动SoulLink API服务..."
exec python main.py 