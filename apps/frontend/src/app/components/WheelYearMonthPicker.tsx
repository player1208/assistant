import { useRef, useEffect, useCallback } from 'react'

export type WheelYearMonthPickerProps = {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

// 单个滚轮列
function WheelColumn({
  items,
  selectedIndex,
  onChange,
  itemHeight = 32
}: {
  items: string[]
  selectedIndex: number
  onChange: (index: number) => void
  itemHeight?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const isInteractingRef = useRef(false) // 是否正在用户交互中
  const startY = useRef(0)
  const startScrollTop = useRef(0)
  const velocity = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const animationRef = useRef<number>()
  const lastReportedIndex = useRef(selectedIndex)

  const visibleItems = 3
  const containerHeight = itemHeight * visibleItems

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number, smooth = true) => {
    if (containerRef.current) {
      const targetScroll = index * itemHeight
      if (smooth) {
        containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' })
      } else {
        containerRef.current.scrollTop = targetScroll
      }
    }
  }, [itemHeight])

  // 初始化滚动位置
  useEffect(() => {
    scrollToIndex(selectedIndex, false)
    lastReportedIndex.current = selectedIndex
  }, [])

  // 当外部 selectedIndex 变化时滚动（仅在非交互状态下）
  useEffect(() => {
    if (!isInteractingRef.current && selectedIndex !== lastReportedIndex.current) {
      scrollToIndex(selectedIndex, true)
      lastReportedIndex.current = selectedIndex
    }
  }, [selectedIndex, scrollToIndex])

  // 处理滚动结束，对齐到最近的项
  const handleScrollEnd = useCallback(() => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      const nearestIndex = Math.round(scrollTop / itemHeight)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex))
      scrollToIndex(clampedIndex, true)

      // 滚动结束后通知父组件
      isInteractingRef.current = false
      if (clampedIndex !== lastReportedIndex.current) {
        lastReportedIndex.current = clampedIndex
        onChange(clampedIndex)
      }
    }
  }, [itemHeight, items.length, onChange, scrollToIndex])

  // 鼠标/触摸事件
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    isInteractingRef.current = true
    startY.current = e.clientY
    startScrollTop.current = containerRef.current?.scrollTop || 0
    lastY.current = e.clientY
    lastTime.current = Date.now()
    velocity.current = 0
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const deltaY = startY.current - e.clientY
    if (containerRef.current) {
      containerRef.current.scrollTop = startScrollTop.current + deltaY
    }
    const now = Date.now()
    const dt = now - lastTime.current
    if (dt > 0) {
      velocity.current = (lastY.current - e.clientY) / dt
    }
    lastY.current = e.clientY
    lastTime.current = now
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    if (Math.abs(velocity.current) > 0.5) {
      const inertiaScroll = () => {
        if (containerRef.current && Math.abs(velocity.current) > 0.01) {
          containerRef.current.scrollTop += velocity.current * 16
          velocity.current *= 0.92
          animationRef.current = requestAnimationFrame(inertiaScroll)
        } else {
          handleScrollEnd()
        }
      }
      animationRef.current = requestAnimationFrame(inertiaScroll)
    } else {
      handleScrollEnd()
    }
  }

  // 使用 useEffect 添加 wheel 事件监听器，设置 passive: false
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      isInteractingRef.current = true
      // 缩小滚动量，使每次滚动约为一个项目高度
      const scrollAmount = Math.sign(e.deltaY) * itemHeight
      container.scrollTop += scrollAmount
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(() => {
        setTimeout(handleScrollEnd, 100)
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleScrollEnd])

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ height: containerHeight }}
    >
      {/* 上下渐变遮罩 - 透明背景 */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />

      {/* 中央选中指示器 */}
      <div
        className="absolute inset-x-1 z-5 bg-blue-100/50 rounded-md pointer-events-none"
        style={{
          top: itemHeight,
          height: itemHeight
        }}
      />

      {/* 滚动容器 - 隐藏滚动条 */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll cursor-grab active:cursor-grabbing"
        style={{
          scrollSnapType: 'y mandatory',
          paddingTop: itemHeight,
          paddingBottom: itemHeight,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <style>{`.wheel-scroll::-webkit-scrollbar { display: none; }`}</style>
        {items.map((item, index) => {
          return (
            <div
              key={index}
              className="flex items-center justify-center text-sm font-medium transition-colors"
              style={{
                height: itemHeight,
                scrollSnapAlign: 'center',
                color: index === selectedIndex ? '#2563eb' : '#9ca3af'
              }}
              onClick={() => {
                lastReportedIndex.current = index
                onChange(index)
                scrollToIndex(index, true)
              }}
            >
              {item}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WheelYearMonthPicker({ value, onChange, className = '' }: WheelYearMonthPickerProps) {
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 50
  const endYear = currentYear + 20

  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => `${startYear + i}`)

  // 使用内部状态避免外部更新导致的闪烁
  const internalYearRef = useRef(value.getFullYear())
  const internalMonthRef = useRef(value.getMonth())

  // 计算当前选中索引（使用内部值）
  const selectedYearIndex = internalYearRef.current - startYear
  const selectedMonthIndex = internalMonthRef.current

  // 年份变化处理
  const handleYearChange = useCallback((index: number) => {
    const year = startYear + index
    internalYearRef.current = year
    const newDate = new Date(year, internalMonthRef.current, 1)
    onChange(newDate)
  }, [startYear, onChange])

  // 月份变化处理
  const handleMonthChange = useCallback((index: number) => {
    internalMonthRef.current = index
    const newDate = new Date(internalYearRef.current, index, 1)
    onChange(newDate)
  }, [onChange])

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* 年份列 */}
      <div className="w-16">
        <WheelColumn
          items={years}
          selectedIndex={selectedYearIndex}
          onChange={handleYearChange}
        />
      </div>

      {/* 月份列 */}
      <div className="w-14">
        <WheelColumn
          items={MONTHS}
          selectedIndex={selectedMonthIndex}
          onChange={handleMonthChange}
        />
      </div>
    </div>
  )
}
