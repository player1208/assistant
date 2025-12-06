/**
 * 生成 100 条验证数据集
 * 格式与训练集一致（纯文本格式）
 */

const fs = require('fs');
const path = require('path');

// 工具函数
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const maybe = prob => Math.random() < prob;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 词汇库（与训练集不同的表达方式，增加验证难度）
const TITLES = {
  meeting: ['开早会', '周例会', '电话会', '视频会议', '汇报工作', '述职'],
  meal: ['约饭', '吃火锅', '喝下午茶', '吃烧烤', '请客吃饭'],
  work: ['写周报', '做PPT', '整理文档', '回复邮件', '处理工单'],
  personal: ['剪头发', '取快递', '交水电费', '充话费', '去银行'],
  exercise: ['晨跑', '夜跑', '健身', '瑜伽', '游泳'],
  study: ['刷题', '背单词', '练口语', '看网课', '写作业']
};

const HOLIDAYS = [
  { name: '春节', date: '2026-01-29' },
  { name: '元宵节', date: '2026-02-12' },
  { name: '清明节', date: '2026-04-05' },
  { name: '端午节', date: '2026-06-19' },
  { name: '中秋节', date: '2026-09-25' },
  { name: '国庆节', date: '2026-10-01' },
  { name: '重阳节', date: '2026-10-25' },
];

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 生成上下文
function genContext() {
  const hours = randomInt(8, 21);
  const mins = randomInt(0, 59);
  const weekday = randomInt(0, 6);
  return {
    date: '2025-12-06',
    time: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
    weekdayName: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][weekday]
  };
}

function genSystemMsg(ctx) {
  return `你是 GoalPilot 的后端执行智能体 (AI2)。当前时间: ${ctx.date} ${ctx.time} ${ctx.weekdayName}。根据指令调用工具完成操作，然后生成简洁的确认回复。`;
}

const samples = [];

// 1. 简单日程 (25条)
for (let i = 0; i < 25; i++) {
  const ctx = genContext();
  const category = pick(Object.keys(TITLES));
  const title = pick(TITLES[category]);
  
  const timeType = randomInt(1, 4);
  let rawTimeStr, startTime;
  
  switch (timeType) {
    case 1: // 明天
      rawTimeStr = `明天${pick(['早上', '下午', '晚上'])}${randomInt(8, 20)}点`;
      startTime = `2025-12-07 ${randomInt(8, 20).toString().padStart(2, '0')}:00`;
      break;
    case 2: // 后天
      rawTimeStr = `后天${randomInt(9, 18)}点`;
      startTime = `2025-12-08 ${randomInt(9, 18).toString().padStart(2, '0')}:00`;
      break;
    case 3: // 下周X
      const wd = randomInt(1, 5);
      rawTimeStr = `下周${WEEKDAYS[wd - 1]}${randomInt(9, 17)}点`;
      const d = new Date('2025-12-06');
      d.setDate(d.getDate() + (7 - d.getDay() + wd));
      startTime = `${d.toISOString().split('T')[0]} ${randomInt(9, 17).toString().padStart(2, '0')}:00`;
      break;
    default: // 具体日期
      const day = randomInt(10, 25);
      rawTimeStr = `${day}号${randomInt(9, 18)}点`;
      startTime = `2025-12-${day.toString().padStart(2, '0')} ${randomInt(9, 18).toString().padStart(2, '0')}:00`;
  }
  
  const notifyOffset = pick([15, 30, 60, -1]);
  const rawNotifyStr = notifyOffset === -1 ? '不提醒' : `提前${notifyOffset}分钟`;
  
  samples.push({
    messages: [
      { role: 'system', content: genSystemMsg(ctx) },
      { role: 'user', content: `意图: create_event\n事件: ${title}\n时间: ${rawTimeStr}\n提醒: ${rawNotifyStr}\n全天: 否` },
      { role: 'assistant', content: `【执行步骤】\n1. add_event(title="${title}", start_time="${startTime}", is_all_day=false, notify_offset=${notifyOffset})\n\n【回复用户】\n✅ 已创建：${title}，${notifyOffset > 0 ? `提前${notifyOffset}分钟提醒` : '不设置提醒'}。` }
    ]
  });
}

// 2. 节日相关 (25条)
for (let i = 0; i < 25; i++) {
  const ctx = genContext();
  const holiday = pick(HOLIDAYS);
  const category = pick(['meal', 'personal', 'exercise']);
  const title = pick(TITLES[category]);
  
  const offsetType = randomInt(1, 3);
  let rawTimeStr, offsetDays = 0, finalDate = holiday.date;
  
  switch (offsetType) {
    case 1: // 当天
      rawTimeStr = `${holiday.name}那天`;
      break;
    case 2: // 前X天
      offsetDays = -randomInt(1, 3);
      rawTimeStr = `${holiday.name}前${Math.abs(offsetDays)}天`;
      const d1 = new Date(holiday.date);
      d1.setDate(d1.getDate() + offsetDays);
      finalDate = d1.toISOString().split('T')[0];
      break;
    default: // 后X天
      offsetDays = randomInt(1, 3);
      rawTimeStr = `${holiday.name}后${offsetDays}天`;
      const d2 = new Date(holiday.date);
      d2.setDate(d2.getDate() + offsetDays);
      finalDate = d2.toISOString().split('T')[0];
  }
  
  let steps = `1. find_holiday(name="${holiday.name}")\n`;
  if (offsetDays !== 0) {
    steps += `2. calc_date(base_date="${holiday.date}", offset_days=${offsetDays})\n`;
    steps += `3. add_event(title="${title}", start_time="${finalDate}", is_all_day=true, notify_offset=0)\n`;
  } else {
    steps += `2. add_event(title="${title}", start_time="${finalDate}", is_all_day=true, notify_offset=0)\n`;
  }
  
  samples.push({
    messages: [
      { role: 'system', content: genSystemMsg(ctx) },
      { role: 'user', content: `意图: create_event\n事件: ${title}\n时间: ${rawTimeStr}\n提醒: 当天提醒\n全天: 是` },
      { role: 'assistant', content: `【执行步骤】\n${steps}\n【回复用户】\n🎉 已安排：${rawTimeStr} ${title}。` }
    ]
  });
}

// 3. 截止任务 (20条)
for (let i = 0; i < 20; i++) {
  const ctx = genContext();
  const title = pick([...TITLES.work, ...TITLES.study]);
  
  const deadlineType = randomInt(1, 4);
  let rawTimeStr, dueDate;
  
  switch (deadlineType) {
    case 1:
      rawTimeStr = '月底前';
      dueDate = '2025-12-31';
      break;
    case 2:
      const day = randomInt(15, 28);
      rawTimeStr = `${day}号之前`;
      dueDate = `2025-12-${day.toString().padStart(2, '0')}`;
      break;
    case 3:
      rawTimeStr = '下周五前';
      dueDate = '2025-12-12';
      break;
    default:
      rawTimeStr = '三天内';
      dueDate = '2025-12-09';
  }
  
  const remindHour = randomInt(8, 10);
  
  samples.push({
    messages: [
      { role: 'system', content: genSystemMsg(ctx) },
      { role: 'user', content: `意图: create_deadline\n事件: ${title}\n时间: ${rawTimeStr}\n提醒: 每天${remindHour}点` },
      { role: 'assistant', content: `【执行步骤】\n1. add_deadline(title="${title}", due_time="${dueDate} 23:59", daily_remind_time="${remindHour.toString().padStart(2, '0')}:00")\n\n【回复用户】\n📌 已创建任务：${title}，截止${rawTimeStr}，每天${remindHour}点提醒。` }
    ]
  });
}

// 4. 提醒间隔 (10条)
for (let i = 0; i < 10; i++) {
  const ctx = genContext();
  const intervals = [
    { mins: 30, text: '半小时' },
    { mins: 60, text: '一小时' },
    { mins: 90, text: '一个半小时' },
    { mins: 120, text: '两小时' },
  ];
  const interval = pick(intervals);
  
  samples.push({
    messages: [
      { role: 'system', content: genSystemMsg(ctx) },
      { role: 'user', content: `意图: set_reminder_interval\n间隔: 每${interval.text}提醒一次` },
      { role: 'assistant', content: `【执行步骤】\n1. set_reminder_interval(interval_minutes=${interval.mins})\n\n【回复用户】\n⏰ 好的，每${interval.text}提醒您一次。` }
    ]
  });
}

// 5. 开关通知 (10条)
for (let i = 0; i < 10; i++) {
  const ctx = genContext();
  const target = pick(['morning', 'evening', 'both']);
  const action = pick(['on', 'off']);
  const targetName = { morning: '早安', evening: '晚安', both: '早晚安' }[target];
  const actionName = action === 'on' ? '开启' : '关闭';
  
  samples.push({
    messages: [
      { role: 'system', content: genSystemMsg(ctx) },
      { role: 'user', content: `意图: toggle_notification\n目标: ${target}\n操作: ${action}` },
      { role: 'assistant', content: `【执行步骤】\n1. toggle_daily_brief(target="${target}", status="${action}")\n\n【回复用户】\n${action === 'on' ? '🔔' : '🔕'} 已${actionName}${targetName}提醒。` }
    ]
  });
}

// 6. 查询日程 (10条)
for (let i = 0; i < 10; i++) {
  const ctx = genContext();
  const queryType = randomInt(1, 3);
  let rawTimeStr, queryDate;
  
  switch (queryType) {
    case 1:
      rawTimeStr = '明天';
      queryDate = '2025-12-07';
      break;
    case 2:
      rawTimeStr = '后天';
      queryDate = '2025-12-08';
      break;
    default:
      const wd = randomInt(1, 5);
      rawTimeStr = `下周${WEEKDAYS[wd - 1]}`;
      const d = new Date('2025-12-06');
      d.setDate(d.getDate() + (7 - d.getDay() + wd));
      queryDate = d.toISOString().split('T')[0];
  }
  
  const hasEvents = maybe(0.6);
  const reply = hasEvents 
    ? `📋 ${rawTimeStr}有2个安排：\n• 10:00 开会\n• 14:00 面试`
    : `📋 ${rawTimeStr}没有安排，可以休息。`;
  
  samples.push({
    messages: [
      { role: 'system', content: genSystemMsg(ctx) },
      { role: 'user', content: `意图: query_agenda\n时间: ${rawTimeStr}` },
      { role: 'assistant', content: `【执行步骤】\n1. get_agenda(query_date="${queryDate}")\n\n【回复用户】\n${reply}` }
    ]
  });
}

// 打乱顺序
samples.sort(() => Math.random() - 0.5);

// 写入文件
const outputFile = path.join(__dirname, 'ai2_validation.jsonl');
fs.writeFileSync(outputFile, samples.map(s => JSON.stringify(s)).join('\n'));

console.log(`✅ 已生成 ${samples.length} 条验证数据`);
console.log(`📁 输出: ${outputFile}`);

// 统计
const stats = { create_event: 0, create_deadline: 0, set_reminder_interval: 0, toggle_notification: 0, query_agenda: 0 };
samples.forEach(s => {
  const user = s.messages[1].content;
  if (user.includes('create_event')) stats.create_event++;
  else if (user.includes('create_deadline')) stats.create_deadline++;
  else if (user.includes('set_reminder_interval')) stats.set_reminder_interval++;
  else if (user.includes('toggle_notification')) stats.toggle_notification++;
  else if (user.includes('query_agenda')) stats.query_agenda++;
});

console.log('\n📊 分布:');
Object.entries(stats).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

