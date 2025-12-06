/**
 * 中国传统节日日期测试
 */

const http = require('http');

const testCases = [
  {
    id: 1,
    category: '节日',
    input: '中秋节当天和家人聚餐，当天中午12点提醒',
    expect: '应查找2026年中秋节：2026-09-25',
  },
  {
    id: 2,
    category: '节日',
    input: '端午节那天去看龙舟比赛，提前一小时提醒',
    expect: '应查找2026年端午节：2026-06-03',
  },
];

async function runTest(testCase) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      text: testCase.input,
      userId: 'test-user-001',
    });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/message/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ success: true, data: result.data });
        } catch (e) {
          resolve({ success: false, error: '解析响应失败' });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.setTimeout(120000);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🎌 中国传统节日日期测试\n');
  console.log('=' .repeat(80));
  
  for (const tc of testCases) {
    console.log(`\n📌 测试 #${tc.id}: ${tc.category}`);
    console.log(`   输入: "${tc.input}"`);
    console.log(`   预期: ${tc.expect}`);
    console.log('-'.repeat(60));
    
    const result = await runTest(tc);
    
    if (!result.success) {
      console.log(`   ❌ 请求失败: ${result.error}`);
      continue;
    }
    
    const data = result.data;
    console.log(`   实际回复: "${data.reply}"`);
    
    if (data.debug?.ai1Output) {
      const ai1 = data.debug.ai1Output;
      console.log(`\n   📤 AI1 输出:`);
      console.log(`      意图: ${ai1.intent}`);
      console.log(`      需要AI2: ${ai1.needsAI2}`);
      if (ai1.rawOutput?.agent_instruction?.payload) {
        const p = ai1.rawOutput.agent_instruction.payload;
        console.log(`      raw_time_str: ${p.raw_time_str}`);
      }
    }
    
    if (data.debug?.ai2Output) {
      const ai2 = data.debug.ai2Output;
      console.log(`\n   🔧 AI2 输出:`);
      console.log(`      执行成功: ${ai2.success}`);
      
      if (ai2.toolCalls && ai2.toolCalls.length > 0) {
        console.log(`      实际工具调用:`);
        for (const tc of ai2.toolCalls) {
          console.log(`        - ${tc.tool}:`);
          console.log(`          参数: ${JSON.stringify(tc.args)}`);
          if (tc.result) {
            console.log(`          结果: ${tc.result.substring(0, 100)}...`);
          }
        }
      } else {
        console.log(`      工具调用: (无)`);
      }
      
      console.log(`      最终报告: ${ai2.finalReport}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

main().catch(console.error);

