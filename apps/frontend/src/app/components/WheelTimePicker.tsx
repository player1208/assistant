import { useRef, useEffect, useCallback } from 'react'

export type WheelTimePickerProps = {
  value: string // HH:mm
  onChange: (value: string) => void
  className?: string
}

// 生成小时和分钟数组
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

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
  const isInteractingRef = useRef(false)
  const startY = useRef(0)
  const startScrollTop = useRef(0)
  const velocity = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const animationRef = useRef<number>()
  const lastReportedIndex = useRef(selectedIndex)

  const visibleItems = 3
  const containerHeight = itemHeight * visibleItems

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

  useEffect(() => {
    scrollToIndex(selectedIndex, false)
    lastReportedIndex.current = selectedIndex
  }, [])

  useEffect(() => {
    if (!isInteractingRef.current && selectedIndex !== lastReportedIndex.current) {
      scrollToIndex(selectedIndex, true)
      lastReportedIndex.current = selectedIndex
    }
  }, [selectedIndex, scrollToIndex])

  const handleScrollEnd = useCallback(() => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      const nearestIndex = Math.round(scrollTop / itemHeight)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex))
      scrollToIndex(clampedIndex, true)
      
      isInteractingRef.current = false
      if (clampedIndex !== lastReportedIndex.current) {
        lastReportedIndex.current = clampedIndex
        onChange(clampedIndex)
      }
    }
  }, [itemHeight, items.length, onChange, scrollToIndex])

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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      isInteractingRef.current = true
      const scrollAmount = Math.sign(e.deltaY) * itemHeight
      container.scrollTop += scrollAmount
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(() => {
        setTimeout(handleScrollEnd, 100)
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleScrollEnd, itemHeight])

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ height: containerHeight }}
    >
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />

      <div
        className="absolute inset-x-1 z-5 bg-blue-100/50 rounded-md pointer-events-none"
        style={{ top: itemHeight, height: itemHeight }}
      />

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
        {items.map((item, index) => (
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
        ))}
      </div>
    </div>
  )
}

export default function WheelTimePicker({ value, onChange, className = '' }: WheelTimePickerProps) {
  const [hourStr, minuteStr] = (value || '09:00').split(':')
  const hourIndex = parseInt(hourStr, 10) || 0
  const minuteIndex = parseInt(minuteStr, 10) || 0

  const internalHourRef = useRef(hourIndex)
  const internalMinuteRef = useRef(minuteIndex)

  const selectedHourIndex = internalHourRef.current
  const selectedMinuteIndex = internalMinuteRef.current

  const handleHourChange = useCallback((index: number) => {
    internalHourRef.current = index
    const newTime = `${HOURS[index]}:${MINUTES[internalMinuteRef.current]}`
    onChange(newTime)
  }, [onChange])

  const handleMinuteChange = useCallback((index: number) => {
    internalMinuteRef.current = index
    const newTime = `${HOURS[internalHourRef.current]}:${MINUTES[index]}`
    onChange(newTime)
  }, [onChange])

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-12">
        <WheelColumn
          items={HOURS}
          selectedIndex={selectedHourIndex}
          onChange={handleHourChange}
        />
      </div>
      <span className="text-lg font-bold text-gray-400">:</span>
      <div className="w-12">
        <WheelColumn
          items={MINUTES}
          selectedIndex={selectedMinuteIndex}
          onChange={handleMinuteChange}
        />
      </div>
    </div>
  )
}

