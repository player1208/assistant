/**
 * XML 服务
 * 
 * 用于解析和构造微信 XML 消息
 */

import { parseStringPromise } from 'xml2js'
import { WxMessage, WxTextMessage, WxEventMessage } from '@assistent/shared'

class XmlService {
  /**
   * 解析微信 XML 消息
   */
  async parseMessage(xml: string): Promise<WxMessage> {
    try {
      const result = await parseStringPromise(xml, {
        explicitArray: false,
        ignoreAttrs: true,
      })
      
      const msg = result.xml
      
      const baseMessage = {
        toUserName: msg.ToUserName,
        fromUserName: msg.FromUserName,
        createTime: parseInt(msg.CreateTime, 10),
        msgType: msg.MsgType?.toLowerCase(),
      }
      
      switch (baseMessage.msgType) {
        case 'text':
          return {
            ...baseMessage,
            msgType: 'text',
            content: msg.Content || '',
            msgId: msg.MsgId,
          } as WxTextMessage
          
        case 'event':
          return {
            ...baseMessage,
            msgType: 'event',
            event: msg.Event,
            eventKey: msg.EventKey,
          } as WxEventMessage
          
        case 'voice':
          return {
            ...baseMessage,
            msgType: 'voice',
            mediaId: msg.MediaId,
            format: msg.Format,
            recognition: msg.Recognition,  // 语音识别结果
            msgId: msg.MsgId,
          } as any
          
        case 'image':
          return {
            ...baseMessage,
            msgType: 'image',
            picUrl: msg.PicUrl,
            mediaId: msg.MediaId,
            msgId: msg.MsgId,
          } as any
          
        default:
          console.warn(`未处理的消息类型: ${baseMessage.msgType}`)
          return baseMessage as WxMessage
      }
    } catch (error) {
      console.error('解析 XML 失败:', error)
      throw new Error('Invalid XML message')
    }
  }
  
  /**
   * 构造文本回复消息
   */
  buildReply(toUser: string, fromUser: string, content: string): string {
    const timestamp = Math.floor(Date.now() / 1000)
    
    return `<xml>
  <ToUserName><![CDATA[${toUser}]]></ToUserName>
  <FromUserName><![CDATA[${fromUser}]]></FromUserName>
  <CreateTime>${timestamp}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${content}]]></Content>
</xml>`
  }
  
  /**
   * 构造图文回复消息
   */
  buildNewsReply(
    toUser: string,
    fromUser: string,
    articles: Array<{
      title: string
      description: string
      picUrl: string
      url: string
    }>
  ): string {
    const timestamp = Math.floor(Date.now() / 1000)
    
    const articleItems = articles
      .slice(0, 8)  // 微信限制最多 8 条
      .map(
        (article) => `
    <item>
      <Title><![CDATA[${article.title}]]></Title>
      <Description><![CDATA[${article.description}]]></Description>
      <PicUrl><![CDATA[${article.picUrl}]]></PicUrl>
      <Url><![CDATA[${article.url}]]></Url>
    </item>`
      )
      .join('')
    
    return `<xml>
  <ToUserName><![CDATA[${toUser}]]></ToUserName>
  <FromUserName><![CDATA[${fromUser}]]></FromUserName>
  <CreateTime>${timestamp}</CreateTime>
  <MsgType><![CDATA[news]]></MsgType>
  <ArticleCount>${articles.length}</ArticleCount>
  <Articles>${articleItems}
  </Articles>
</xml>`
  }
}

export const xmlService = new XmlService()

