import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Folder } from 'lucide-react'
import { motion } from 'motion/react'




// Draft/Saved storage keys (draft auto-saves; saved is confirmed snapshot)
const DRAFT_KEY = 'personalAssistantData';
const SAVED_KEY = 'personalAssistantData.saved';

// Simple node model for demo
type RoutineModel = { id: string; title: string }
type NodeModel = { id: string; title: string; xPct: number; yPct: number; description?: string; themeColor?: string; routines?: RoutineModel[] }
type EdgeModel = { id: string; fromId: string; toId: string }

type DraftData = { nodes: NodeModel[]; edges?: EdgeModel[]; updatedAt?: number; schemaVersion?: number }
type SavedData = { nodes: NodeModel[]; edges?: EdgeModel[]; savedAt?: number; schemaVersion?: number }

type Mode = 'trackpad' | 'mouse'

export type PlanningCanvasHandle = {
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void
  setMode: (m: Mode) => void
  confirmSave: () => void
  addNode: () => void
  addText: () => void
  toggleConnectMode: () => void
  getSelected: () => any | null
  updateSelected: (patch: Partial<any>) => void
  addRoutine: (title: string) => void
  updateRoutine: (rid: string, patch: Partial<any>) => void
  deleteRoutine: (rid: string) => void
  loadProject: (newNodes: any[]) => void
}

export default forwardRef<PlanningCanvasHandle, { leftOffsetPx?: number; topOffsetPx?: number; onDirtyChange?: (dirty: boolean) => void; onSelectionChange?: (node: NodeModel | null) => void; onFolderClick?: () => void }>(function ImmersivePlanningCanvas({ leftOffsetPx = 0, topOffsetPx = 64, onDirtyChange, onSelectionChange, onFolderClick }, ref) {
  // Responsive: desktop/tablet only
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1280)
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1280)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const connectStartRef = useRef<string | null>(null)

  // Interaction mode (auto default based on device capability)
  const [mode, setMode] = useState<Mode>(() => (navigator.maxTouchPoints > 0 ? 'trackpad' : 'mouse'))
  const [connectMode, setConnectMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Pan/zoom state
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Draft/Saved initialization
  const defaultNodes: NodeModel[] = useMemo(() => ([
    { id: 'a', title: '示例节点 A', xPct: 10, yPct: 20, description: '', themeColor: '#3b82f6', routines: [] },
    { id: 'b', title: '示例节点 B', xPct: 45, yPct: 40, description: '', themeColor: '#22c55e', routines: [] },
  ]), [])

  const defaultEdges: EdgeModel[] = useMemo(() => ([
    { id: 'e1', fromId: 'a', toId: 'b' },
  ]), [])

  const init = useMemo(() => {
    try {
      const draft: DraftData | null = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
      if (draft?.nodes) return { nodes: draft.nodes, edges: draft.edges || [], savedHash: JSON.stringify({ nodes: draft.nodes, edges: draft.edges || [] }) }
      const saved: SavedData | null = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null')
      if (saved?.nodes) return { nodes: saved.nodes, edges: saved.edges || [], savedHash: JSON.stringify({ nodes: saved.nodes, edges: saved.edges || [] }) }
    } catch {}
    return { nodes: defaultNodes, edges: defaultEdges, savedHash: JSON.stringify({ nodes: defaultNodes, edges: defaultEdges }) }
  }, [defaultNodes, defaultEdges])

  const [nodes, setNodes] = useState<NodeModel[]>(init.nodes)
  const [edges, setEdges] = useState<EdgeModel[]>(init.edges)
  const [lastSavedHash, setLastSavedHash] = useState<string>(() => {
    try {
      const saved: SavedData | null = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null')
      return saved?.nodes ? JSON.stringify({ nodes: saved.nodes, edges: saved.edges || [] }) : JSON.stringify({ nodes: init.nodes, edges: init.edges })
    } catch {
      return JSON.stringify({ nodes: init.nodes, edges: init.edges })
    }
  })
  const [dirty, setDirty] = useState<boolean>(JSON.stringify({ nodes: init.nodes, edges: init.edges }) !== lastSavedHash)

  // Auto-save draft and update dirty flag
  useEffect(() => {
    try {
      const payload: DraftData = { nodes, edges, updatedAt: Date.now(), schemaVersion: 1 }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    } catch {}
    setDirty(JSON.stringify({ nodes, edges }) !== lastSavedHash)
  }, [nodes, edges, lastSavedHash])

  // Drag state for moving nodes
  const dragInfo = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)

  // Canvas panning state
  const panInfo = useRef<{ startX: number; startY: number; origX: number; origY: number; panning: boolean }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    panning: false,
  })

  // Helpers
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  // Node drag handlers
  const onNodePointerDown = (id: string, e: React.PointerEvent) => {
    if (!containerRef.current || !canvasRef.current) return

    // Connection mode: pick two nodes to create an edge
    if (connectMode) {
      if (!connectStartRef.current) {
        connectStartRef.current = id
        setSelectedId(null)
      } else if (connectStartRef.current !== id) {
        const start = connectStartRef.current
        setEdges((prev) => {
          const exists = prev.some((ed) => (ed.fromId === start && ed.toId === id) || (ed.fromId === id && ed.toId === start))
          if (exists) return prev
          return prev.concat({ id: `e${Date.now()}`, fromId: start!, toId: id })
        })
        connectStartRef.current = null
        setConnectMode(false)
      } else {
        // Clicked the same node, cancel
        connectStartRef.current = null
        setConnectMode(false)
      }
      return
    }

    setSelectedId(id)
    e.currentTarget.setPointerCapture(e.pointerId)

    // Convert to container pixel space
    const container = containerRef.current
    const rect = container.getBoundingClientRect()

    const n = nodes.find((n) => n.id === id)!
    dragInfo.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: (n.xPct / 100) * rect.width,
      origY: (n.yPct / 100) * rect.height,
    }
  }

  const onNodePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current || !containerRef.current) return
    const { id, startX, startY, origX, origY } = dragInfo.current
    const container = containerRef.current
    const rect = container.getBoundingClientRect()

    // Account for current scale
    const dx = (e.clientX - startX) / scale
    const dy = (e.clientY - startY) / scale
    const newX = clamp(((origX + dx) / rect.width) * 100, 0, 100)
    const newY = clamp(((origY + dy) / rect.height) * 100, 0, 100)
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, xPct: newX, yPct: newY } : n)))
  }

  const onNodePointerUp = (_e: React.PointerEvent) => {
    dragInfo.current = null
  }

  // Canvas pan start (only when clicking on empty canvas area)
  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== canvasRef.current) return
    // Clear selection when clicking empty canvas
    setSelectedId(null)
    const state = panInfo.current
    state.panning = true
    state.startX = e.clientX
    state.startY = e.clientY
    state.origX = pan.x
    state.origY = pan.y
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const state = panInfo.current
    if (!state.panning) return
    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY
    setPan({ x: state.origX + dx, y: state.origY + dy })
  }

  const onCanvasPointerUp = (_e: React.PointerEvent) => {
    panInfo.current.panning = false
  }

  // Wheel: depends on mode
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (mode === 'trackpad') {
      if (e.ctrlKey) {
        // pinch-zoom like
        setScale((s) => clamp(s + (e.deltaY > 0 ? -0.05 : 0.05), 0.2, 2))
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }
    } else {
      setScale((s) => clamp(s + (e.deltaY > 0 ? -0.1 : 0.1), 0.2, 2))
    }
  }

  // Toolbar actions
  const zoomIn = () => setScale((s) => clamp(s + 0.2, 0.2, 2))
  const zoomOut = () => setScale((s) => clamp(s - 0.2, 0.2, 2))
  const zoomReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }
  const addNode = () => {
    setNodes((prev) => prev.concat({ id: `n${Date.now()}`, title: '新节点', xPct: 50, yPct: 50 }))
  }
  const addText = () => {
    setNodes((prev) => prev.concat({ id: `t${Date.now()}`, title: '文本', xPct: 52, yPct: 52 }))
  }
  const toggleConnectMode = () => setConnectMode((v) => !v)

  // Derived transforms
  const containerStyle = useMemo(() => ({
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
    transformOrigin: '0 0',
  }), [pan.x, pan.y, scale])

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    zoomReset,
    setMode: (m: Mode) => setMode(m),
    confirmSave: () => {
      try {
        const payload: SavedData = { nodes, edges, savedAt: Date.now(), schemaVersion: 1 }
        localStorage.setItem(SAVED_KEY, JSON.stringify(payload))
        const hash = JSON.stringify({ nodes, edges })
        setLastSavedHash(hash)
        setDirty(false)
      } catch {}
    },
    addNode,
    addText,
    toggleConnectMode,
    getSelected: () => nodes.find(n => n.id === selectedId) || null,
    updateSelected: (patch: Partial<NodeModel>) => {
      if (!selectedId) return
      setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, ...patch } : n))
    },
    addRoutine: (title: string) => {
      if (!selectedId) return
      setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, routines: [...(n.routines||[]), { id: `r${Date.now()}`, title }] } : n))
    },
    updateRoutine: (rid: string, patch: Partial<RoutineModel>) => {
      if (!selectedId) return
      setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, routines: (n.routines||[]).map(r => r.id===rid?{...r, ...patch}:r) } : n))
    },
    deleteRoutine: (rid: string) => {
      if (!selectedId) return
      setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, routines: (n.routines||[]).filter(r => r.id!==rid) } : n))
    },
    loadProject: (newNodes: NodeModel[]) => {
      setNodes(newNodes)
      setLastSavedHash(JSON.stringify(newNodes))
      setSelectedId(null)
    }
  }), [nodes, lastSavedHash, selectedId])

  // Inform parent about dirty state
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  // Inform parent about selection
  useEffect(() => { onSelectionChange?.(nodes.find(n=>n.id===selectedId) || null) }, [selectedId, nodes, onSelectionChange])

  // Render
  if (!isDesktop) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow p-6 text-center">
          <p className="text-sm text-gray-700">请去电脑/平板端进行长期规划设计</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-0 overflow-hidden" style={{ left: leftOffsetPx, top: topOffsetPx }}>
      {/* Canvas background */}
      <div
        ref={canvasRef}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onWheel={onWheel}
        className="absolute inset-0"
        style={{
          cursor: panInfo.current.panning ? 'grabbing' : 'grab',
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.07) 1px, transparent 0)',
          backgroundSize: '25px 25px',
        }}
      >
        {/* Movable container */}
        <div ref={containerRef} className="absolute top-0 left-0 w-full h-full" style={containerStyle}>
          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((e) => {
              const a = nodes.find((n) => n.id === e.fromId)
              const b = nodes.find((n) => n.id === e.toId)
              if (!a || !b) return null
              const midX = (a.xPct + b.xPct) / 2
              const c1x = `${midX}%`, c1y = `${a.yPct}%`
              const c2x = `${midX}%`, c2y = `${b.yPct}%`
              return (
                <path
                  key={e.id}
                  d={`M ${a.xPct}% ${a.yPct}% C ${c1x} ${c1y} , ${c2x} ${c2y} , ${b.xPct}% ${b.yPct}%`}
                  stroke="rgba(100,116,139,0.8)"
                  strokeWidth={2}
                  fill="none"
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((n) => (
            <motion.div
              key={n.id}
              onPointerDown={(e) => onNodePointerDown(n.id, e)}
              onPointerMove={onNodePointerMove}
              onPointerUp={onNodePointerUp}
              className={`plan-node absolute w-64 bg-white rounded-lg shadow-md p-4 border ${selectedId===n.id?'border-blue-500 ring-2 ring-blue-300':'border-black/10'}`}
              style={{ left: `${n.xPct}%`, top: `${n.yPct}%` }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: selectedId===n.id ? 1.03 : 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <input
                className="text-lg font-bold w-full bg-transparent focus:outline-none focus:bg-gray-100 rounded-md p-1 -m-1"
                value={n.title}
                onChange={(e) => setNodes((prev) => prev.map((x) => (x.id === n.id ? { ...x, title: e.target.value } : x)))}
              />
              <p className="text-xs text-gray-500 mt-1">拖动我以移动节点</p>
            </motion.div>
          ))}
        </div>

        {/* Floating view controls (bottom-right) */}
        <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2">
          <button onClick={() => onFolderClick?.()} className="w-10 h-10 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100" aria-label="项目/文件夹">
            <Folder className="w-5 h-5" />
          </button>

          <button onClick={zoomIn} className="w-10 h-10 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100" aria-label="放大">+
          </button>
          <button onClick={zoomOut} className="w-10 h-10 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100" aria-label="缩小">-
          </button>
          <button onClick={zoomReset} className="w-10 h-10 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100" aria-label="复位">⟳
          </button>
        </div>
      </div>
    </div>
  )
})

