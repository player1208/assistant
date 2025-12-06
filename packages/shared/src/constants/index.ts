/**
 * 常量定义
 */

// 加载 .env 环境变量 (必须在最前面)
import dotenv from 'dotenv'
dotenv.config()

// 环境变量
export const ENV = {
  // 运行环境
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  IS_DEV: process.env.NODE_ENV !== 'production',

  // 微信云托管特有环境变量
  WX_CLOUD_ENV: process.env.WX_CLOUD_RUN_ENV || '',        // 云托管环境ID
  WX_OPENID: process.env.WX_OPENID || '',                  // 请求用户的OpenID (云托管自动注入)
  WX_APPID: process.env.WX_APPID || '',                    // 小程序AppID

  // 微信服务号配置
  WX_MP_TOKEN: process.env.WX_MP_TOKEN || 'your_token',    // 服务号 Token
  WX_MP_APPID: process.env.WX_MP_APPID || '',              // 服务号 AppID
  WX_MP_SECRET: process.env.WX_MP_SECRET || '',            // 服务号 AppSecret
  WX_MP_ENCODING_AES_KEY: process.env.WX_MP_ENCODING_AES_KEY || '', // 消息加密密钥

  // JWT 配置
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',      // Token 有效期

  // 前端 URL（用于微信授权回调）
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // 服务端口
  PORT: parseInt(process.env.PORT || '80', 10),

  // 数据库
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/assistent',

  // Redis (可选)
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),

  // AI/LLM 配置
  // 使用硅基流动 (SiliconFlow)
  // API 文档: https://docs.siliconflow.cn/
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'siliconflow',
  LLM_API_KEY: process.env.LLM_API_KEY || '',  // 必填！硅基流动 API Key
  LLM_API_ENDPOINT: process.env.LLM_API_ENDPOINT || 'https://api.siliconflow.cn',
  LLM_TIMEOUT: parseInt(process.env.LLM_TIMEOUT || '30000', 10),

  // AI-1: 意图解析器 (快速响应，用于解析用户意图)
  // 使用 DeepSeek-V3 免费版（Pro 版需要付费）
  LLM_PARSER_MODEL: process.env.LLM_PARSER_MODEL || 'deepseek-ai/DeepSeek-V3',
  LLM_PARSER_MAX_TOKENS: parseInt(process.env.LLM_PARSER_MAX_TOKENS || '500', 10),

  // AI-2: Agent 执行器 (工具调用，执行具体任务)
  // 使用 Qwen2.5-7B，更适合工具调用
  LLM_AGENT_MODEL: process.env.LLM_AGENT_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
  LLM_AGENT_MAX_TOKENS: parseInt(process.env.LLM_AGENT_MAX_TOKENS || '1000', 10),

  // 兼容旧配置
  LLM_MODEL: process.env.LLM_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
}

// HTTP 请求头
export const HEADERS = {
  // 微信云托管自动注入的请求头
  WX_OPENID: 'x-wx-openid',
  WX_UNIONID: 'x-wx-unionid',
  WX_APPID: 'x-wx-appid',
  WX_SOURCE: 'x-wx-source',           // 来源: wx (微信环境), out (外部)
  WX_FROM_OPENID: 'x-wx-from-openid', // 转发场景下的原始openid
  
  // 服务间调用
  X_SERVICE_NAME: 'x-service-name',   // 调用方服务名
  X_REQUEST_ID: 'x-request-id',       // 请求追踪ID
  
  // 通用
  CONTENT_TYPE: 'content-type',
  AUTHORIZATION: 'authorization',
}

// API 路径前缀
export const API_PREFIX = {
  V1: '/api/v1',
  SCHEDULE: '/api/v1/schedule',
  USER: '/api/v1/user',
  HEALTH: '/health',
}

// 分页默认值
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
}

// 缓存 TTL (秒)
export const CACHE_TTL = {
  USER_INFO: 3600,           // 用户信息 1小时
  TASK_LIST: 300,            // 任务列表 5分钟
  PROJECT_DATA: 600,         // 项目数据 10分钟
}

// 限流配置
export const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000,      // 1分钟窗口
  MAX_REQUESTS: 100,         // 最大请求数
}

