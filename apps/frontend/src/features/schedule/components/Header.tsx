import { useMemo } from 'react'

export default function Header() {
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // 生成当前周的日期
  const getWeekDates = () => {
    const today = new Date()
    const currentDay = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay)
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push({
        day: date.getDate(),
        dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][i],
        isToday: date.toDateString() === today.toDateString()
      })
    }
    return weekDates
  }

  const weekDates = getWeekDates()

  return (
    <header id="schedule-header" className="p-4 border-b bg-white sticky top-0 z-20 lg:rounded-t-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold">{year}年</h1>
          <p className="text-2xl font-semibold text-gray-700">{month}月</p>
        </div>
        <div className="hidden sm:flex items-center p-1 bg-gray-200/80 rounded-lg text-sm">
          <button className="px-4 py-1 rounded-md text-gray-600 hover:bg-gray-300/50">日</button>
          <button className="px-4 py-1 rounded-md bg-white shadow font-semibold text-blue-600">周</button>
          <button className="px-4 py-1 rounded-md text-gray-600 hover:bg-gray-300/50">月</button>
          <button className="px-4 py-1 rounded-md text-gray-600 hover:bg-gray-300/50">年</button>
        </div>
      </div>
      <div id="weekday-selector" className="flex justify-around text-center text-sm">
        {weekDates.map((date, index) => (
          <div 
            key={index}
            className={`weekday-item flex flex-col items-center p-2 w-12 cursor-pointer hover:bg-gray-100 rounded-lg ${
              date.isToday ? 'bg-blue-600 text-white shadow' : ''
            }`}
          >
            <span className={`text-xs ${date.isToday ? 'font-light' : 'text-gray-500'}`}>
              {date.dayName}
            </span>
            <span className={`font-semibold mt-1 ${date.isToday ? 'font-bold text-lg mt-0.5' : ''}`}>
              {date.day}
            </span>
          </div>
        ))}
      </div>
    </header>
  )
}


