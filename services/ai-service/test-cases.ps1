# 30个多样化口语化测试用例
$testCases = @(
    # 节日类 (10个)
    "春节那天去拜年，不用提醒",
    "除夕晚上吃年夜饭，提前1小时提醒我",
    "元宵节晚上7点去看花灯",
    "清明节回老家扫墓，早上8点出发",
    "端午前两天买粽子，每天提醒我一次",
    "七夕那天给老婆买礼物，提前3天提醒",
    "中秋当天回家吃饭，下午4点到",
    "重阳节陪爷爷奶奶，上午10点",
    "国庆第一天出去玩，不提醒",
    "元旦跨年倒计时，晚上11点半提醒我",
    
    # 相对时间类 (8个)
    "明天早上跑步",
    "后天下午3点面试",
    "大后天晚饭后散步",
    "下周一交报告，每天早上9点催我",
    "下周三下午开会，提前15分钟提醒",
    "这周六去健身房",
    "下个月1号交房租，提前2天提醒",
    "周五前把PPT做完",
    
    # 口语化表达 (7个)
    "帮我记一下明天10点有个电话会议",
    "搞个提醒吧周末去洗车",
    "设个闹钟后天早上6点起床",
    "记得提醒我下周二还信用卡",
    "给我安排一下明天中午请客户吃饭",
    "约了周四下午看牙医别让我忘了",
    "帮我订个日程下周五晚上聚餐",
    
    # 节气类 (3个)
    "立春那天吃春饼，中午12点",
    "冬至记得吃饺子",
    "小年那天打扫房间"
    
    # 特殊表达 (2个)
    "下下周一开始健身打卡",
    "母亲节给妈妈打电话，上午9点"
)

$results = @()
$success = 0
$fail = 0

Write-Host "开始测试 $($testCases.Count) 个用例..." -ForegroundColor Cyan
Write-Host ""

foreach ($i in 0..($testCases.Count - 1)) {
    $text = $testCases[$i]
    $num = $i + 1
    
    Write-Host "[$num/$($testCases.Count)] 测试: $text" -ForegroundColor Yellow
    
    try {
        $body = @{text=$text} | ConvertTo-Json -Compress
        $response = Invoke-RestMethod -Uri "http://localhost:3004/process" `
            -Method POST `
            -ContentType "application/json; charset=utf-8" `
            -Headers @{"x-wx-openid"="test-user"} `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
            -TimeoutSec 120
        
        if ($response.code -eq 0) {
            $reply = $response.data.reply
            Write-Host "  ✅ $reply" -ForegroundColor Green
            $success++
            $results += [PSCustomObject]@{
                序号 = $num
                输入 = $text
                状态 = "成功"
                回复 = $reply
            }
        } else {
            Write-Host "  ❌ 失败: $($response.message)" -ForegroundColor Red
            $fail++
            $results += [PSCustomObject]@{
                序号 = $num
                输入 = $text
                状态 = "失败"
                回复 = $response.message
            }
        }
    } catch {
        Write-Host "  ❌ 错误: $_" -ForegroundColor Red
        $fail++
        $results += [PSCustomObject]@{
            序号 = $num
            输入 = $text
            状态 = "错误"
            回复 = $_.Exception.Message
        }
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成！成功: $success, 失败: $fail" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 输出详细结果
$results | Format-Table -AutoSize -Wrap

