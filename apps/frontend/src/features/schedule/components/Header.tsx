import { useMemo, useState } from 'react'
import SmoothTabs from '../../../app/components/SmoothTabs'

export default function Header() {
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [active, setActive] = useState(1) // 默认“周”
  const labels = ['日', '周', '月', '年']
  const vibrant = ['#f43f5e', '#2563eb', '#10b981', '#f59e0b']

  return (
    <header className="p-4 bg-white sticky top-0 z-20 rounded-t-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold">{year}年</h1>
          <p className="text-2xl font-semibold text-gray-700">{month}月</p>
        </div>
        <div className="hidden sm:flex items-center">
          <SmoothTabs items={labels} activeIndex={active} onChange={setActive} colors={vibrant} />
        </div>
      </div>
    </header>
  )
}


