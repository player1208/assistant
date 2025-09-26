"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { format } from "date-fns"

export type DateFieldProps = {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function DateField({ value, onChange, placeholder, className = "" }: DateFieldProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const date = useMemo(() => {
    const d = new Date(value)
    return isNaN(d.getTime()) ? new Date() : d
  }, [value])

  // 关闭时按 ESC 或点击外部
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current && (btnRef.current === target || btnRef.current.contains(target))) return
      if (popRef.current && popRef.current.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick) }
  }, [open])

  const [pos, setPos] = useState<{top:number,left:number,width:number}>({ top: 0, left: 0, width: 0 })
  const updatePos = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 320)), width: r.width })
  }

  useEffect(() => { if (open) { updatePos(); setTimeout(updatePos, 0) } }, [open])
  useEffect(() => { const h = () => open && updatePos(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); setOpen(true) }}
        onClick={() => setOpen(true)}
        className={("w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 bg-white " + className).trim()}
      >
        <span className="truncate text-left flex-1">{value ? value.replace(/-/g, '/') : (placeholder || '')}</span>
        <CalendarIcon className="w-4 h-4 text-gray-500" />
      </button>

      <AnimatePresence initial={false}>
        {open && createPortal(
          <motion.div
            ref={popRef}
            className="fixed z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl p-2"
            style={{ top: pos.top, left: pos.left, width: Math.max(260, Math.min(360, pos.width + 100)) }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.6 }}
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(d) => { if (d) { onChange(format(d, 'yyyy-MM-dd')); setOpen(false) } }}
              // 基础内联尺寸，避免必须引入全局CSS
              styles={{
                caption: { padding: '4px 8px', fontWeight: 600 },
                head_cell: { width: 36, height: 28, textAlign: 'center', color: '#6b7280' },
                day: { width: 36, height: 36, borderRadius: 8 },
                month: { padding: 8 },
              }}
            />
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  )
}

