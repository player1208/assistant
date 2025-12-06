/**
 * 微信网页授权服务
 * 
 * 文档参考: https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
 */

import { ENV } from '@assistent/shared'

// 微信 API 响应类型
interface WxAccessTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

interface WxUserInfoResponse {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
  errcode?: number
  errmsg?: string
}

/**
 * 生成微信网页授权 URL
 * 
 * @param redirectUri 授权后跳转的回调地址
 * @param state 自定义参数，用于防止 CSRF
 * @param scope 授权作用域 (snsapi_base 或 snsapi_userinfo)
 */
export function generateAuthUrl(
  redirectUri: string,
  state: string = '',
  scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_base'
): string {
  const appId = ENV.WX_MP_APPID
  const encodedRedirectUri = encodeURIComponent(redirectUri)
  
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`
}

/**
 * 通过 code 换取 access_token 和 openid
 */
export async function getAccessToken(code: string): Promise<WxAccessTokenResponse> {
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${ENV.WX_MP_APPID}&secret=${ENV.WX_MP_SECRET}&code=${code}&grant_type=authorization_code`
  
  const response = await fetch(url)
  const data: WxAccessTokenResponse = await response.json()
  
  if (data.errcode) {
    throw new Error(`微信授权失败: ${data.errmsg} (${data.errcode})`)
  }
  
  return data
}

/**
 * 获取用户信息（需要 snsapi_userinfo 授权）
 */
export async function getUserInfo(accessToken: string, openid: string): Promise<WxUserInfoResponse> {
  const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
  
  const response = await fetch(url)
  const data: WxUserInfoResponse = await response.json()
  
  if (data.errcode) {
    throw new Error(`获取用户信息失败: ${data.errmsg} (${data.errcode})`)
  }
  
  return data
}

/**
 * 刷新 access_token
 */
export async function refreshAccessToken(refreshToken: string): Promise<WxAccessTokenResponse> {
  const url = `https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${ENV.WX_MP_APPID}&grant_type=refresh_token&refresh_token=${refreshToken}`
  
  const response = await fetch(url)
  const data: WxAccessTokenResponse = await response.json()
  
  if (data.errcode) {
    throw new Error(`刷新 token 失败: ${data.errmsg} (${data.errcode})`)
  }
  
  return data
}

