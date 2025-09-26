"use client"

import { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import Timekeeper from "react-timekeeper"
import { Clock } from "lucide-react"

export type TimeFieldProps = {
  value: string // HH:mm
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const pad = (n: number | string) => ("" + n).padStart(2, "0")

export default function TimeField({ value, onChange, placeholder, className = "" }: TimeFieldProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // close on esc / outside
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

  const display = value || placeholder || ''

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); setOpen(true) }}
        onClick={() => setOpen(true)}
        className={("w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 bg-white " + className).trim()}
      >
        <span className="truncate text-left flex-1">{display}</span>
        <Clock className="w-4 h-4 text-gray-500" />
      </button>

      <AnimatePresence initial={false}>
        {open && createPortal(
          <motion.div
            ref={popRef}
            className="fixed z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl p-2"
            style={{ top: pos.top, left: pos.left }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.6 }}
          >
            <Timekeeper
              time={value || '09:00'}
              onChange={(data: any) => {
                const t = typeof data === 'string' ? data : `${pad(data?.hour ?? 9)}:${pad(data?.minute ?? 0)}`
                onChange(t)
              }}
              onDoneClick={() => setOpen(false)}
              switchToMinuteOnHourSelect
            />
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  )
}

