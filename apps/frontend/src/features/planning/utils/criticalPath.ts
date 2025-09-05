import { Task } from '../types'

/**
 * 关键路径方法（CPM）实现
 * 计算项目的关键路径和任务的松弛时间
 */
export class CriticalPathCalculator {
  private tasks: Map<string, Task> = new Map()
  private adjacencyList: Map<string, string[]> = new Map()
  private reverseAdjacencyList: Map<string, string[]> = new Map()

  constructor(tasks: Task[]) {
    this.initializeTasks(tasks)
    this.buildAdjacencyLists()
  }

  private initializeTasks(tasks: Task[]) {
    tasks.forEach(task => {
      // 计算任务持续时间（天）
      const duration = this.calculateDuration(task.startDate, task.endDate)
      const updatedTask = {
        ...task,
        duration,
        earlyStart: undefined,
        earlyFinish: undefined,
        lateStart: undefined,
        lateFinish: undefined,
        slack: 0,
        isOnCriticalPath: false
      }
      this.tasks.set(task.id, updatedTask)
    })
  }

  private calculateDuration(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // 转换为天数
  }

  private buildAdjacencyLists() {
    this.tasks.forEach((task, taskId) => {
      this.adjacencyList.set(taskId, [])
      this.reverseAdjacencyList.set(taskId, task.dependencies || [])
      
      // 构建正向邻接表
      task.dependencies?.forEach(depId => {
        if (!this.adjacencyList.has(depId)) {
          this.adjacencyList.set(depId, [])
        }
        this.adjacencyList.get(depId)?.push(taskId)
      })
    })
  }

  /**
   * 计算所有任务的关键路径信息
   */
  public calculateCriticalPath(): Task[] {
    // 前向计算：计算最早开始和最早完成时间
    this.forwardPass()
    
    // 后向计算：计算最晚开始和最晚完成时间
    this.backwardPass()
    
    // 计算松弛时间和标识关键路径
    this.calculateSlackAndCriticalPath()
    
    return Array.from(this.tasks.values())
  }

  private forwardPass() {
    const visited = new Set<string>()
    const stack: string[] = []

    // 拓扑排序
    this.tasks.forEach((_, taskId) => {
      if (!visited.has(taskId)) {
        this.topologicalSort(taskId, visited, stack)
      }
    })

    // 按拓扑顺序计算最早时间
    stack.reverse().forEach(taskId => {
      const task = this.tasks.get(taskId)!
      const dependencies = this.reverseAdjacencyList.get(taskId) || []

      if (dependencies.length === 0) {
        // 起始任务
        task.earlyStart = new Date(task.startDate)
      } else {
        // 依赖任务的最晚完成时间的最大值
        const maxEarlyFinish = Math.max(
          ...dependencies.map(depId => {
            const depTask = this.tasks.get(depId)!
            return depTask.earlyFinish?.getTime() || 0
          })
        )
        task.earlyStart = new Date(maxEarlyFinish)
      }

      task.earlyFinish = new Date(
        task.earlyStart.getTime() + (task.duration || 0) * 24 * 60 * 60 * 1000
      )
    })
  }

  private backwardPass() {
    const visited = new Set<string>()
    const stack: string[] = []

    // 反向拓扑排序
    this.tasks.forEach((_, taskId) => {
      if (!visited.has(taskId)) {
        this.reverseTopologicalSort(taskId, visited, stack)
      }
    })

    // 找到项目结束时间（最晚的 earlyFinish）
    const projectEndTime = Math.max(
      ...Array.from(this.tasks.values()).map(task => 
        task.earlyFinish?.getTime() || 0
      )
    )

    // 按反向拓扑顺序计算最晚时间
    stack.forEach(taskId => {
      const task = this.tasks.get(taskId)!
      const successors = this.adjacencyList.get(taskId) || []

      if (successors.length === 0) {
        // 结束任务
        task.lateFinish = new Date(projectEndTime)
      } else {
        // 后续任务的最早开始时间的最小值
        const minLateStart = Math.min(
          ...successors.map(succId => {
            const succTask = this.tasks.get(succId)!
            return succTask.lateStart?.getTime() || Infinity
          })
        )
        task.lateFinish = new Date(minLateStart)
      }

      task.lateStart = new Date(
        task.lateFinish.getTime() - (task.duration || 0) * 24 * 60 * 60 * 1000
      )
    })
  }

  private topologicalSort(taskId: string, visited: Set<string>, stack: string[]) {
    visited.add(taskId)
    
    const dependencies = this.reverseAdjacencyList.get(taskId) || []
    dependencies.forEach(depId => {
      if (!visited.has(depId)) {
        this.topologicalSort(depId, visited, stack)
      }
    })
    
    stack.push(taskId)
  }

  private reverseTopologicalSort(taskId: string, visited: Set<string>, stack: string[]) {
    visited.add(taskId)
    
    const successors = this.adjacencyList.get(taskId) || []
    successors.forEach(succId => {
      if (!visited.has(succId)) {
        this.reverseTopologicalSort(succId, visited, stack)
      }
    })
    
    stack.push(taskId)
  }

  private calculateSlackAndCriticalPath() {
    this.tasks.forEach(task => {
      if (task.lateStart && task.earlyStart) {
        task.slack = (task.lateStart.getTime() - task.earlyStart.getTime()) / (24 * 60 * 60 * 1000)
        task.isOnCriticalPath = task.slack === 0
      }
    })
  }

  /**
   * 获取关键路径上的任务
   */
  public getCriticalTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.isOnCriticalPath)
  }

  /**
   * 获取项目总工期
   */
  public getProjectDuration(): number {
    const endTimes = Array.from(this.tasks.values()).map(task => 
      task.earlyFinish?.getTime() || 0
    )
    const startTimes = Array.from(this.tasks.values()).map(task => 
      task.earlyStart?.getTime() || Infinity
    )
    
    const projectStart = Math.min(...startTimes)
    const projectEnd = Math.max(...endTimes)
    
    return Math.ceil((projectEnd - projectStart) / (24 * 60 * 60 * 1000))
  }

  /**
   * 获取任务的浮动时间信息
   */
  public getTaskFloat(taskId: string): {
    totalFloat: number
    freeFloat: number
  } {
    const task = this.tasks.get(taskId)
    if (!task) {
      return { totalFloat: 0, freeFloat: 0 }
    }

    const totalFloat = task.slack || 0
    
    // 计算自由浮动时间
    const successors = this.adjacencyList.get(taskId) || []
    let freeFloat = totalFloat
    
    if (successors.length > 0) {
      const minSuccessorEarlyStart = Math.min(
        ...successors.map(succId => {
          const succTask = this.tasks.get(succId)
          return succTask?.earlyStart?.getTime() || Infinity
        })
      )
      
      if (task.earlyFinish) {
        freeFloat = Math.min(
          totalFloat,
          (minSuccessorEarlyStart - task.earlyFinish.getTime()) / (24 * 60 * 60 * 1000)
        )
      }
    }

    return { totalFloat, freeFloat }
  }
}

/**
 * 便捷函数：计算任务的关键路径信息
 */
export function calculateCriticalPath(tasks: Task[]): {
  updatedTasks: Task[]
  criticalTasks: Task[]
  projectDuration: number
} {
  const calculator = new CriticalPathCalculator(tasks)
  const updatedTasks = calculator.calculateCriticalPath()
  const criticalTasks = calculator.getCriticalTasks()
  const projectDuration = calculator.getProjectDuration()

  return {
    updatedTasks,
    criticalTasks,
    projectDuration
  }
}
