/**
 * 使用真实 AI 测试数据集样本
 * 
 * 从 JSONL 中提取用户输入，发送给 AI2，验证工具调用是否正确
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const dataFile = path.join(__dirname, 'ai2_training_samples.jsonl');

// 只测试前 3 条（避免太多 API 调用）
const TEST_COUNT = 3;

async function callAI2(instruction) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      requestId: `test-${Date.now()}`,
      instruction: instruction,
      dateTimeContext: {
        today: '2025-12-06',
        currentTime: '10:00:00',
        weekdayName: '星期六',
        weekdayNumber: 6,
        timestamp: Date.now()
      }
    });

    const options = {
      hostname: 'localhost',
      port: 3004,
      path: '/process/ai2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`解析响应失败: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => reject(new Error('请求超时')));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🧪 使用真实 AI 测试数据集样本\n');
  
  const lines = fs.readFileSync(dataFile, 'utf-8').trim().split('\n');
  
  for (let i = 0; i < Math.min(TEST_COUNT, lines.length); i++) {
    const sample = JSON.parse(lines[i]);
    const userMsg = sample.messages.find(m => m.role === 'user');
    const instruction = JSON.parse(userMsg.content);
    
    // 从数据集中提取预期的工具调用
    const expectedToolCalls = sample.messages
      .filter(m => m.role === 'assistant' && m.tool_calls)
      .flatMap(m => m.tool_calls.map(tc => tc.function.name));
    
    const expectedReply = sample.messages
      .filter(m => m.role === 'assistant' && m.content)
      .pop()?.content || '';
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📌 测试 #${i + 1}: ${instruction.intent}`);
    console.log(`   输入: ${JSON.stringify(instruction.payload)}`);
    console.log(`   预期工具: ${expectedToolCalls.join(' → ')}`);
    console.log(`   预期回复: ${expectedReply.slice(0, 50)}...`);
    
    try {
      const result = await callAI2(instruction);

      // 检查返回结构
      const data = result.data || result;

      // 提取实际工具调用
      const actualToolCalls = data.debug?.toolCalls?.map(tc => tc.tool) ||
                              data.toolCallHistory?.map(tc => tc.tool) || [];

      console.log(`\n   🔧 实际工具: ${actualToolCalls.join(' → ') || '无'}`);
      console.log(`   📝 实际回复: ${(data.finalReport || '无').slice(0, 50)}...`);

      // 比较
      const toolsMatch = expectedToolCalls.join(',') === actualToolCalls.join(',');
      console.log(`\n   ${toolsMatch ? '✅ 工具调用匹配' : '⚠️ 工具调用不匹配'}`);

    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }
}

main().catch(console.error);

