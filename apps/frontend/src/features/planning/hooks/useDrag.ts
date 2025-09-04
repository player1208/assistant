import { useState, useCallback } from 'react'

interface DragState {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export function useDrag() {
  const [isDragging, setIsDragging] = useState(false)
  const [drag, setDrag] = useState<DragState>({ startX: 0, startY: 0, currentX: 0, currentY: 0 })

  const startDrag = useCallback((x: number, y: number) => {
    setIsDragging(true)
    setDrag({ startX: x, startY: y, currentX: x, currentY: y })
  }, [])

  const updateDrag = useCallback((x: number, y: number) => {
    if (isDragging) {
      setDrag(prev => ({ ...prev, currentX: x, currentY: y }))
    }
  }, [isDragging])

  const endDrag = useCallback(() => {
    setIsDragging(false)
  }, [])

  return {
    isDragging,
    drag,
    startDrag,
    updateDrag,
    endDrag
  }
}
