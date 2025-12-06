/**
 * 生成 AI2 微调数据集
 * 
 * 目标：2000 条多样化训练数据
 */

const fs = require('fs');
const path = require('path');

// ========== 多样化词库 ==========

// 时间表达
const TIME_TOMORROW = ['明天', '明儿', '明日', '第二天'];
const TIME_DAY_AFTER = ['后天', '后儿', '大后天的前一天'];
const TIME_3_DAYS = ['大后天', '三天后', '后天的后一天'];
const TIME_NEXT_WEEK = ['下周', '下个星期', '下礼拜', '下个周'];
const TIME_WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const TIME_MORNING = ['上午', '早上', '早晨', '一早'];
const TIME_AFTERNOON = ['下午', '午后'];
const TIME_EVENING = ['晚上', '傍晚', '夜里', '今晚'];
const TIME_HOURS = ['8点', '9点', '10点', '11点', '14点', '15点', '16点', '17点', '19点', '20点'];
const TIME_HOURS_CN = ['八点', '九点', '十点', '十一点', '两点', '三点', '四点', '五点', '七点', '八点'];

// 节日
const HOLIDAYS = [
  { name: '春节', aliases: ['过年', '新年', '大年初一', '正月初一'], date: '2026-01-29' },
  { name: '元宵节', aliases: ['正月十五', '元宵'], date: '2026-02-12' },
  { name: '清明节', aliases: ['清明', '扫墓节'], date: '2026-04-05' },
  { name: '端午节', aliases: ['端午', '粽子节', '龙舟节'], date: '2026-06-19' },
  { name: '中秋节', aliases: ['中秋', '月饼节', '团圆节'], date: '2026-09-25' },
  { name: '国庆节', aliases: ['国庆', '十一', '十·一'], date: '2026-10-01' },
  { name: '重阳节', aliases: ['重阳', '老人节'], date: '2026-10-25' },
  { name: '元旦', aliases: ['新年第一天', '1月1号'], date: '2026-01-01' },
  { name: '劳动节', aliases: ['五一', '劳动节', '5.1'], date: '2026-05-01' },
  { name: '儿童节', aliases: ['六一', '儿童节', '6.1'], date: '2026-06-01' },
];

// 节气
const SOLAR_TERMS = [
  { name: '冬至', date: '2025-12-22' },
  { name: '小寒', date: '2026-01-06' },
  { name: '大寒', date: '2026-01-20' },
  { name: '立春', date: '2026-02-04' },
  { name: '雨水', date: '2026-02-19' },
  { name: '惊蛰', date: '2026-03-06' },
  { name: '春分', date: '2026-03-21' },
  { name: '清明', date: '2026-04-05' },
  { name: '谷雨', date: '2026-04-20' },
];

// 事件标题多样化
const EVENT_TITLES = {
  meeting: ['开会', '会议', '团队会议', '周会', '例会', '站会', '评审会', '讨论会', '碰头会', 'sync会', '项目会', '部门会'],
  interview: ['面试', '面试候选人', '技术面试', '终面', '复试', '群面'],
  meal: ['聚餐', '吃饭', '约饭', '聚会', '饭局', '请客', '团建聚餐', '同事聚餐', '朋友聚会', '家庭聚餐'],
  work: ['交报告', '提交论文', '交作业', '提交方案', '交设计稿', '提交代码', '发周报', '交ppt', '提交材料'],
  exercise: ['跑步', '健身', '运动', '游泳', '打球', '瑜伽', '骑车', '爬山', '散步', '慢跑'],
  personal: ['看电影', '逛街', '购物', '理发', '看病', '体检', '取快递', '寄快递', '还书', '拿药'],
  study: ['上课', '培训', '学习', '考试', '复习', '预习', '写作业', '看书', '听讲座', '参加培训'],
  travel: ['出差', '出行', '旅行', '回家', '回老家', '接人', '送人', '接机', '送机'],
  anniversary: ['生日', '结婚纪念日', '恋爱纪念日', '入职周年', '毕业纪念日'],
  reminder: ['提醒', '记得', '别忘了', '要记住'],
};

// 提醒表达
const NOTIFY_BEFORE = ['提前', '提前个', '之前'];
const NOTIFY_MINUTES = ['15分钟', '一刻钟', '半小时', '30分钟', '1小时', '一小时', '2小时', '两小时'];
const NOTIFY_NO = ['不用提醒', '不需要提醒', '别提醒我', '不设提醒', '不要提醒', '无需提醒', '不提醒'];
const NOTIFY_DAY = ['当天早上', '那天早上', '当天上午', '那天', '当天'];

// 语气词
const TONE_POLITE = ['请帮我', '麻烦帮我', '能帮我', '帮我', '请', '麻烦'];
const TONE_CASUAL = ['', '我想', '我要', '帮我', '给我'];
const TONE_SIMPLE = ['', ''];
const TONE_END = ['', '谢谢', '感谢', '辛苦了', '拜托了', '好吗', '可以吗', '行吗'];

// 截止任务表达
const DEADLINE_BEFORE = ['之前', '前', '以前'];
const DEADLINE_DAILY = ['每天早上', '每天上午', '每天', '每日', '天天'];

// ========== 工具函数 ==========

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function maybe(prob = 0.5) {
  return Math.random() < prob;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start = '2025-12-07', daysRange = 30) {
  const base = new Date(start);
  base.setDate(base.getDate() + randomInt(0, daysRange));
  return base.toISOString().split('T')[0];
}

function formatTime(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

// 生成当前时间上下文
function genDateTimeContext() {
  const hours = randomInt(8, 22);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const day = randomInt(0, 6);
  return {
    date: '2025-12-06',
    time: `${hours.toString().padStart(2, '0')}:${randomInt(0, 59).toString().padStart(2, '0')}`,
    weekday: `星期${weekdays[day]}`
  };
}

// ========== 样本生成器 ==========

const samples = [];

// 生成系统消息
function genSystemMsg(ctx) {
  return `你是 GoalPilot 的后端执行智能体 (AI2)。当前时间: ${ctx.date} ${ctx.time} ${ctx.weekday}。根据指令调用工具完成操作，然后生成简洁的确认回复。`;
}

// 1. 简单日程 - 明天/后天/指定日期
function genSimpleEvent() {
  const ctx = genDateTimeContext();
  const category = pick(Object.keys(EVENT_TITLES));
  const title = pick(EVENT_TITLES[category]);
  
  // 时间表达多样化
  let rawTimeStr, calcDate, timeHour;
  const timeType = randomInt(1, 6);
  
  switch (timeType) {
    case 1: // 明天
      rawTimeStr = pick(TIME_TOMORROW);
      calcDate = '2025-12-07';
      break;
    case 2: // 后天
      rawTimeStr = pick(TIME_DAY_AFTER);
      calcDate = '2025-12-08';
      break;
    case 3: // 大后天
      rawTimeStr = pick(TIME_3_DAYS);
      calcDate = '2025-12-09';
      break;
    case 4: // 下周X
      const weekday = randomInt(1, 7);
      rawTimeStr = `${pick(TIME_NEXT_WEEK)}${TIME_WEEKDAYS[weekday - 1]}`;
      const baseDate = new Date('2025-12-06');
      const daysToAdd = ((7 - baseDate.getDay() + weekday) % 7) + 7;
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      calcDate = baseDate.toISOString().split('T')[0];
      break;
    case 5: // 这周X
      const thisWeekday = randomInt(1, 7);
      rawTimeStr = `这${pick(['周', '个星期', '礼拜'])}${TIME_WEEKDAYS[thisWeekday - 1]}`;
      const base = new Date('2025-12-06');
      const diff = thisWeekday - base.getDay();
      base.setDate(base.getDate() + (diff <= 0 ? diff + 7 : diff));
      calcDate = base.toISOString().split('T')[0];
      break;
    default: // 具体日期
      const day = randomInt(7, 28);
      rawTimeStr = `${randomInt(1, 12)}月${day}号`;
      calcDate = `2026-${rawTimeStr.split('月')[0].padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // 是否全天
  const isAllDay = category === 'anniversary' || maybe(0.2);
  
  if (!isAllDay) {
    const hour = randomInt(8, 20);
    const period = hour < 12 ? pick(TIME_MORNING) : (hour < 18 ? pick(TIME_AFTERNOON) : pick(TIME_EVENING));
    const displayHour = hour > 12 ? hour - 12 : hour;
    rawTimeStr += `${period}${maybe() ? displayHour + '点' : hour + ':00'}`;
    timeHour = hour;
  }
  
  // 提醒表达
  let rawNotifyStr, notifyOffset;
  const notifyType = randomInt(1, 4);
  
  switch (notifyType) {
    case 1: // 提前X分钟
      const mins = pick([15, 30, 60, 120]);
      rawNotifyStr = `${pick(NOTIFY_BEFORE)}${mins === 15 ? pick(['15分钟', '一刻钟']) : mins === 30 ? pick(['30分钟', '半小时']) : mins === 60 ? pick(['1小时', '一小时', '一个小时']) : pick(['2小时', '两小时'])}${maybe(0.5) ? '提醒' : ''}`;
      notifyOffset = mins;
      break;
    case 2: // 不提醒
      rawNotifyStr = pick(NOTIFY_NO);
      notifyOffset = -1;
      break;
    case 3: // 当天提醒（全天事件）
      if (isAllDay) {
        rawNotifyStr = `${pick(NOTIFY_DAY)}${randomInt(8, 10)}点提醒`;
        notifyOffset = 0;
      } else {
        rawNotifyStr = `${pick(NOTIFY_BEFORE)}15分钟`;
        notifyOffset = 15;
      }
      break;
    default: // 默认提醒
      rawNotifyStr = '';
      notifyOffset = 15;
  }
  
  // 语气多样化
  const tone = pick([...TONE_POLITE, ...TONE_CASUAL, ...TONE_SIMPLE]);
  const endTone = maybe(0.3) ? pick(TONE_END) : '';
  
  // 构建用户输入
  const userInput = {
    intent: 'create_event',
    payload: {
      title,
      raw_time_str: rawTimeStr,
      raw_notify_str: rawNotifyStr,
      is_all_day: isAllDay
    }
  };
  
  // 构建工具调用
  const toolArgs = {
    title,
    start_time: isAllDay ? calcDate : `${calcDate} ${formatTime(timeHour || 10)}`,
    is_all_day: isAllDay,
    notify_offset: notifyOffset
  };
  
  if (isAllDay && notifyOffset === 0) {
    toolArgs.notify_time = `${randomInt(8, 10).toString().padStart(2, '0')}:00`;
  }
  
  // 构建回复
  const dateDisplay = calcDate.replace(/^\d{4}-/, '').replace('-', '月') + '日';
  const timeDisplay = isAllDay ? '' : ` ${formatTime(timeHour || 10)}`;
  const notifyDisplay = notifyOffset === -1 ? '，不设置提醒' : notifyOffset > 0 ? `，提前 ${notifyOffset} 分钟提醒` : '';
  
  const replyPrefixes = ['📅 已创建日程：', '✅ 好的，已安排：', '📌 已为您添加：', '👌 没问题，已创建：'];
  const reply = `${pick(replyPrefixes)}${dateDisplay}${timeDisplay} ${title}${notifyDisplay}。`;
  
  return {
    messages: [
      { role: 'system', content: genSystemMsg(ctx) },
      { role: 'user', content: JSON.stringify(userInput) },
      { role: 'assistant', content: null, tool_calls: [{ id: `call_${Date.now()}`, type: 'function', function: { name: 'add_event', arguments: JSON.stringify(toolArgs) } }] },
      { role: 'tool', content: JSON.stringify({ success: true, message: `已创建日程：${title}`, data: { id: `evt_${Date.now()}` } }), tool_call_id: `call_${Date.now()}` },
      { role: 'assistant', content: reply }
    ]
  };
}

// 2. 节日相关日程 - 需要调用 find_holiday
function genHolidayEvent() {
  const ctx = genDateTimeContext();
  const holiday = pick(HOLIDAYS);
  const holidayName = maybe(0.7) ? holiday.name : pick(holiday.aliases);
  const category = pick(['meal', 'travel', 'personal', 'anniversary']);
  const title = pick(EVENT_TITLES[category]);

  // 节日时间表达
  let rawTimeStr, needOffset = false, offsetDays = 0;
  const exprType = randomInt(1, 5);

  switch (exprType) {
    case 1: // 节日当天
      rawTimeStr = `${holidayName}${pick(['', '那天', '当天', '那一天'])}`;
      break;
    case 2: // 节日前X天
      offsetDays = -randomInt(1, 5);
      rawTimeStr = `${holidayName}前${Math.abs(offsetDays)}天`;
      needOffset = true;
      break;
    case 3: // 节日后X天
      offsetDays = randomInt(1, 5);
      rawTimeStr = `${holidayName}后${offsetDays}天`;
      needOffset = true;
      break;
    case 4: // 节日前一周
      offsetDays = -7;
      rawTimeStr = `${holidayName}${pick(['前一周', '前一个星期', '之前一周'])}`;
      needOffset = true;
      break;
    default:
      rawTimeStr = holidayName;
  }

  const isAllDay = category === 'anniversary' || maybe(0.4);
  let timeHour = null;

  if (!isAllDay) {
    timeHour = randomInt(9, 19);
    const period = timeHour < 12 ? pick(TIME_MORNING) : pick(TIME_AFTERNOON);
    rawTimeStr += ` ${period}${timeHour > 12 ? timeHour - 12 : timeHour}点`;
  }

  // 提醒
  let rawNotifyStr, notifyOffset;
  if (maybe(0.3)) {
    rawNotifyStr = pick(NOTIFY_NO);
    notifyOffset = -1;
  } else if (isAllDay) {
    rawNotifyStr = `${pick(NOTIFY_DAY)}${randomInt(8, 10)}点提醒`;
    notifyOffset = 0;
  } else {
    const mins = pick([15, 30, 60]);
    rawNotifyStr = `${pick(NOTIFY_BEFORE)}${mins}分钟提醒`;
    notifyOffset = mins;
  }

  const userInput = {
    intent: 'create_event',
    payload: { title, raw_time_str: rawTimeStr, raw_notify_str: rawNotifyStr, is_all_day: isAllDay }
  };

  // 计算实际日期
  const holidayDate = new Date(holiday.date);
  holidayDate.setDate(holidayDate.getDate() + offsetDays);
  const finalDate = holidayDate.toISOString().split('T')[0];

  // 构建消息
  const messages = [
    { role: 'system', content: genSystemMsg(ctx) },
    { role: 'user', content: JSON.stringify(userInput) },
    // find_holiday
    { role: 'assistant', content: null, tool_calls: [{ id: 'call_fh', type: 'function', function: { name: 'find_holiday', arguments: JSON.stringify({ name: holiday.name }) } }] },
    { role: 'tool', content: JSON.stringify({ name: holiday.name, date: holiday.date, year: 2026 }), tool_call_id: 'call_fh' }
  ];

  // 如果需要偏移，添加 calc_date
  if (needOffset) {
    messages.push({ role: 'assistant', content: null, tool_calls: [{ id: 'call_cd', type: 'function', function: { name: 'calc_date', arguments: JSON.stringify({ base_date: holiday.date, offset_days: offsetDays }) } }] });
    messages.push({ role: 'tool', content: finalDate, tool_call_id: 'call_cd' });
  }

  // add_event
  const toolArgs = {
    title,
    start_time: isAllDay ? finalDate : `${finalDate} ${formatTime(timeHour || 10)}`,
    is_all_day: isAllDay,
    notify_offset: notifyOffset
  };
  if (isAllDay && notifyOffset === 0) {
    toolArgs.notify_time = `0${randomInt(8, 9)}:00`;
  }

  messages.push({ role: 'assistant', content: null, tool_calls: [{ id: 'call_ae', type: 'function', function: { name: 'add_event', arguments: JSON.stringify(toolArgs) } }] });
  messages.push({ role: 'tool', content: JSON.stringify({ success: true, message: `已创建日程：${title}`, data: { id: 'evt_123' } }), tool_call_id: 'call_ae' });

  const dateDisplay = finalDate.slice(5).replace('-', '月') + '日';
  const reply = `${pick(['🎉', '📅', '✅', '👌'])} 已${pick(['创建', '安排', '添加'])}：${holiday.name}${needOffset ? (offsetDays < 0 ? `前${Math.abs(offsetDays)}天` : `后${offsetDays}天`) : ''}(${dateDisplay}) ${title}。`;
  messages.push({ role: 'assistant', content: reply });

  return { messages };
}

// 3. 截止任务 deadline
function genDeadline() {
  const ctx = genDateTimeContext();
  const category = pick(['work', 'study']);
  const title = pick(EVENT_TITLES[category]);

  // 截止时间表达
  let rawTimeStr, dueDate;
  const exprType = randomInt(1, 5);

  switch (exprType) {
    case 1: // 月底前
      rawTimeStr = pick(['月底前', '月底之前', '这个月底前', '本月底前', '月末前']);
      dueDate = '2025-12-31';
      break;
    case 2: // X号前
      const day = randomInt(10, 28);
      rawTimeStr = `${day}${pick(['号前', '号之前', '日前', '日之前'])}`;
      dueDate = `2025-12-${day.toString().padStart(2, '0')}`;
      break;
    case 3: // 下周X前
      const weekday = randomInt(1, 5);
      rawTimeStr = `${pick(TIME_NEXT_WEEK)}${TIME_WEEKDAYS[weekday - 1]}${pick(DEADLINE_BEFORE)}`;
      const base = new Date('2025-12-06');
      base.setDate(base.getDate() + ((7 - base.getDay() + weekday) % 7) + 7);
      dueDate = base.toISOString().split('T')[0];
      break;
    case 4: // 明天/后天前
      rawTimeStr = `${pick(TIME_TOMORROW)}${pick(DEADLINE_BEFORE)}`;
      dueDate = '2025-12-07';
      break;
    default: // X天后
      const days = randomInt(3, 14);
      rawTimeStr = `${days}天${pick(['后', '之后', '以后', '内'])}`;
      const d = new Date('2025-12-06');
      d.setDate(d.getDate() + days);
      dueDate = d.toISOString().split('T')[0];
  }

  // 每日提醒时间
  const remindHour = randomInt(8, 10);
  const rawNotifyStr = `${pick(DEADLINE_DAILY)}${remindHour}点${maybe(0.5) ? '提醒' : ''}`;

  const userInput = {
    intent: 'create_deadline',
    payload: { title, raw_time_str: rawTimeStr, raw_notify_str: rawNotifyStr }
  };

  const messages = [
    { role: 'system', content: genSystemMsg(ctx) },
    { role: 'user', content: JSON.stringify(userInput) },
    { role: 'assistant', content: null, tool_calls: [{ id: 'call_dl', type: 'function', function: { name: 'add_deadline', arguments: JSON.stringify({ title, due_time: `${dueDate} 23:59`, daily_remind_time: `${remindHour.toString().padStart(2, '0')}:00` }) } }] },
    { role: 'tool', content: JSON.stringify({ success: true, message: `已创建截止任务：${title}`, data: { id: 'dl_123' } }), tool_call_id: 'call_dl' }
  ];

  const dateDisplay = dueDate.slice(5).replace('-', '月') + '日';
  const reply = `${pick(['📦', '⏰', '✅', '📌'])} 已创建任务：${title}，截止 ${dateDisplay} 23:59，${pick(DEADLINE_DAILY)}${remindHour}点提醒。`;
  messages.push({ role: 'assistant', content: reply });

  return { messages };
}

// 4. 设置提醒间隔
function genReminderInterval() {
  const ctx = genDateTimeContext();

  const intervals = [
    { minutes: 30, exprs: ['半小时', '30分钟', '半个小时'] },
    { minutes: 60, exprs: ['1小时', '一小时', '一个小时', '60分钟'] },
    { minutes: 90, exprs: ['1个半小时', '一个半小时', '90分钟'] },
    { minutes: 120, exprs: ['2小时', '两小时', '两个小时', '120分钟'] },
    { minutes: 180, exprs: ['3小时', '三小时', '三个小时'] },
  ];

  const interval = pick(intervals);
  const rawDurationStr = `${pick(['每隔', '每', '间隔', ''])}${pick(interval.exprs)}${maybe(0.5) ? '提醒一次' : ''}`;

  const userInput = {
    intent: 'set_reminder_interval',
    payload: { raw_duration_str: rawDurationStr }
  };

  const messages = [
    { role: 'system', content: genSystemMsg(ctx) },
    { role: 'user', content: JSON.stringify(userInput) },
    { role: 'assistant', content: null, tool_calls: [{ id: 'call_ri', type: 'function', function: { name: 'set_reminder_interval', arguments: JSON.stringify({ interval_minutes: interval.minutes }) } }] },
    { role: 'tool', content: JSON.stringify({ success: true, message: `已设置提醒间隔为每 ${interval.minutes} 分钟` }), tool_call_id: 'call_ri' },
    { role: 'assistant', content: `${pick(['👌', '✅', '⏰', '🔔'])} ${pick(['没问题', '好的', 'OK', '设置完成'])}，今天的任务${pick(interval.exprs)}提醒一次。` }
  ];

  return { messages };
}

// 5. 开关早晚安
function genToggleNotification() {
  const ctx = genDateTimeContext();

  const targets = [
    { target: 'morning', names: ['早安', '早安提醒', '早上提醒', '早间推送'] },
    { target: 'evening', names: ['晚安', '晚安提醒', '晚上提醒', '晚间推送'] },
    { target: 'both', names: ['早晚安', '早晚提醒', '每日提醒'] },
  ];

  const actions = [
    { action: 'on', verbs: ['打开', '开启', '开', '启用', '恢复'] },
    { action: 'off', verbs: ['关闭', '关', '关掉', '停止', '暂停', '取消'] },
  ];

  const target = pick(targets);
  const action = pick(actions);

  const userInput = {
    intent: 'toggle_notification',
    payload: { target: target.target, action: action.action }
  };

  const messages = [
    { role: 'system', content: genSystemMsg(ctx) },
    { role: 'user', content: JSON.stringify(userInput) },
    { role: 'assistant', content: null, tool_calls: [{ id: 'call_tn', type: 'function', function: { name: 'toggle_daily_brief', arguments: JSON.stringify({ target: target.target, status: action.action }) } }] },
    { role: 'tool', content: JSON.stringify({ success: true, message: `已${action.action === 'on' ? '开启' : '关闭'}${pick(target.names)}` }), tool_call_id: 'call_tn' },
    { role: 'assistant', content: `${action.action === 'on' ? '🔔' : '🔕'} 已${action.action === 'on' ? '开启' : '关闭'}${pick(target.names)}。` }
  ];

  return { messages };
}

// 6. 查询日程
function genQueryAgenda() {
  const ctx = genDateTimeContext();

  // 查询时间表达
  let rawTimeStr, queryDate;
  const exprType = randomInt(1, 5);

  switch (exprType) {
    case 1:
      rawTimeStr = pick(['今天', '今儿', '今日']);
      queryDate = '2025-12-06';
      break;
    case 2:
      rawTimeStr = pick(TIME_TOMORROW);
      queryDate = '2025-12-07';
      break;
    case 3:
      rawTimeStr = pick(TIME_DAY_AFTER);
      queryDate = '2025-12-08';
      break;
    case 4:
      const weekday = randomInt(1, 7);
      rawTimeStr = `${pick(TIME_NEXT_WEEK)}${TIME_WEEKDAYS[weekday - 1]}`;
      const base = new Date('2025-12-06');
      base.setDate(base.getDate() + ((7 - base.getDay() + weekday) % 7) + 7);
      queryDate = base.toISOString().split('T')[0];
      break;
    default:
      const day = randomInt(7, 20);
      rawTimeStr = `${day}号`;
      queryDate = `2025-12-${day.toString().padStart(2, '0')}`;
  }

  const askStyle = pick([
    `${rawTimeStr}有什么安排`,
    `${rawTimeStr}的日程`,
    `${rawTimeStr}忙不忙`,
    `看看${rawTimeStr}有什么事`,
    `查一下${rawTimeStr}的安排`,
    `${rawTimeStr}有空吗`,
  ]);

  const userInput = {
    intent: 'query_agenda',
    payload: { raw_time_str: rawTimeStr }
  };

  // 模拟返回数据
  const hasEvents = maybe(0.7);
  const events = hasEvents ? [
    { title: pick(EVENT_TITLES.meeting), startTime: `${randomInt(9, 11)}:00` },
    { title: pick(EVENT_TITLES.meal), startTime: `${randomInt(12, 13)}:00` },
  ] : [];

  const messages = [
    { role: 'system', content: genSystemMsg(ctx) },
    { role: 'user', content: JSON.stringify(userInput) },
    { role: 'assistant', content: null, tool_calls: [{ id: 'call_qa', type: 'function', function: { name: 'get_agenda', arguments: JSON.stringify({ query_date: queryDate }) } }] },
    { role: 'tool', content: JSON.stringify({ success: true, message: `${queryDate} 有 ${events.length} 个日程`, data: { events, deadlines: [] } }), tool_call_id: 'call_qa' }
  ];

  const dateDisplay = queryDate.slice(5).replace('-', '月') + '日';
  let reply;
  if (hasEvents) {
    reply = `📋 ${dateDisplay}的安排：\n${events.map(e => `• ${e.startTime} ${e.title}`).join('\n')}`;
  } else {
    reply = `📋 ${dateDisplay}${pick(['没有安排', '暂无日程', '是空闲的', '没什么事'])}。`;
  }
  messages.push({ role: 'assistant', content: reply });

  return { messages };
}

// ========== 主程序 ==========

console.log('🚀 开始生成数据集...\n');

// 按比例生成
const TOTAL = 2000;
const distribution = {
  simpleEvent: 500,      // 简单日程
  holidayEvent: 400,     // 节日相关
  deadline: 400,         // 截止任务
  reminderInterval: 250, // 提醒间隔
  toggleNotification: 200, // 开关推送
  queryAgenda: 250,      // 查询日程
};

console.log('📊 生成分布：');
Object.entries(distribution).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
console.log('');

// 生成
for (let i = 0; i < distribution.simpleEvent; i++) {
  samples.push(genSimpleEvent());
}
console.log(`✓ 简单日程: ${distribution.simpleEvent}`);

for (let i = 0; i < distribution.holidayEvent; i++) {
  samples.push(genHolidayEvent());
}
console.log(`✓ 节日相关: ${distribution.holidayEvent}`);

for (let i = 0; i < distribution.deadline; i++) {
  samples.push(genDeadline());
}
console.log(`✓ 截止任务: ${distribution.deadline}`);

for (let i = 0; i < distribution.reminderInterval; i++) {
  samples.push(genReminderInterval());
}
console.log(`✓ 提醒间隔: ${distribution.reminderInterval}`);

for (let i = 0; i < distribution.toggleNotification; i++) {
  samples.push(genToggleNotification());
}
console.log(`✓ 开关推送: ${distribution.toggleNotification}`);

for (let i = 0; i < distribution.queryAgenda; i++) {
  samples.push(genQueryAgenda());
}
console.log(`✓ 查询日程: ${distribution.queryAgenda}`);

// 打乱顺序
samples.sort(() => Math.random() - 0.5);

// 写入文件
const outputFile = path.join(__dirname, 'ai2_dataset_v1.jsonl');
const lines = samples.map(s => JSON.stringify(s));
fs.writeFileSync(outputFile, lines.join('\n'));

console.log(`\n✅ 已生成 ${samples.length} 条样本到 ${outputFile}`);

