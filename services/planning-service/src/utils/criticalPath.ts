import { Task } from '../types/index.js'

export interface CriticalPathResult {
  updatedTasks: Task[]
  criticalTasks: string[]
  projectDuration: number
}

export function calculateCriticalPath(tasks: Task[]): CriticalPathResult {
  if (tasks.length === 0) {
    return {
      updatedTasks: [],
      criticalTasks: [],
      projectDuration: 0
    }
  }

  // 创建任务映射
  const taskMap = new Map<string, Task>()
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task })
  })

  // 计算持续时间
  taskMap.forEach(task => {
    const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (24 * 60 * 60 * 1000))
    task.duration = duration
  })

  // 前向计算：计算最早开始和最早完成时间
  const forwardPass = (taskId: string, visited: Set<string>): void => {
    if (visited.has(taskId)) return
    visited.add(taskId)

    const task = taskMap.get(taskId)
    if (!task) return

    let earliestStart = task.startDate

    // 检查所有依赖任务
    for (const depId of task.dependencies) {
      const depTask = taskMap.get(depId)
      if (depTask) {
        forwardPass(depId, visited)
        if (depTask.earlyFinish && depTask.earlyFinish > earliestStart) {
          earliestStart = depTask.earlyFinish
        }
      }
    }

    task.earlyStart = earliestStart
    task.earlyFinish = new Date(earliestStart.getTime() + (task.duration || 0) * 24 * 60 * 60 * 1000)
  }

  // 找到没有依赖的任务作为起始点
  const startTasks = Array.from(taskMap.values()).filter(task => task.dependencies.length === 0)
  const visited = new Set<string>()
  
  startTasks.forEach(task => {
    forwardPass(task.id, visited)
  })

  // 确保所有任务都被处理
  taskMap.forEach((_, taskId) => {
    if (!visited.has(taskId)) {
      forwardPass(taskId, visited)
    }
  })

  // 计算项目总持续时间
  const projectDuration = Math.max(
    ...Array.from(taskMap.values()).map(task => 
      task.earlyFinish ? Math.ceil((task.earlyFinish.getTime() - task.startDate.getTime()) / (24 * 60 * 60 * 1000)) : 0
    )
  )

  // 后向计算：计算最晚开始和最晚完成时间
  const backwardPass = (taskId: string, visited: Set<string>): void => {
    if (visited.has(taskId)) return
    visited.add(taskId)

    const task = taskMap.get(taskId)
    if (!task) return

    // 找到依赖此任务的所有任务
    const dependentTasks = Array.from(taskMap.values()).filter(t => 
      t.dependencies.includes(taskId)
    )

    let latestFinish = task.endDate

    if (dependentTasks.length === 0) {
      // 如果没有依赖任务，使用项目结束时间
      latestFinish = new Date(task.startDate.getTime() + projectDuration * 24 * 60 * 60 * 1000)
    } else {
      // 使用依赖任务的最晚开始时间
      for (const depTask of dependentTasks) {
        backwardPass(depTask.id, visited)
        if (depTask.lateStart && depTask.lateStart < latestFinish) {
          latestFinish = depTask.lateStart
        }
      }
    }

    task.lateFinish = latestFinish
    task.lateStart = new Date(latestFinish.getTime() - (task.duration || 0) * 24 * 60 * 60 * 1000)

    // 计算松弛时间
    if (task.earlyStart && task.lateStart) {
      task.slack = Math.ceil((task.lateStart.getTime() - task.earlyStart.getTime()) / (24 * 60 * 60 * 1000))
    } else {
      task.slack = 0
    }
  }

  // 从结束任务开始后向计算
  const endTasks = Array.from(taskMap.values()).filter(task => 
    Array.from(taskMap.values()).every(t => !t.dependencies.includes(task.id))
  )
  
  const backwardVisited = new Set<string>()
  endTasks.forEach(task => {
    backwardPass(task.id, backwardVisited)
  })

  // 确保所有任务都被处理
  taskMap.forEach((_, taskId) => {
    if (!backwardVisited.has(taskId)) {
      backwardPass(taskId, backwardVisited)
    }
  })

  // 识别关键路径
  const criticalTasks: string[] = []
  taskMap.forEach(task => {
    if (task.slack === 0) {
      task.isOnCriticalPath = true
      criticalTasks.push(task.id)
    } else {
      task.isOnCriticalPath = false
    }
  })

  return {
    updatedTasks: Array.from(taskMap.values()),
    criticalTasks,
    projectDuration
  }
}
