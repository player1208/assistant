import { useRef, useState } from 'react'
import ImmersivePlanningCanvas, { PlanningCanvasHandle } from '../components/ImmersivePlanningCanvas'
import { Plus, ChevronDown, Trash2 } from 'lucide-react'

export default function PlanningPage() {
  const subnavH = 56
  const inspectorW = 384 // w-96
  const canvasTop = 64 + subnavH // 64 = top nav (h-16)

  const canvasRef = useRef<PlanningCanvasHandle>(null)
  const [dirty, setDirty] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any | null>(null)

  // Project switcher demo
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [currentProject, setCurrentProject] = useState('考研')
  const projectOptions = [
    {
      name: '考研',
      nodes: [
        { id: 'g1', title: '政治', xPct: 20, yPct: 20, description: '', themeColor: '#3b82f6', routines: [{ id: 'r1', title: '每日时政30分钟' }] },
        { id: 'g2', title: '英语', xPct: 50, yPct: 40, description: '', themeColor: '#22c55e', routines: [{ id: 'r2', title: '每天背单词30个' }] },
      ],
    },
    {
      name: '健身',
      nodes: [
        { id: 'g3', title: '有氧', xPct: 30, yPct: 30, description: '', themeColor: '#ef4444', routines: [{ id: 'r3', title: '跑步5公里' }] },
      ],
    },
  ]

  const colorOptions = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="fixed inset-0">
      {/* L2 Sub-navigation */}
      <div className="fixed top-16 left-0 right-0 bg-white border-b z-20" style={{ height: subnavH }}>
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: module title */}
          <div className="text-sm font-semibold text-gray-800">长期规划</div>

          {/* Center: project switcher */}
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen((v) => !v)}
              className="px-4 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm flex items-center gap-2"
            >
              <span>当前所处规划：{currentProject}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {projectMenuOpen && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white border rounded-lg shadow z-30 w-56">
                {projectOptions.map((p) => (
                  <button
                    key={p.name}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      setCurrentProject(p.name)
                      setProjectMenuOpen(false)
                      canvasRef.current?.loadProject(p.nodes as any)
                    }}
                  >{p.name}</button>
                ))}
              </div>
            )}
          </div>

          {/* Right: add node */}
          <button
            onClick={() => canvasRef.current?.addNode()}
            className="px-4 h-9 rounded-full bg-gray-900 hover:bg-black text-white text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 添加节点
          </button>
        </div>
      </div>

      {/* Left Inspector */}
      <aside className="fixed left-0 bottom-0 bg-white border-r z-10" style={{ top: canvasTop, width: inspectorW }}>
        <div className="h-full flex flex-col">
          {!selectedNode ? (
            <div className="p-6 text-sm text-gray-500">请在画布上选择一个节点以进行编辑</div>
          ) : (
            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Title & Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">主题</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={selectedNode.title || ''}
                  onChange={(e) => canvasRef.current?.updateSelected?.({ title: e.target.value })}
                />
                <label className="block text-xs text-gray-500 mt-3 mb-1">描述</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm h-24 resize-none"
                  value={selectedNode.description || ''}
                  onChange={(e) => canvasRef.current?.updateSelected?.({ description: e.target.value })}
                />
              </div>

              {/* Theme Color */}
              <div>
                <div className="text-xs text-gray-500 mb-2">主题色</div>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => canvasRef.current?.updateSelected?.({ themeColor: c })}
                      className={`w-6 h-6 rounded-full border ${selectedNode.themeColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Routines */}
              <div>
                <div className="text-sm font-semibold mb-2">所需小目标 (Routines)</div>
                <div className="space-y-3 max-h-80 overflow-auto pr-1">
                  {(selectedNode.routines || []).map((r: any) => (
                    <div key={r.id} className="border rounded-md p-2 flex items-center gap-2">
                      <input
                        className="flex-1 text-sm px-2 py-1 border rounded"
                        value={r.title}
                        onChange={(e) => canvasRef.current?.updateRoutine?.(r.id, { title: e.target.value })}
                      />
                      <button className="text-red-600 hover:text-red-700" title="删除" onClick={() => canvasRef.current?.deleteRoutine?.(r.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-3 px-3 h-9 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                  onClick={() => canvasRef.current?.addRoutine?.('新小目标')}
                >新增小目标</button>
              </div>
            </div>
          )}
          {dirty && <div className="p-2 text-[11px] text-amber-700 bg-amber-100">有未保存更改</div>}
        </div>
      </aside>

      {/* Canvas */}
      <ImmersivePlanningCanvas
        ref={canvasRef}
        leftOffsetPx={inspectorW}
        topOffsetPx={canvasTop}
        onDirtyChange={setDirty}
        onSelectionChange={setSelectedNode}
      />
    </div>
  )
}


