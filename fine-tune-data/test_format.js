/**
 * 测试微调数据格式
 * 
 * 验证:
 * 1. JSONL 格式正确
 * 2. 消息结构符合 OpenAI/Qwen 格式
 * 3. tool_calls 格式正确
 */

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'ai2_dataset_v1.jsonl');

console.log('📋 验证微调数据格式...\n');

const lines = fs.readFileSync(dataFile, 'utf-8').trim().split('\n');

let validCount = 0;
let errorCount = 0;

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  
  try {
    const data = JSON.parse(line);
    
    // 验证基本结构
    if (!data.messages || !Array.isArray(data.messages)) {
      throw new Error('缺少 messages 数组');
    }
    
    // 验证消息结构
    let hasSystem = false;
    let hasUser = false;
    let hasAssistant = false;
    let hasToolCall = false;
    let hasToolResult = false;
    
    for (const msg of data.messages) {
      if (!msg.role) {
        throw new Error('消息缺少 role 字段');
      }
      
      if (msg.role === 'system') {
        hasSystem = true;
        if (typeof msg.content !== 'string') {
          throw new Error('system 消息 content 必须是字符串');
        }
      }
      
      if (msg.role === 'user') {
        hasUser = true;
        // 验证用户消息是有效的 JSON
        try {
          JSON.parse(msg.content);
        } catch (e) {
          throw new Error('user 消息的 content 不是有效的 JSON');
        }
      }
      
      if (msg.role === 'assistant') {
        hasAssistant = true;
        
        // 验证 tool_calls 格式
        if (msg.tool_calls) {
          hasToolCall = true;
          if (!Array.isArray(msg.tool_calls)) {
            throw new Error('tool_calls 必须是数组');
          }
          
          for (const tc of msg.tool_calls) {
            if (!tc.id || !tc.type || !tc.function) {
              throw new Error('tool_call 缺少必要字段 (id, type, function)');
            }
            if (tc.type !== 'function') {
              throw new Error('tool_call.type 必须是 "function"');
            }
            if (!tc.function.name || !tc.function.arguments) {
              throw new Error('tool_call.function 缺少 name 或 arguments');
            }
            // 验证 arguments 是有效的 JSON 字符串
            try {
              JSON.parse(tc.function.arguments);
            } catch (e) {
              throw new Error(`tool_call arguments 不是有效的 JSON: ${tc.function.arguments}`);
            }
          }
        }
      }
      
      if (msg.role === 'tool') {
        hasToolResult = true;
        if (!msg.tool_call_id) {
          throw new Error('tool 消息缺少 tool_call_id');
        }
        if (typeof msg.content !== 'string') {
          throw new Error('tool 消息 content 必须是字符串');
        }
      }
    }
    
    // 验证必要元素存在
    if (!hasSystem) throw new Error('缺少 system 消息');
    if (!hasUser) throw new Error('缺少 user 消息');
    if (!hasAssistant) throw new Error('缺少 assistant 消息');
    
    // 获取意图信息用于显示
    const userMsg = data.messages.find(m => m.role === 'user');
    const input = JSON.parse(userMsg.content);
    const finalReply = data.messages.filter(m => m.role === 'assistant' && m.content).pop();
    
    // 只显示前10条和每100条的状态
    if (lineNum <= 10 || lineNum % 200 === 0) {
      console.log(`✅ 样本 #${lineNum}: ${input.intent}`);
      console.log(`   输入: ${input.payload.title || input.payload.raw_time_str || input.payload.raw_duration_str || JSON.stringify(input.payload)}`);
      console.log(`   工具调用: ${hasToolCall ? '是' : '否'}`);
      console.log(`   回复: ${finalReply?.content?.slice(0, 50)}...`);
      console.log('');
    }
    
    validCount++;
    
  } catch (error) {
    console.log(`❌ 样本 #${lineNum}: ${error.message}`);
    console.log(`   原始数据: ${line.slice(0, 100)}...`);
    console.log('');
    errorCount++;
  }
}

console.log('========================================');
console.log(`📊 验证结果: ${validCount} 通过, ${errorCount} 失败`);
console.log('========================================');

if (errorCount === 0) {
  console.log('\n✅ 所有样本格式正确！可以用于微调。');
} else {
  console.log('\n❌ 存在格式错误，请修复后重试。');
  process.exit(1);
}

