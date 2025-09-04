import { useMemo } from 'react'

export default function Header() {
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  return (
    <header className="p-4 border-b bg-white sticky top-0 z-20 rounded-t-lg">
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
    </header>
  )
}


