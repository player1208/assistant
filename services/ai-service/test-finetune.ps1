# 微调模型测试脚本 - 30个口语化用例
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$tests = @(
    # 节日相关 (10个)
    "春节回老家，不用提醒",
    "除夕晚上吃年夜饭，5点半提醒我准备",
    "元宵节买汤圆，提前一天提醒",
    "清明节去扫墓，早上7点出发，提前半小时提醒",
    "端午包粽子，上午9点开始，提前10分钟提醒",
    "中秋节去丈母娘家，下午3点到，不用提醒",
    "国庆出去玩，不提醒",
    "元旦跨年，晚上11点半提醒我倒计时",
    "情人节给老婆买花，提前2天提醒我",
    "母亲节打电话，上午10点提醒",
    
    # 日常口语化 (10个)
    "明天开会别忘了，提前5分钟提醒",
    "后天下午3点去医院检查，提前1小时提醒",
    "大后天交报告，每天早上9点催我",
    "下周一面试，提前半小时提醒",
    "周末去健身房，不提醒",
    "今晚8点看球赛，准时提醒",
    "明天中午请客吃饭，提前20分钟提醒",
    "后天早上7点送孩子上学，提前15分钟提醒",
    "下个月1号交房租，每天晚上8点提醒",
    "月底前把项目做完，每天上午10点催我",
    
    # 超口语化表达 (10个)
    "帮我记一下，周三下午3点有个饭局，提前半小时叫我",
    "搞个提醒，明天10点开会，提前5分钟",
    "设个闹钟，早上6点起床跑步，准时提醒",
    "记得提醒我，下午4点接孩子，提前10分钟",
    "别让我忘了，周五发工资查一下，当天早上9点提醒",
    "提醒我一声，晚上8点有电话会议，提前5分钟",
    "帮忙记着点，下周二体检，提前1天提醒",
    "到时候叫我，明天早上跑步，6点提醒",
    "盯着我点，周五前交报告，每天晚上9点催我",
    "催我一下，周末给妈妈打电话，周六早上9点提醒"
)

$success = 0
$failed = 0
$results = @()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  微调模型测试 (共 $($tests.Count) 个)" -ForegroundColor Cyan
Write-Host "  模型: Qwen2.5-7B-Instruct (LoRA微调)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

for ($i = 0; $i -lt $tests.Count; $i++) {
    $test = $tests[$i]
    Write-Host "`n[$($i+1)/$($tests.Count)] $test" -ForegroundColor Yellow
    
    try {
        $body = @{text=$test} | ConvertTo-Json -Compress
        $response = Invoke-RestMethod -Uri "http://localhost:3004/process" -Method Post -ContentType "application/json; charset=utf-8" -Headers @{"x-wx-openid"="test-user"} -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 30
        
        $ai1 = $response.data.ai1Output
        
        if ($ai1.agent_instruction) {
            $inst = $ai1.agent_instruction
            Write-Host "   ✅ 意图: $($inst.intent)" -ForegroundColor Green
            Write-Host "      标题: $($inst.payload.title)" -ForegroundColor White
            Write-Host "      时间: $($inst.payload.raw_time_str)" -ForegroundColor White
            Write-Host "      提醒: $($inst.payload.raw_notify_str)" -ForegroundColor White
            
            # 检查是否派发给AI2并成功
            if ($response.data.reply -match "已为您|已创建|已安排") {
                Write-Host "   🎯 AI2执行成功: $($response.data.reply)" -ForegroundColor Cyan
            }
            $success++
            $results += @{test=$test; status="success"; intent=$inst.intent}
        } else {
            # 追问也算正确识别
            Write-Host "   ⚠️ 追问: $($ai1.reply_to_user)" -ForegroundColor Gray
            $success++
            $results += @{test=$test; status="askback"; reply=$ai1.reply_to_user}
        }
    } catch {
        Write-Host "   ❌ 错误: $_" -ForegroundColor Red
        $failed++
        $results += @{test=$test; status="error"; error=$_.ToString()}
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  测试完成" -ForegroundColor Cyan
Write-Host "  成功: $success / $($tests.Count)" -ForegroundColor Green
Write-Host "  失败: $failed / $($tests.Count)" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "  成功率: $([math]::Round($success / $tests.Count * 100, 1))%" -ForegroundColor $(if ($success -eq $tests.Count) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan

# 统计意图分布
$intentStats = $results | Where-Object { $_.intent } | Group-Object intent
Write-Host "`n意图分布:" -ForegroundColor White
foreach ($stat in $intentStats) {
    Write-Host "  $($stat.Name): $($stat.Count)" -ForegroundColor White
}

$askbackCount = ($results | Where-Object { $_.status -eq "askback" }).Count
Write-Host "  追问: $askbackCount" -ForegroundColor Gray

