# 微信云托管 Node.js Dockerfile - Schedule Service

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 复制共享包
COPY packages/shared ./packages/shared

# 复制日程服务
COPY services/schedule-service ./services/schedule-service

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建共享包
RUN pnpm -F @assistent/shared build

# 构建服务
RUN pnpm -F @assistent/schedule-service build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY services/schedule-service/package.json ./services/schedule-service/

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/schedule-service/dist ./services/schedule-service/dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

WORKDIR /app/services/schedule-service
CMD ["node", "dist/index.js"]

