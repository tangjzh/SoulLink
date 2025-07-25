# 🗄️ SoulLink 数据库设置指南

## 📋 快速开始（推荐）

### 使用 SQLite（零配置）

SoulLink 默认使用 SQLite 数据库，无需任何额外安装或配置：

```bash
# 1. 进入后端目录
cd backend

# 2. 安装Python依赖
pip install -r requirements.txt

# 3. 初始化数据库
python init_db.py

# 4. 启动应用
python main.py
```

## 🎯 数据库选项

### 方案1: SQLite（开发环境）✅
- **优点**: 即开即用，无需安装
- **缺点**: 单用户，性能有限
- **适用**: 开发、测试、演示

### 方案2: PostgreSQL（生产环境）
- **优点**: 高性能，多用户，功能丰富
- **缺点**: 需要安装配置
- **适用**: 生产环境

## 🔧 配置说明

### SQLite 配置（默认）

无需任何配置，系统会自动在后端目录创建 `soullink.db` 文件。

### PostgreSQL 配置

如需使用 PostgreSQL，请按以下步骤：

#### 1. 安装 PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
下载并安装 [PostgreSQL官方安装包](https://www.postgresql.org/download/windows/)

#### 2. 创建数据库

```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE soullink;
CREATE USER soullink_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE soullink TO soullink_user;
\q
```

#### 3. 配置环境变量

创建 `backend/.env` 文件：

```env
# PostgreSQL配置
DATABASE_URL=postgresql://soullink_user:your_password@localhost:5432/soullink

# AI服务配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# 其他配置
SECRET_KEY=your-secret-key
DEBUG=true
FRONTEND_URL=http://localhost:3000
```

#### 4. 初始化数据库

```bash
cd backend
python init_db.py
```

## 🚀 启动应用

### 方法1: 分别启动（推荐）

```bash
# 终端1: 启动后端
cd backend
python main.py

# 终端2: 启动前端  
cd frontend
npm install
npm start
```

### 方法2: 使用启动脚本

```bash
# 在项目根目录
chmod +x start.sh
./start.sh
```

## 📊 数据库管理

### 查看SQLite数据库

```bash
# 安装sqlite3工具
sudo apt install sqlite3  # Ubuntu
brew install sqlite3      # macOS

# 查看数据库
cd backend
sqlite3 soullink.db

# SQLite命令
.tables          # 查看所有表
.schema users    # 查看表结构
SELECT * FROM users;  # 查询数据
.quit            # 退出
```

### 查看PostgreSQL数据库

```bash
# 连接数据库
psql -U soullink_user -d soullink -h localhost

# PostgreSQL命令
\dt              # 查看所有表
\d users         # 查看表结构
SELECT * FROM users;  # 查询数据
\q               # 退出
```

## 🔄 数据库重置

### 重置SQLite

```bash
cd backend
rm soullink.db          # 删除数据库文件
python init_db.py       # 重新初始化
```

### 重置PostgreSQL

```bash
# 连接PostgreSQL
sudo -u postgres psql

# 删除并重建数据库
DROP DATABASE soullink;
CREATE DATABASE soullink;
GRANT ALL PRIVILEGES ON DATABASE soullink TO soullink_user;
\q

# 重新初始化
cd backend
python init_db.py
```

## ⚠️ 注意事项

1. **OpenAI API Key**: 必须在 `.env` 文件中设置有效的 OpenAI API 密钥
2. **数据备份**: 生产环境请定期备份数据库
3. **权限设置**: SQLite文件需要适当的读写权限
4. **网络配置**: PostgreSQL需要正确的网络连接配置

## 🐛 常见问题

### Q: SQLite 权限错误
```bash
# 检查文件权限
ls -la soullink.db
# 修改权限
chmod 664 soullink.db
```

### Q: PostgreSQL 连接失败
```bash
# 检查服务状态
sudo systemctl status postgresql
# 启动服务
sudo systemctl start postgresql
```

### Q: 数据库表不存在
```bash
# 重新初始化
python init_db.py
```

## 📞 获取帮助

如果遇到数据库问题，请：
1. 检查错误日志
2. 确认环境配置
3. 查看上述常见问题
4. 提交Issue到GitHub

---

选择最适合你的数据库方案，开始探索 SoulLink 的数字灵魂世界！ 🌐✨ 