# 🌐 SoulLink - 数字灵魂匹配系统

> 一款由 AI 撮合的数字灵魂匹配系统，让你在虚拟空间中找到真正契合的灵魂

## 📖 项目简介

SoulLink 是一个创新的AI驱动平台，允许用户创建和训练自己的数字人格。通过与数字分身在各种场景中对话，系统会根据用户反馈自动优化人格特征，实现类似TextGrad的提示词优化效果。

### 🎯 核心功能

- **🧠 数字人格构建**: 通过AI技术创建专属数字分身
- **💬 场景化对话**: 在多种预设场景中与数字人格互动
- **👍 智能反馈系统**: 支持点赞/点踩和文字矫正反馈
- **🔄 自动优化**: 基于反馈自动优化System Prompt
- **📊 进度追踪**: 可视化优化历史和匹配度评分

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│                    Backend API (FastAPI)                   │
├─────────────────────────────────────────────────────────────┤
│                    AI Service (OpenAI LLM)                 │
├─────────────────────────────────────────────────────────────┤
│                    Database (PostgreSQL)                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 📋 前置要求

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+** (可选，也支持SQLite)
- **OpenAI API Key**

### 💻 安装步骤

#### 1️⃣ 克隆项目

```bash
git clone <repository-url>
cd SoulLink
```

#### 2️⃣ 后端设置

```bash
# 进入后端目录
cd backend

# 创建Python虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或在Windows上: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 创建环境配置文件
cp .env.example .env
# 编辑 .env 文件，设置你的配置
```

#### 3️⃣ 配置环境变量

编辑 `backend/.env` 文件：

```env
# AI服务配置（必须）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# 数据库配置（可选，默认使用SQLite）
DATABASE_URL=postgresql://username:password@localhost:5432/soullink

# 其他配置
SECRET_KEY=your_secret_key_here
DEBUG=true
```

#### 4️⃣ 启动后端服务

```bash
# 在 backend 目录下
python main.py
```

后端服务将在 `http://localhost:8000` 启动

#### 5️⃣ 前端设置

```bash
# 新开一个终端，进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端应用将在 `http://localhost:3000` 启动

## 📱 使用指南

### 🔧 创建数字人格

1. 访问首页，点击"开始你的数字灵魂之旅"
2. 填写基本信息：姓名、年龄、性格特征等
3. AI会自动生成初始的System Prompt
4. 数字人格创建完成！

### 💬 开始对话

1. 在数字人格列表中选择一个人格
2. 选择对话场景（咖啡厅见面、深夜谈心等）
3. 开始与你的数字分身对话
4. 通过反馈不断优化人格表现

### 📊 反馈系统

对AI的回复，你可以：
- **👍 点赞**: 表示满意
- **👎 点踩**: 表示不满意  
- **✏️ 矫正**: 提供具体的改进建议

系统会根据反馈自动优化System Prompt，让数字人格更符合你的期望。

## 🛠️ 技术栈

### 后端技术
- **FastAPI**: 现代化的Python Web框架
- **SQLAlchemy**: ORM数据库操作
- **OpenAI API**: 大语言模型接口
- **PostgreSQL**: 主数据库
- **Redis**: 缓存层

### 前端技术  
- **React 18**: 用户界面库
- **TypeScript**: 类型安全的JavaScript
- **Material-UI**: 现代化UI组件库
- **Axios**: HTTP客户端

### AI技术
- **大语言模型**: GPT-4等先进模型
- **Prompt Engineering**: 提示词工程
- **TextGrad-like优化**: 基于反馈的自动优化

## 📁 项目结构

```
SoulLink/
├── doc/                          # 项目文档
│   ├── README.md                 # 文档总览
│   ├── PRD.md                    # 产品需求文档
│   ├── functional_design.md      # 功能设计文档
│   └── technical_architecture.md # 技术架构文档
├── backend/                      # 后端代码
│   ├── main.py                   # FastAPI应用入口
│   ├── models/                   # 数据模型
│   ├── services/                 # 业务逻辑
│   ├── api/                      # API路由
│   └── requirements.txt          # Python依赖
├── frontend/                     # 前端代码
│   ├── src/
│   │   ├── components/           # React组件
│   │   ├── pages/                # 页面组件
│   │   ├── services/             # API服务
│   │   └── App.tsx               # 主应用
│   └── package.json              # Node.js依赖
└── README.md                     # 项目说明
```

## 🔧 API文档

启动后端服务后，访问 `http://localhost:8000/docs` 查看自动生成的API文档。

### 主要端点

- `POST /api/v1/digital-personas` - 创建数字人格
- `GET /api/v1/scenarios` - 获取对话场景
- `POST /api/v1/conversations` - 创建对话
- `POST /api/v1/messages` - 发送消息
- `POST /api/v1/feedback` - 提交反馈

## 🧪 示例使用

### 创建数字人格

```python
# 示例：创建一个开朗外向的数字人格
persona_data = {
    "name": "阳光小助手",
    "description": "一个开朗乐观的数字分身",
    "basic_info": {
        "age_range": "25-30",
        "personality": "外向开朗，乐于助人",
        "values": "积极向上，重视友谊"
    }
}
```

### 对话示例

```
场景：咖啡厅初次见面

用户: "你好，很高兴认识你！"
AI: "你好！我也很高兴认识你，这家咖啡厅的氛围真不错呢。你经常来这里吗？"

[用户可以点赞👍、点踩👎或提供矫正反馈✏️]
```

## 🎨 界面预览

### 首页
- 项目介绍和核心功能展示
- 工作原理说明
- 快速开始入口

### 数字人格创建
- 分步骤的表单界面
- 实时预览
- 智能建议

### 对话界面
- 场景选择对话框
- 实时消息流
- 反馈按钮
- 矫正对话框

### 人格管理
- 人格列表卡片
- 优化进度显示
- 统计概览

## 🤝 贡献指南

欢迎贡献代码和建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙋‍♂️ 常见问题

### Q: 如何获取OpenAI API Key？
A: 访问 [OpenAI官网](https://platform.openai.com/api-keys) 注册并创建API密钥。

### Q: 支持其他语言模型吗？
A: 目前主要支持OpenAI模型，未来会添加更多模型支持。

### Q: 数据是否安全？
A: 所有对话数据都存储在本地数据库中，不会上传到第三方服务器。

### Q: 可以部署到生产环境吗？
A: 可以，但需要配置生产级数据库、安全设置和负载均衡。

## 📞 联系我们

- 📧 邮箱: team@soullink.ai
- 🐛 问题反馈: [GitHub Issues](issues)
- 💬 讨论: [GitHub Discussions](discussions)

---

**让数字灵魂在虚拟空间中绽放！** ✨ 