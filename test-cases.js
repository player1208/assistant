/**
 * 30条高质量测试用例
 * 
 * 设计原则：
 * 1. 覆盖各种时间表达方式（相对时间、节日、节气、模糊时间等）
 * 2. 覆盖边界情况（跨年、跨月、午夜边界等）
 * 3. 覆盖各种意图类型（日程、deadline、查询、提醒等）
 * 4. 覆盖 Slot Filling 和信息完整性检查
 * 5. 覆盖意图防火墙和错误处理
 */

const http = require('http');

const TEST_CASES = [
  // ===== 1. 时间边界映射测试 (2条) =====
  { id: 1, input: '这个月底前交论文，每天晚上10点提醒', expect: '创建deadline，截止日期应为本月最后一天23:59', category: '时间边界' },
  { id: 2, input: '15号前完成设计稿，每天早上8点催我', expect: '如果今天>15号则下月15日23:59，否则本月15日23:59', category: '时间边界' },

  // ===== 2. 跨年日期推断 (3条) =====
  { id: 3, input: '1月3号下午茶聚会，提前半小时提醒', expect: '应推断为2026-01-03（因为2025年1月已过）', category: '跨年推断' },
  { id: 4, input: '元旦上午10点参加升旗仪式，当天早上7点提醒', expect: '应推断为2026-01-01', category: '跨年推断' },
  { id: 5, input: '农历大年三十吃年夜饭，不用提醒', expect: '应查找2026年春节除夕日期', category: '跨年推断' },

  // ===== 3. 中国传统节日 (4条) =====
  { id: 6, input: '端午节前一天去超市买粽子，每天下午3点提醒', expect: '应先查端午日期，再减1天，创建deadline', category: '节日' },
  { id: 7, input: '中秋节当天和家人聚餐，当天中午12点提醒', expect: '应查找2025或2026中秋日期创建全天日程', category: '节日' },
  { id: 8, input: '清明节扫墓，当天早上8点提醒', expect: '应查找清明日期（通常4月4-6日）', category: '节日' },
  { id: 9, input: '国庆第三天自驾游出发，提前一天提醒', expect: '应计算10月3日', category: '节日' },

  // ===== 4. 24节气 (2条) =====
  { id: 10, input: '冬至那天去吃饺子，当天中午提醒', expect: '应查找冬至日期（12月21-23日左右）', category: '节气' },
  { id: 11, input: '立春后开始减肥计划，每天早上6点提醒', expect: '应查找立春日期', category: '节气' },

  // ===== 5. 复杂相对时间 (4条) =====
  { id: 12, input: '大后天下午5点健身房私教课，提前20分钟提醒', expect: '应计算今天+3天', category: '相对时间' },
  { id: 13, input: '下下周一交季度报告，每天上午9点提醒', expect: '应计算下下周一日期', category: '相对时间' },
  { id: 14, input: '这周日晚上9点看比赛，不用提醒', expect: '应计算本周日日期', category: '相对时间' },
  { id: 15, input: '下个月15号发工资，当天早上8点提醒', expect: '应计算下个月15日', category: '相对时间' },

  // ===== 6. 模糊时间表达 (3条) =====
  { id: 16, input: '明天傍晚去接孩子放学，提前10分钟', expect: '傍晚应解析为17:00-18:00左右', category: '模糊时间' },
  { id: 17, input: '后天凌晨的航班，提前3小时提醒', expect: '凌晨应解析为00:00-05:00', category: '模糊时间' },
  { id: 18, input: '下周末有场婚礼，当天早上9点提醒', expect: '周末应理解为周六或周日，可能需追问', category: '模糊时间' },

  // ===== 7. Slot Filling 追问 (4条) =====
  { id: 19, input: '明天开会', expect: '应追问具体时间和是否需要提醒', category: 'Slot Filling' },
  { id: 20, input: '下周三下午2点开会', expect: '应追问是否需要提醒', category: 'Slot Filling' },
  { id: 21, input: '月底前完成报告', expect: '应追问每日提醒时间', category: 'Slot Filling' },
  { id: 22, input: '记一下我生日是5月20号', expect: '全天日程，应追问是否需要提醒', category: 'Slot Filling' },

  // ===== 8. 时间回溯拦截 (2条) =====
  { id: 23, input: '帮我记录一下昨天的会议纪要', expect: '应拒绝并提示无法创建过去的时间', category: '时间回溯' },
  { id: 24, input: '今天早上8点的会议帮我记录一下', expect: '如果现在已过8点，应拒绝', category: '时间回溯' },

  // ===== 9. 意图防火墙 (2条) =====
  { id: 25, input: '帮我写一首关于春天的诗', expect: '应礼貌拒绝并引导使用核心功能', category: '意图防火墙' },
  { id: 26, input: '今天股票涨了吗', expect: '应礼貌拒绝并引导使用核心功能', category: '意图防火墙' },

  // ===== 10. 查询类测试 (2条) =====
  { id: 27, input: '春节那天有什么安排', expect: '应查询春节当天的日程', category: '查询' },
  { id: 28, input: '下周二忙不忙', expect: '应查询下周二的日程', category: '查询' },

  // ===== 11. 特殊功能测试 (2条) =====
  { id: 29, input: '把今天的任务每隔30分钟提醒我一次', expect: '应设置提醒间隔为30分钟', category: '特殊功能' },
  { id: 30, input: '关掉早安提醒', expect: '应切换早安推送为关闭', category: '特殊功能' },
];

async function sendRequest(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ text, userId: 'test-user-001' });
    
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/message/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000); // 2分钟超时
    req.write(data);
    req.end();
  });
}

function formatAI1Output(ai1Output) {
  if (!ai1Output) return '无 AI1 输出';

  const raw = ai1Output.rawOutput || {};
  const lines = [];
  lines.push(`    意图: ${ai1Output.intent || 'N/A'}`);
  lines.push(`    需要AI2: ${ai1Output.needsAI2 ? '✅ 是' : '❌ 否'}`);

  if (raw.reply_to_user) {
    lines.push(`    直接回复: "${raw.reply_to_user.slice(0, 50)}..."`);
  }

  if (raw.agent_instruction) {
    const inst = raw.agent_instruction;
    lines.push(`    派单指令:`);
    lines.push(`      - intent: ${inst.intent}`);
    if (inst.payload) {
      lines.push(`      - title: ${inst.payload.title || 'N/A'}`);
      lines.push(`      - raw_time_str: ${inst.payload.raw_time_str || 'N/A'}`);
      lines.push(`      - raw_notify_str: ${inst.payload.raw_notify_str || 'N/A'}`);
      lines.push(`      - is_all_day: ${inst.payload.is_all_day}`);
    }
  }

  return lines.join('\n');
}

function formatAI2Output(ai2Output) {
  if (!ai2Output) return '无 AI2 输出 (未调用)';

  const lines = [];
  lines.push(`    执行成功: ${ai2Output.success ? '✅' : '❌'}`);

  if (ai2Output.toolCalls && ai2Output.toolCalls.length > 0) {
    lines.push(`    工具调用:`);
    for (const tc of ai2Output.toolCalls) {
      lines.push(`      - ${tc.tool}(${JSON.stringify(tc.args).slice(0, 80)}...)`);
    }
  }

  if (ai2Output.finalReport) {
    lines.push(`    最终报告: "${ai2Output.finalReport.slice(0, 60)}..."`);
  }

  return lines.join('\n');
}

function formatTimeline(timeline) {
  if (!timeline) return '无时间线数据';

  const lines = [];
  lines.push(`    AI1耗时: ${timeline.ai1EndTime - timeline.ai1StartTime}ms`);
  if (timeline.ai2StartTime && timeline.ai2EndTime) {
    lines.push(`    AI2耗时: ${timeline.ai2EndTime - timeline.ai2StartTime}ms`);
  }
  lines.push(`    总耗时: ${timeline.totalTime}ms`);

  return lines.join('\n');
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  GoalPilot 双AI架构 完整业务流程测试');
  console.log('  测试用例: 30条');
  console.log('  当前时间:', new Date().toLocaleString('zh-CN'));
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n┌─────────────────────────────────────────────────────────────────┐`);
    console.log(`│ [${String(testCase.id).padStart(2, '0')}/30] ${testCase.category.padEnd(15)} │`);
    console.log(`└─────────────────────────────────────────────────────────────────┘`);
    console.log(`📝 用户输入: "${testCase.input}"`);
    console.log(`🎯 预期行为: ${testCase.expect}`);
    console.log('');

    try {
      const startTime = Date.now();
      const response = await sendRequest(testCase.input);
      const duration = Date.now() - startTime;

      const data = response.data || {};
      const debug = data.debug || {};

      console.log('┈┈┈┈┈┈┈ AI1 输出 (意图解析) ┈┈┈┈┈┈┈');
      console.log(formatAI1Output(debug.ai1Output));

      console.log('');
      console.log('┈┈┈┈┈┈┈ AI2 输出 (工具执行) ┈┈┈┈┈┈┈');
      console.log(formatAI2Output(debug.ai2Output));

      console.log('');
      console.log('┈┈┈┈┈┈┈ 时间线 ┈┈┈┈┈┈┈');
      console.log(formatTimeline(debug.timeline));

      console.log('');
      console.log('┈┈┈┈┈┈┈ 最终回复 ┈┈┈┈┈┈┈');
      console.log(`📤 ${data.reply || response.message || 'No reply'}`);

      results.push({
        id: testCase.id,
        category: testCase.category,
        input: testCase.input,
        expect: testCase.expect,
        actual: data.reply || 'No reply',
        duration,
        success: response.code === 0,
        debug: debug
      });

    } catch (error) {
      console.log(`❌ 请求错误: ${error.message}`);
      results.push({
        id: testCase.id,
        category: testCase.category,
        input: testCase.input,
        expect: testCase.expect,
        actual: `ERROR: ${error.message}`,
        duration: 0,
        success: false,
        debug: null
      });
    }

    console.log('═══════════════════════════════════════════════════════════════════');
  }

  // 保存结果到文件
  const fs = require('fs');
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('\n\n✅ 测试结果已保存到 test-results.json');

  // 输出统计
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 测试统计: ${successCount}/${results.length} 成功`);
}

runTests().catch(console.error);

