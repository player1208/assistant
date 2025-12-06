# 微信云托管 Node.js Dockerfile - AI Service

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 复制共享包
COPY packages/shared ./packages/shared

# 复制 AI 服务
COPY services/ai-service ./services/ai-service

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建共享包
RUN pnpm -F @assistent/shared build

# 构建服务
RUN pnpm -F @assistent/ai-service build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY services/ai-service/package.json ./services/ai-service/

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/ai-service/dist ./services/ai-service/dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

WORKDIR /app/services/ai-service
CMD ["node", "dist/index.js"]

