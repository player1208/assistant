/**
 * 转换为纯文本格式
 * 
 * assistant 的回复改为纯文本，包含：
 * 1. 思考过程（调用了哪些工具）
 * 2. 最终回复
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'ai2_dataset_v1.jsonl');
const outputFile = path.join(__dirname, 'ai2_dataset_text.jsonl');

console.log('🔄 转换为纯文本格式...\n');

const lines = fs.readFileSync(inputFile, 'utf-8').trim().split('\n');
const converted = [];

for (let i = 0; i < lines.length; i++) {
  const original = JSON.parse(lines[i]);
  
  // 1. System 消息
  const systemMsg = original.messages.find(m => m.role === 'system');
  
  // 2. User 消息 - 也转为纯文本描述
  const userMsgRaw = original.messages.find(m => m.role === 'user');
  const userPayload = JSON.parse(userMsgRaw.content);
  
  // 把 user 的 JSON 转为自然语言描述
  let userText = `意图: ${userPayload.intent}\n`;
  if (userPayload.payload.title) {
    userText += `事件: ${userPayload.payload.title}\n`;
  }
  if (userPayload.payload.raw_time_str) {
    userText += `时间: ${userPayload.payload.raw_time_str}\n`;
  }
  if (userPayload.payload.raw_notify_str) {
    userText += `提醒: ${userPayload.payload.raw_notify_str}\n`;
  }
  if (userPayload.payload.raw_duration_str) {
    userText += `间隔: ${userPayload.payload.raw_duration_str}\n`;
  }
  if (userPayload.payload.target) {
    userText += `目标: ${userPayload.payload.target}\n`;
  }
  if (userPayload.payload.action) {
    userText += `操作: ${userPayload.payload.action}\n`;
  }
  if (userPayload.payload.is_all_day !== undefined) {
    userText += `全天: ${userPayload.payload.is_all_day ? '是' : '否'}\n`;
  }
  
  // 3. 收集工具调用
  const toolCalls = [];
  for (const msg of original.messages) {
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        toolCalls.push({ name: tc.function.name, args });
      }
    }
  }
  
  // 4. 最终回复
  const finalReply = original.messages
    .filter(m => m.role === 'assistant' && m.content)
    .pop()?.content || '';
  
  // 5. 构建 assistant 的纯文本回复
  let assistantText = '';
  
  if (toolCalls.length > 0) {
    assistantText += '【执行步骤】\n';
    toolCalls.forEach((tc, idx) => {
      const argsStr = Object.entries(tc.args)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(', ');
      assistantText += `${idx + 1}. ${tc.name}(${argsStr})\n`;
    });
    assistantText += '\n';
  }
  
  assistantText += '【回复用户】\n' + finalReply;
  
  converted.push({
    messages: [
      { role: 'system', content: systemMsg.content },
      { role: 'user', content: userText.trim() },
      { role: 'assistant', content: assistantText }
    ]
  });
}

// 写入
fs.writeFileSync(outputFile, converted.map(d => JSON.stringify(d)).join('\n'));

console.log(`✅ 转换完成: ${converted.length} 条`);
console.log(`📁 输出: ${outputFile}`);

// 显示样例
console.log('\n📋 样例:\n');
const sample = converted[501];
sample.messages.forEach(m => {
  console.log(`--- ${m.role.toUpperCase()} ---`);
  console.log(m.content);
  console.log('');
});

