/**
 * AI Agent 日历工具测试
 *
 * 测试各种复杂的日期表达，验证 Agent 是否正确调用工具
 *
 * 运行方式: npx tsx src/tests/agentTest.ts
 *
 * 需要配置环境变量:
 *   LLM_API_KEY=你的API密钥
 *   LLM_PROVIDER=siliconflow
 *   LLM_API_ENDPOINT=https://api.siliconflow.cn
 *   LLM_MODEL=deepseek-ai/DeepSeek-V3
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// 检查 API Key
if (!process.env.LLM_API_KEY) {
  console.error('❌ 错误: 未配置 LLM_API_KEY')
  console.error('   请创建 services/ai-service/.env 文件并添加:')
  console.error('   LLM_API_KEY=你的硅基流动API密钥')
  console.error('   LLM_PROVIDER=siliconflow')
  console.error('   LLM_API_ENDPOINT=https://api.siliconflow.cn')
  console.error('   LLM_MODEL=deepseek-ai/DeepSeek-V3')
  process.exit(1)
}

import { agentService } from '../services/agentService'

// 测试用例接口
interface TestExpected {
  hasDate: boolean
  description: string
  minToolCalls?: number
}

interface TestCase {
  input: string
  expected: TestExpected
}

interface TestCategory {
  category: string
  cases: TestCase[]
}

// 测试用例
const testCases: TestCategory[] = [
  // ========== 基础日期 ==========
  {
    category: '基础日期',
    cases: [
      { input: '今天下午3点开会', expected: { hasDate: true, description: '应该获取今天日期' } },
      { input: '明天上午10点提醒我打电话', expected: { hasDate: true, description: '应该计算明天' } },
      { input: '后天去医院体检', expected: { hasDate: true, description: '应该计算后天' } },
      { input: '大后天交报告', expected: { hasDate: true, description: '应该计算3天后' } },
    ],
  },

  // ========== 相对周 ==========
  {
    category: '相对周',
    cases: [
      { input: '下周一开项目会议', expected: { hasDate: true, description: '应该获取下周一日期' } },
      { input: '这周五下班后聚餐', expected: { hasDate: true, description: '应该获取本周五日期' } },
      { input: '下周三下午2点面试', expected: { hasDate: true, description: '应该获取下周三日期' } },
      { input: '周末去爬山', expected: { hasDate: true, description: '应该获取本周末日期' } },
      { input: '下周末带孩子去游乐园', expected: { hasDate: true, description: '应该获取下周末日期' } },
    ],
  },

  // ========== 节假日查询 ==========
  {
    category: '节假日查询',
    cases: [
      { input: '春节放假安排', expected: { hasDate: true, description: '应该查询春节日期' } },
      { input: '国庆节去旅游', expected: { hasDate: true, description: '应该查询国庆日期' } },
      { input: '中秋节回家', expected: { hasDate: true, description: '应该查询中秋日期' } },
      { input: '下一个假期是什么时候', expected: { hasDate: true, description: '应该查询下一个节假日' } },
      { input: '五一假期订酒店', expected: { hasDate: true, description: '应该查询五一日期' } },
    ],
  },

  // ========== 复杂组合（多工具调用）==========
  {
    category: '复杂组合',
    cases: [
      { 
        input: '春节前一天订机票回家', 
        expected: { 
          hasDate: true, 
          description: '应该先查春节日期，再减1天',
          minToolCalls: 2,
        },
      },
      { 
        input: '国庆后三天返程', 
        expected: { 
          hasDate: true, 
          description: '应该先查国庆日期，再加3天',
          minToolCalls: 2,
        },
      },
      { 
        input: '中秋节前两天买月饼', 
        expected: { 
          hasDate: true, 
          description: '应该先查中秋日期，再减2天',
          minToolCalls: 2,
        },
      },
      { 
        input: '春节后第一个工作日上班', 
        expected: { 
          hasDate: true, 
          description: '应该查春节日期并找到节后工作日',
          minToolCalls: 2,
        },
      },
    ],
  },

  // ========== 具体日期 ==========
  {
    category: '具体日期',
    cases: [
      { input: '1月15号开年会', expected: { hasDate: true, description: '应该识别具体日期' } },
      { input: '3月8日妇女节活动', expected: { hasDate: true, description: '应该识别具体日期' } },
      { input: '12月25日圣诞节派对', expected: { hasDate: true, description: '应该识别具体日期' } },
    ],
  },

  // ========== 工作日判断 ==========
  {
    category: '工作日判断',
    cases: [
      { input: '明天是工作日吗', expected: { hasDate: true, description: '应该查询明天是否工作日' } },
      { input: '下周一需要上班吗', expected: { hasDate: true, description: '应该查询是否调休' } },
      { input: '这周六要加班吗', expected: { hasDate: true, description: '应该查询是否调休工作日' } },
    ],
  },

  // ========== 边界情况 ==========
  {
    category: '边界情况',
    cases: [
      { input: '10天后的会议', expected: { hasDate: true, description: '应该计算10天后' } },
      { input: '一个月后复查', expected: { hasDate: true, description: '应该计算约30天后' } },
      { input: '两周后交作业', expected: { hasDate: true, description: '应该计算14天后' } },
    ],
  },

  // ========== 非日期任务（对照组）==========
  {
    category: '非日期任务',
    cases: [
      { input: '你好', expected: { hasDate: false, description: '问候语，不需要日期' } },
      { input: '帮我查一下我的日程', expected: { hasDate: false, description: '查询任务，可能需要今天' } },
      { input: '谢谢', expected: { hasDate: false, description: '感谢语，不需要日期' } },
    ],
  },
]

// 运行测试
async function runTests() {
  console.log('🧪 AI Agent 日历工具测试')
  console.log('='.repeat(60))
  console.log()

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  const results: Array<{
    category: string
    input: string
    passed: boolean
    result?: {
      intent: string
      date?: string
      toolCalls: number
      tools: string[]
    }
    error?: string
  }> = []

  for (const category of testCases) {
    console.log(`\n📁 ${category.category}`)
    console.log('-'.repeat(40))

    for (const testCase of category.cases) {
      totalTests++
      console.log(`\n🔹 测试: "${testCase.input}"`)
      console.log(`   预期: ${testCase.expected.description}`)

      try {
        const startTime = Date.now()
        const result = await agentService.run(testCase.input)
        const duration = Date.now() - startTime

        const hasDate = !!result.entities.date
        const toolCallCount = result.toolCallHistory.length
        const toolNames = result.toolCallHistory.map(t => t.toolName)

        // 检查是否通过
        let passed = true
        const issues: string[] = []

        // 检查日期
        if (testCase.expected.hasDate && !hasDate) {
          passed = false
          issues.push('缺少日期')
        }

        // 检查工具调用次数
        if (testCase.expected.minToolCalls && toolCallCount < testCase.expected.minToolCalls) {
          passed = false
          issues.push(`工具调用不足 (${toolCallCount}/${testCase.expected.minToolCalls})`)
        }

        if (passed) {
          passedTests++
          console.log(`   ✅ 通过 (${duration}ms)`)
        } else {
          failedTests++
          console.log(`   ❌ 失败: ${issues.join(', ')}`)
        }

        console.log(`   📊 结果:`)
        console.log(`      意图: ${result.intent}`)
        console.log(`      日期: ${result.entities.date || '无'}`)
        console.log(`      工具调用: ${toolCallCount} 次 [${toolNames.join(', ') || '无'}]`)
        console.log(`      回复: ${result.reply.substring(0, 50)}...`)

        results.push({
          category: category.category,
          input: testCase.input,
          passed,
          result: {
            intent: result.intent,
            date: result.entities.date,
            toolCalls: toolCallCount,
            tools: toolNames,
          },
        })

      } catch (error) {
        failedTests++
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.log(`   ❌ 错误: ${errorMsg}`)
        results.push({
          category: category.category,
          input: testCase.input,
          passed: false,
          error: errorMsg,
        })
      }

      // 避免 API 限流
      await sleep(1000)
    }
  }

  // 打印汇总
  console.log('\n')
  console.log('='.repeat(60))
  console.log('📊 测试汇总')
  console.log('='.repeat(60))
  console.log(`总测试数: ${totalTests}`)
  console.log(`通过: ${passedTests} ✅`)
  console.log(`失败: ${failedTests} ❌`)
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

  // 打印失败的测试
  const failedResults = results.filter(r => !r.passed)
  if (failedResults.length > 0) {
    console.log('\n❌ 失败的测试:')
    for (const r of failedResults) {
      console.log(`   - [${r.category}] "${r.input}"`)
      if (r.error) {
        console.log(`     错误: ${r.error}`)
      }
    }
  }

  return { total: totalTests, passed: passedTests, failed: failedTests }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 运行
runTests()
  .then(summary => {
    console.log('\n✨ 测试完成')
    process.exit(summary.failed > 0 ? 1 : 0)
  })
  .catch(error => {
    console.error('💥 测试执行失败:', error)
    process.exit(1)
  })

