import { Request, Response } from 'express'
import { ProjectModel } from '../models/Project.js'
import { calculateCriticalPath } from '../utils/criticalPath.js'
import { 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  ApiResponse, 
  Task 
} from '../types/index.js'
import { v4 as uuidv4 } from 'uuid'

// 获取项目中的所有任务
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params

    const project = await ProjectModel.findOne({ id: projectId })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    // 计算关键路径
    const { updatedTasks } = calculateCriticalPath(project.tasks)
    
    // 更新项目中的任务
    project.tasks = updatedTasks
    await project.save()

    const response: ApiResponse<Task[]> = {
      success: true,
      data: updatedTasks
    }
    
    res.json(response)
  } catch (error) {
    console.error('获取任务列表失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '获取任务列表失败'
    }
    res.status(500).json(response)
  }
}

// 获取单个任务
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, taskId } = req.params

    const project = await ProjectModel.findOne({ id: projectId })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) {
      const response: ApiResponse = {
        success: false,
        error: '任务不存在'
      }
      res.status(404).json(response)
      return
    }

    const response: ApiResponse<Task> = {
      success: true,
      data: task
    }
    
    res.json(response)
  } catch (error) {
    console.error('获取任务失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '获取任务失败'
    }
    res.status(500).json(response)
  }
}

// 创建任务
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params
    const taskData: CreateTaskRequest = req.body

    const project = await ProjectModel.findOne({ id: projectId })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    // 验证依赖关系
    if (taskData.dependencies) {
      for (const depId of taskData.dependencies) {
        const depTask = project.tasks.find(t => t.id === depId)
        if (!depTask) {
          const response: ApiResponse = {
            success: false,
            error: `依赖任务 ${depId} 不存在`
          }
          res.status(400).json(response)
          return
        }
      }
    }

    const newTask: Task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description,
      startDate: new Date(taskData.startDate),
      endDate: new Date(taskData.endDate),
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      dependencies: taskData.dependencies || [],
      position: taskData.position || { x: 0, y: 0 },
      progress: taskData.progress || 0,
      estimatedHours: taskData.estimatedHours
    }

    project.tasks.push(newTask)
    
    // 重新计算关键路径
    const { updatedTasks } = calculateCriticalPath(project.tasks)
    project.tasks = updatedTasks
    
    await project.save()

    const response: ApiResponse<Task> = {
      success: true,
      data: newTask,
      message: '任务创建成功'
    }
    
    res.status(201).json(response)
  } catch (error) {
    console.error('创建任务失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '创建任务失败'
    }
    res.status(500).json(response)
  }
}

// 更新任务
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, taskId } = req.params
    const updates: UpdateTaskRequest = req.body

    const project = await ProjectModel.findOne({ id: projectId })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    const taskIndex = project.tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: '任务不存在'
      }
      res.status(404).json(response)
      return
    }

    // 验证依赖关系
    if (updates.dependencies) {
      for (const depId of updates.dependencies) {
        if (depId === taskId) {
          const response: ApiResponse = {
            success: false,
            error: '任务不能依赖自己'
          }
          res.status(400).json(response)
          return
        }
        const depTask = project.tasks.find(t => t.id === depId)
        if (!depTask) {
          const response: ApiResponse = {
            success: false,
            error: `依赖任务 ${depId} 不存在`
          }
          res.status(400).json(response)
          return
        }
      }
    }

    // 更新任务
    const task = project.tasks[taskIndex]
    Object.assign(task, updates)
    
    // 重新计算关键路径
    const { updatedTasks } = calculateCriticalPath(project.tasks)
    project.tasks = updatedTasks
    
    await project.save()

    const updatedTask = project.tasks.find(t => t.id === taskId)!

    const response: ApiResponse<Task> = {
      success: true,
      data: updatedTask,
      message: '任务更新成功'
    }
    
    res.json(response)
  } catch (error) {
    console.error('更新任务失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '更新任务失败'
    }
    res.status(500).json(response)
  }
}

// 删除任务
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, taskId } = req.params

    const project = await ProjectModel.findOne({ id: projectId })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    const taskIndex = project.tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: '任务不存在'
      }
      res.status(404).json(response)
      return
    }

    // 检查是否有其他任务依赖此任务
    const dependentTasks = project.tasks.filter(t => t.dependencies.includes(taskId))
    if (dependentTasks.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: `无法删除任务，有 ${dependentTasks.length} 个任务依赖此任务`
      }
      res.status(400).json(response)
      return
    }

    // 删除任务
    project.tasks.splice(taskIndex, 1)
    
    // 重新计算关键路径
    const { updatedTasks } = calculateCriticalPath(project.tasks)
    project.tasks = updatedTasks
    
    await project.save()

    const response: ApiResponse = {
      success: true,
      message: '任务删除成功'
    }
    
    res.json(response)
  } catch (error) {
    console.error('删除任务失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '删除任务失败'
    }
    res.status(500).json(response)
  }
}
