# SoulLink Android App

基于React Native开发的SoulLink移动端Android应用，实现了数字人格构建、AI对话、情感匹配等核心功能。

## 项目特性

- 🤖 **数字人格构建**: 创建和管理AI驱动的数字分身
- 💬 **智能对话**: 与数字人格进行实时对话交互
- 💕 **情感匹配**: AI驱动的情感匹配和兼容性评估
- 📱 **移动端优化**: 专为Android平台优化的用户体验
- 🎨 **现代化UI**: 基于Material Design 3的精美界面

## 技术栈

- **React Native 0.72.6**: 跨平台移动应用框架
- **TypeScript**: 类型安全的JavaScript
- **React Native Paper**: Material Design组件库
- **React Navigation**: 导航框架
- **Axios**: HTTP客户端
- **AsyncStorage**: 本地存储

## 项目结构

```
android/
├── src/
│   ├── components/          # 可复用组件
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React上下文
│   │   └── AuthContext.tsx
│   ├── screens/            # 屏幕组件
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── PersonaListScreen.tsx
│   │   ├── PersonaCreateScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── ConversationHistoryScreen.tsx
│   │   └── MatchMarketScreen.tsx
│   ├── services/           # API服务
│   │   └── api.ts
│   ├── theme/              # 主题配置
│   │   └── theme.ts
│   └── App.tsx             # 主应用组件
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
└── index.js
```

## 快速开始

### 1. 安装依赖

```bash
cd android
npm install
```

### 2. 配置后端服务

确保后端服务正在运行，并在 `src/services/api.ts` 中配置正确的API地址：

```typescript
const BASE_URL = 'http://10.0.2.2:8000/api/v1'; // Android模拟器
// 或者
const BASE_URL = 'http://192.168.1.100:8000/api/v1'; // 真机调试
```

### 3. 启动Metro服务器

```bash
npm start
```

### 4. 运行Android应用

```bash
npm run android
```

## 环境要求

- Node.js >= 16
- Android Studio
- Android SDK
- Java Development Kit (JDK) 11+
- React Native CLI

## 核心功能

### 用户认证
- 用户注册和登录
- JWT令牌管理
- 自动登录状态保持

### 数字人格管理
- 创建个性化AI人格
- 设置人格特征和行为模式
- 查看和管理已创建的人格

### AI对话系统
- 实时与数字人格对话
- 消息历史记录
- 对话场景管理

### 情感匹配
- 浏览其他用户的数字人格
- 创建情感匹配关系
- 查看兼容性评分
- 触发自动对话

## API集成

应用与SoulLink后端API完全集成，支持：

- 用户认证 (`/auth/*`)
- 数字人格管理 (`/digital-personas/*`)
- 对话系统 (`/conversations/*`)
- 情感匹配 (`/market-agents/*`, `/match-relations/*`)

## 开发说明

### 添加新屏幕

1. 在 `src/screens/` 中创建新的屏幕组件
2. 在 `src/App.tsx` 中添加路由配置
3. 更新导航类型定义

### 添加新API

1. 在 `src/services/api.ts` 中添加新的API函数
2. 定义相应的TypeScript接口
3. 在组件中使用新的API

### 样式开发

使用 `src/theme/theme.ts` 中定义的主题配色和样式常量，保持设计一致性。

## 构建部署

### Debug版本

```bash
npm run android
```

### Release版本

```bash
cd android
./gradlew assembleRelease
```

## 故障排除

### 常见问题

1. **Metro服务器连接失败**
   - 确保Metro服务器正在运行
   - 检查设备/模拟器网络连接

2. **API请求失败**
   - 验证后端服务是否运行
   - 检查API URL配置
   - 确认网络权限

3. **依赖安装问题**
   ```bash
   npm install --legacy-peer-deps
   ```

### 清理缓存

```bash
npm start -- --reset-cache
```

## 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看LICENSE文件了解详情。 