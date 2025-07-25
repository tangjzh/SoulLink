# SoulLink 环境配置说明

## 后端环境变量配置

在 `backend/` 目录下创建 `.env` 文件，包含以下配置：

```env
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# JWT安全密钥（生产环境请使用随机生成的强密钥）
SECRET_KEY=your-secret-key-here-change-in-production

# 数据库配置（可选，默认使用SQLite）
# DATABASE_URL=postgresql://username:password@localhost:5432/soullink
# 或者保持空白使用SQLite: DATABASE_URL=

# 服务器配置
HOST=0.0.0.0
PORT=8000
DEBUG=true

# 前端URL（用于CORS配置）
FRONTEND_URL=http://localhost:3000
```

## 重要说明

1. **OPENAI_API_KEY**: 必需，从 https://platform.openai.com/api-keys 获取
2. **SECRET_KEY**: 用于JWT token加密，生产环境必须使用强密钥
3. **DATABASE_URL**: 可选，不设置则使用SQLite数据库
4. 其他配置项有默认值，可根据需要调整

## 快速开始

1. 复制上述配置到 `backend/.env` 文件
2. 设置你的 OpenAI API Key
3. 生产环境请更换 SECRET_KEY
4. 启动后端服务：`cd backend && python main.py`
5. 启动前端服务：`cd frontend && npm start`

默认访问地址：
- 前端：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs 