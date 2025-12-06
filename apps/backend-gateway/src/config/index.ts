/**
 * 网关配置
 */

import { ENV } from '@assistent/shared'

export const config = {
  // 服务基本信息
  serviceName: 'backend-gateway',
  version: '1.0.0',
  
  // 环境
  env: ENV.NODE_ENV,
  isProd: ENV.IS_PROD,
  
  // 端口
  port: ENV.PORT,
  
  // CORS 配置
  cors: {
    allowedOrigins: ENV.IS_PROD
      ? [
          /\.weixin\.qq\.com$/,
          /\.tcloudbaseapp\.com$/,
          /\.run\.tcloudbase\.com$/,
        ]
      : ['*'],
    credentials: true,
  },
  
  // 请求限制
  requestLimit: {
    bodySize: '10mb',
    urlencoded: '10mb',
  },
  
  // 日志配置
  logging: {
    format: ENV.IS_PROD ? 'combined' : 'dev',
    // 可以添加日志文件路径等
  },
  
  // 超时配置 (毫秒)
  timeout: {
    proxy: 30000, // 代理超时
    keepAlive: 65000, // keep-alive 超时
  },
}

