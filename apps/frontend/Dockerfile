# 微信云托管 前端 Dockerfile
# 使用 nginx 提供静态文件服务

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# 复制 workspace 配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 复制前端应用
COPY apps/frontend ./apps/frontend

# 复制 UI 组件库 (如果前端依赖它)
COPY packages/ui ./packages/ui

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建前端
RUN pnpm -F @assistent/frontend build

# 生产阶段 - 使用 nginx
FROM nginx:alpine AS production

# 复制 nginx 配置
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# 复制构建产物
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# 微信云托管需要监听 80 端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

