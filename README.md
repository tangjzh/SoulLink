# SoulLink - 数字灵魂匹配系统

![SoulLink Logo](https://via.placeholder.com/600x200/4A90E2/ffffff?text=SoulLink)

一个基于AI驱动的数字灵魂匹配系统，帮助用户创建数字人格，通过智能算法进行匹配，并支持实时聊天交流。

## 🌟 项目特性

### 核心功能
- 🤖 **AI驱动的数字人格创建** - 基于用户输入智能生成个性化数字人格
- 💝 **智能匹配算法** - 使用AI分析用户兼容性，提供精准匹配
- 💬 **实时聊天系统** - WebSocket实时通讯，支持打字状态显示
- 📊 **个性评估系统** - 综合人格测试和AI分析
- 🎭 **多场景对话** - 支持不同情境下的对话体验
- 📱 **响应式设计** - 现代化的Material-UI界面，支持移动端

### 技术亮点
- 🔮 **OpenAI集成** - 使用最新的GPT模型进行智能对话
- 🌐 **现代Web技术栈** - React + TypeScript + FastAPI
- 🔒 **安全认证系统** - JWT token认证，保护用户数据
- 📈 **可扩展架构** - 微服务设计，支持水平扩展
- 🐳 **容器化部署** - Docker支持，简化部署流程

## 🏗️ 技术栈

### 后端
- **框架**: FastAPI (Python)
- **数据库**: PostgreSQL / SQLite
- **ORM**: SQLAlchemy
- **缓存**: Redis
- **AI服务**: OpenAI GPT, LangChain
- **实时通讯**: WebSocket
- **认证**: JWT (python-jose)
- **密码加密**: Passlib + bcrypt

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Material-UI (MUI)
- **路由**: React Router DOM
- **HTTP客户端**: Axios
- **状态管理**: React Context
- **构建工具**: Create React App

### 部署与开发
- **容器化**: Docker & Docker Compose
- **代码质量**: ESLint, TypeScript
- **API文档**: FastAPI自动生成Swagger文档

## 📦 项目结构

```
SoulLink/
├── backend/                 # 后端服务
│   ├── api/                # API路由
│   │   └── routes.py       # 主要API端点
│   ├── models/             # 数据模型
│   │   └── database.py     # SQLAlchemy模型定义
│   ├── services/           # 业务服务层
│   │   ├── ai_service.py   # AI服务 (OpenAI/LangChain)
│   │   ├── auth_service.py # 认证服务
│   │   ├── chat_service.py # 聊天服务
│   │   ├── match_service.py# 匹配算法服务
│   │   └── websocket_service.py # WebSocket服务
│   ├── main.py             # FastAPI应用入口
│   ├── init_db.py          # 数据库初始化脚本
│   ├── requirements.txt    # Python依赖
│   └── Dockerfile          # 后端Docker配置
│
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── Landing.tsx # 首页
│   │   │   ├── Login.tsx   # 登录页
│   │   │   ├── PersonaCreate.tsx # 数字人格创建
│   │   │   ├── MatchMarket.tsx   # 匹配市场
│   │   │   ├── RealTimeChat.tsx  # 实时聊天
│   │   │   └── PersonalityAssessment.tsx # 个性评估
│   │   ├── services/       # API服务
│   │   ├── contexts/       # React Context
│   │   └── config/         # 配置文件
│   ├── package.json        # 前端依赖
│   └── Dockerfile          # 前端Docker配置
│
└── README.md              # 项目文档
```

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- PostgreSQL (可选，默认使用SQLite)
- Redis (可选，用于缓存)

### 1. 克隆项目
```bash
git clone <repository-url>
cd SoulLink
```

### 2. 后端设置

#### 创建虚拟环境
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
```

#### 安装依赖
```bash
pip install -r requirements.txt
```

#### 环境配置
创建 `.env` 文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要参数：
```env
# OpenAI配置 (必需)
OPENAI_API_KEY=your_openai_api_key_here

# 数据库配置 (可选，默认使用SQLite)
DATABASE_URL=sqlite:///soullink.db
# 或使用PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/soullink

# Redis配置 (可选)
REDIS_URL=redis://localhost:6379

# 应用配置
DEBUG=true
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

#### 初始化数据库
```bash
python init_db.py
```

#### 启动后端服务
```bash
python main.py
```

后端服务将在 `http://localhost:8000` 启动
- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

### 3. 前端设置

#### 安装依赖
```bash
cd frontend
npm install
```

#### 启动前端服务
```bash
npm start
```

前端应用将在 `http://localhost:3000` 启动

### 4. 使用Docker (推荐)

#### 构建和启动所有服务
```bash
# 在项目根目录
docker-compose up --build
```

这将启动：
- 后端API服务 (端口8000)
- 前端Web应用 (端口3000)
- PostgreSQL数据库 (如果配置)
- Redis缓存 (如果配置)

## 📚 API文档

### 主要API端点

#### 用户认证
- `POST /api/v1/register` - 用户注册
- `POST /api/v1/login` - 用户登录
- `GET /api/v1/profile` - 获取用户资料

#### 数字人格管理
- `POST /api/v1/personas` - 创建数字人格
- `GET /api/v1/personas` - 获取用户的数字人格列表
- `PUT /api/v1/personas/{id}` - 更新数字人格
- `DELETE /api/v1/personas/{id}` - 删除数字人格

#### 匹配系统
- `GET /api/v1/matches` - 获取匹配结果
- `POST /api/v1/matches/calculate` - 计算匹配度
- `GET /api/v1/market` - 获取匹配市场数据

#### 聊天系统
- `GET /api/v1/conversations` - 获取对话列表
- `POST /api/v1/conversations` - 创建新对话
- `GET /api/v1/conversations/{id}/messages` - 获取对话消息
- `POST /api/v1/messages` - 发送消息

#### WebSocket端点
- `ws://localhost:8000/ws/chat/{other_user_id}?userId={user_id}` - 实时聊天

完整API文档请访问：http://localhost:8000/docs

## 💡 使用指南

### 1. 注册和登录
1. 访问 http://localhost:3000
2. 点击"开始体验"进入注册页面
3. 填写用户名、邮箱和密码完成注册
4. 使用注册信息登录系统

### 2. 创建数字人格
1. 登录后点击"创建人格"
2. 填写人格名称和描述
3. 完成个性评估问卷
4. 系统将基于AI生成您的数字人格

### 3. 查看匹配
1. 进入"匹配市场"页面
2. 查看系统推荐的匹配用户
3. 查看匹配度分析和兼容性报告

### 4. 开始聊天
1. 在匹配市场中选择感兴趣的用户
2. 点击"开始聊天"
3. 支持实时消息和打字状态显示

## 🔧 开发指南

### 后端开发
```bash
# 安装开发依赖
pip install -r requirements-dev.txt

# 运行测试
pytest

# 代码格式化
black .
isort .

# 类型检查
mypy .
```

### 前端开发
```bash
# 代码检查
npm run lint

# 运行测试
npm test

# 构建生产版本
npm run build
```

### 数据库迁移
```bash
# 生成迁移文件
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head
```

## 🌍 部署指南

### 生产环境部署

#### 使用Docker Compose
```bash
# 设置生产环境变量
export NODE_ENV=production
export DEBUG=false

# 启动生产服务
docker-compose -f docker-compose.prod.yml up -d
```

#### 环境变量配置
生产环境需要设置以下环境变量：
```env
OPENAI_API_KEY=your_production_api_key
DATABASE_URL=postgresql://user:password@db:5432/soullink
REDIS_URL=redis://redis:6379
SECRET_KEY=your_secret_key
DEBUG=false
```

## 🔒 安全考虑

- 🔐 **数据加密**: 用户密码使用bcrypt加密存储
- 🎫 **JWT认证**: 安全的token认证机制
- 🛡️ **CORS配置**: 正确配置跨域请求
- 🔍 **输入验证**: 严格的数据验证和清理
- 📝 **日志记录**: 完整的操作日志记录

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 提交Issue
- 🐛 Bug报告
- 💡 功能建议
- 📖 文档改进

### 代码贡献
1. Fork项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建Pull Request

### 开发规范
- 遵循现有代码风格
- 添加适当的测试
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 👥 团队

- **项目维护者**: [@tangjinzhou](https://github.com/tangjinzhou)

## 📞 支持与反馈

如果你在使用过程中遇到问题或有任何建议，欢迎通过以下方式联系我们：

- 🐛 [提交Issue](https://github.com/your-repo/SoulLink/issues)
- 💬 [讨论区](https://github.com/your-repo/SoulLink/discussions)
- 📧 邮箱: support@soullink.app

## 🙏 致谢

感谢以下开源项目和技术：
- [FastAPI](https://fastapi.tiangolo.com/) - 现代Python API框架
- [React](https://reactjs.org/) - 用户界面库
- [Material-UI](https://mui.com/) - React UI组件库
- [OpenAI](https://openai.com/) - AI服务提供商
- [LangChain](https://python.langchain.com/) - AI应用开发框架

---

⭐ 如果这个项目对你有帮助，请给我们一个Star！ 