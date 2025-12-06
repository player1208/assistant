# 微信云托管 Node.js Dockerfile
# 参考: https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/quickstart/custom/node.html

# 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 复制共享包
COPY packages/shared ./packages/shared

# 复制网关服务
COPY apps/backend-gateway ./apps/backend-gateway

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建共享包
RUN pnpm -F @assistent/shared build

# 构建网关服务
RUN pnpm -F @assistent/backend-gateway build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend-gateway/package.json ./apps/backend-gateway/

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend-gateway/dist ./apps/backend-gateway/dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

# 暴露端口 (微信云托管要求监听80端口)
EXPOSE 80

# 启动服务
WORKDIR /app/apps/backend-gateway
CMD ["node", "dist/index.js"]

