# 构建阶段
FROM node:18-alpine as build

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 删除package-lock.json（因为版本不同步）并重新安装依赖
RUN rm -f package-lock.json && npm install --omit=dev

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建文件到nginx
COPY --from=build /app/build /usr/share/nginx/html

# 删除默认nginx配置
RUN rm /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 