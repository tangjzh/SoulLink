FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

# 复制启动脚本并给执行权限
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# 创建非root用户并设置权限
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["/app/start.sh"] 