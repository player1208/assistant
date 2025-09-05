import { Task, Project } from '../types'
import { calculateCriticalPath } from '../utils/criticalPath'
import { useMemo } from 'react'

interface OverviewProps {
  project: Project
  onProjectUpdate: (updates: Partial<Project>) => void
}

export default function Overview({ project, onProjectUpdate }: OverviewProps) {
  // 计算项目统计信息
  const projectStats = useMemo(() => {
    const { updatedTasks, criticalTasks, projectDuration } = calculateCriticalPath(project.tasks)
    
    const completedTasks = updatedTasks.filter(task => task.status === 'completed')
    const inProgressTasks = updatedTasks.filter(task => task.status === 'in-progress')
    const pendingTasks = updatedTasks.filter(task => task.status === 'pending')
    const blockedTasks = updatedTasks.filter(task => task.status === 'blocked')
    
    const totalEstimatedHours = updatedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
    const completedHours = completedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
    
    const overallProgress = updatedTasks.length > 0 
      ? Math.round(updatedTasks.reduce((sum, task) => sum + task.progress, 0) / updatedTasks.length)
      : 0

    return {
      totalTasks: updatedTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      pendingTasks: pendingTasks.length,
      blockedTasks: blockedTasks.length,
      criticalTasks: criticalTasks.length,
      projectDuration,
      totalEstimatedHours,
      completedHours,
      overallProgress
    }
  }, [project.tasks])

  return (
    <div className="p-6 bg-white">
      <h2 className="text-xl font-semibold mb-4">项目概览</h2>
      
      {/* 主要指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">总任务数</h3>
          <p className="text-2xl font-bold text-blue-600">{projectStats.totalTasks}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">已完成</h3>
          <p className="text-2xl font-bold text-green-600">{projectStats.completedTasks}</p>
          <p className="text-xs text-green-600 mt-1">
            {projectStats.totalTasks > 0 ? Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100) : 0}%
          </p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800">进行中</h3>
          <p className="text-2xl font-bold text-yellow-600">{projectStats.inProgressTasks}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">关键任务</h3>
          <p className="text-2xl font-bold text-red-600">{projectStats.criticalTasks}</p>
        </div>
      </div>

      {/* 项目进度 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">项目进度</h3>
          <span className="text-lg font-bold text-blue-600">{projectStats.overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${projectStats.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">项目工期</h3>
          <p className="text-xl font-bold text-gray-900">{projectStats.projectDuration} 天</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">预估工时</h3>
          <p className="text-xl font-bold text-gray-900">{projectStats.totalEstimatedHours} 小时</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">工时完成率</h3>
          <p className="text-xl font-bold text-gray-900">
            {projectStats.totalEstimatedHours > 0 
              ? Math.round((projectStats.completedHours / projectStats.totalEstimatedHours) * 100)
              : 0
            }%
          </p>
        </div>
      </div>

      {/* 任务状态分布 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">任务状态分布</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm">已完成</span>
            </div>
            <span className="text-sm font-medium">{projectStats.completedTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm">进行中</span>
            </div>
            <span className="text-sm font-medium">{projectStats.inProgressTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span className="text-sm">待开始</span>
            </div>
            <span className="text-sm font-medium">{projectStats.pendingTasks}</span>
          </div>
          {projectStats.blockedTasks > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm">已阻塞</span>
              </div>
              <span className="text-sm font-medium">{projectStats.blockedTasks}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 项目描述 */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">项目描述</h3>
        <textarea
          value={project.description || ''}
          onChange={(e) => onProjectUpdate({ description: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="添加项目描述..."
        />
      </div>
    </div>
  )
}


