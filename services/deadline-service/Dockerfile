# 微信云托管 Node.js Dockerfile - Deadline Service

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 复制共享包
COPY packages/shared ./packages/shared

# 复制 Deadline 服务
COPY services/deadline-service ./services/deadline-service

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建共享包
RUN pnpm -F @assistent/shared build

# 构建服务
RUN pnpm -F @assistent/deadline-service build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY services/deadline-service/package.json ./services/deadline-service/

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/deadline-service/dist ./services/deadline-service/dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

WORKDIR /app/services/deadline-service
CMD ["node", "dist/index.js"]

