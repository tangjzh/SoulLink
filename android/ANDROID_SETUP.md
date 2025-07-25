# Android项目配置说明

由于React Native需要完整的原生Android项目结构，本目录提供了React Native应用的源码。要运行完整的Android应用，请按照以下步骤操作：

## 1. 初始化React Native项目

```bash
# 在项目根目录外创建新的React Native项目
npx react-native init SoulLinkAndroid --template react-native-template-typescript

# 复制源码到新项目
cp -r android/src SoulLinkAndroid/
cp android/package.json SoulLinkAndroid/
cp android/tsconfig.json SoulLinkAndroid/
cp android/metro.config.js SoulLinkAndroid/
cp android/babel.config.js SoulLinkAndroid/
cp android/index.js SoulLinkAndroid/
```

## 2. 安装依赖

```bash
cd SoulLinkAndroid
npm install
```

## 3. Android权限配置

在 `android/app/src/main/AndroidManifest.xml` 中添加网络权限：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 4. 图标配置

为React Native Vector Icons配置字体：

```bash
npx react-native link react-native-vector-icons
```

或者在 `android/app/build.gradle` 中添加：

```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

## 5. 运行应用

```bash
# 启动Metro服务器
npm start

# 运行Android应用（另开终端）
npm run android
```

## 6. API配置

修改 `src/services/api.ts` 中的BASE_URL：

```typescript
// 对于Android模拟器
const BASE_URL = 'http://10.0.2.2:8000/api/v1';

// 对于真机调试（替换为你的电脑IP）
const BASE_URL = 'http://192.168.1.100:8000/api/v1';
```

## 7. 常见问题解决

### Metro服务器问题
```bash
npx react-native start --reset-cache
```

### 构建错误
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 网络请求问题
确保：
1. 后端服务正在运行
2. 防火墙允许连接
3. 手机和电脑在同一网络

## 8. 开发建议

1. 使用Android Studio进行原生开发调试
2. 使用Flipper进行网络请求调试
3. 启用热重载提高开发效率

## 9. 生产构建

```bash
cd android
./gradlew assembleRelease
```

生成的APK位于：`android/app/build/outputs/apk/release/` 