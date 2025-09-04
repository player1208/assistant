export default function PlanningPage() {
  return (
    <div className="h-[70vh] flex">
      <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">我的所有项目</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          <button className="w-full text-left p-2 rounded-md text-sm hover:bg-gray-100">我的第一个项目</button>
        </div>
        <div className="p-2 border-t">
          <button className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
            创建新项目
          </button>
        </div>
      </aside>
      <div className="flex-grow flex flex-col relative">
        <div className="p-4 border-b bg-white flex justify-between items-center z-20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input type="text" defaultValue="我的第一个项目" className="text-xl lg:text-2xl font-bold bg-transparent focus:outline-none focus:bg-gray-100 rounded-lg p-1 -m-1" />
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">新节点</button>
            <button className="p-2 text-red-500 hover:bg-red-100 rounded-md">删除</button>
          </div>
        </div>
        <div className="flex-grow bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] [background-size:25px_25px]"></div>
      </div>
    </div>
  )
}


