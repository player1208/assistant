/**
 * 转换数据集格式
 * 
 * 从 OpenAI tool calling 格式 转换为 简单对话格式
 * 
 * 目标格式要求：
 * 1. 每行是一个独立的 JSON 对象
 * 2. 每个对象须包含一个键名为 messages 的数组
 * 3. messages 中每个元素必须包含 role 和 content 两个字段
 * 4. role 只能是 system、user 或 assistant
 * 5. 如果有 system 角色消息，应在数组首位
 * 6. 第一条非 system 消息必须是 user 角色
 * 7. user 和 assistant 角色的消息应当交替、成对出现
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'ai2_dataset_v1.jsonl');
const outputFile = path.join(__dirname, 'ai2_dataset_simple.jsonl');

console.log('🔄 开始转换数据格式...\n');

const lines = fs.readFileSync(inputFile, 'utf-8').trim().split('\n');
const converted = [];
let errorCount = 0;

for (let i = 0; i < lines.length; i++) {
  try {
    const original = JSON.parse(lines[i]);
    const newMessages = [];
    
    // 1. 保留 system 消息
    const systemMsg = original.messages.find(m => m.role === 'system');
    if (systemMsg) {
      newMessages.push({ role: 'system', content: systemMsg.content });
    }
    
    // 2. 保留 user 消息
    const userMsg = original.messages.find(m => m.role === 'user');
    if (userMsg) {
      newMessages.push({ role: 'user', content: userMsg.content });
    }
    
    // 3. 构建 assistant 回复（包含工具调用信息和最终回复）
    // 收集所有工具调用
    const toolCalls = [];
    const toolResults = [];
    
    for (const msg of original.messages) {
      if (msg.role === 'assistant' && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          toolCalls.push({
            tool: tc.function.name,
            args: JSON.parse(tc.function.arguments)
          });
        }
      }
      if (msg.role === 'tool') {
        try {
          toolResults.push(JSON.parse(msg.content));
        } catch {
          toolResults.push({ result: msg.content });
        }
      }
    }
    
    // 找到最终回复
    const finalReply = original.messages
      .filter(m => m.role === 'assistant' && m.content)
      .pop()?.content || '';
    
    // 构建 assistant 的完整回复（包含思考过程）
    let assistantContent = '';
    
    if (toolCalls.length > 0) {
      // 格式化工具调用为 JSON
      const toolCallsJson = JSON.stringify({
        tool_calls: toolCalls,
        final_report: finalReply
      });
      assistantContent = toolCallsJson;
    } else {
      assistantContent = JSON.stringify({
        tool_calls: [],
        final_report: finalReply
      });
    }
    
    newMessages.push({ role: 'assistant', content: assistantContent });
    
    // 验证格式
    if (newMessages.length < 2) {
      throw new Error('消息数量不足');
    }
    
    converted.push({ messages: newMessages });
    
  } catch (error) {
    console.log(`❌ 第 ${i + 1} 行转换失败: ${error.message}`);
    errorCount++;
  }
}

// 写入文件
const outputLines = converted.map(d => JSON.stringify(d));
fs.writeFileSync(outputFile, outputLines.join('\n'));

console.log(`✅ 转换完成！`);
console.log(`   成功: ${converted.length}`);
console.log(`   失败: ${errorCount}`);
console.log(`   输出: ${outputFile}`);

// 显示样例
console.log('\n📋 转换后样例（前3条）:\n');
for (let i = 0; i < Math.min(3, converted.length); i++) {
  console.log(`--- 样例 ${i + 1} ---`);
  const sample = converted[i];
  sample.messages.forEach(m => {
    const content = m.content.length > 100 ? m.content.slice(0, 100) + '...' : m.content;
    console.log(`[${m.role}]: ${content}`);
  });
  console.log('');
}

