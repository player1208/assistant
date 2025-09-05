import { Request, Response } from 'express'
import { ProjectModel } from '../models/Project.js'
import { ConnectionModel } from '../models/Connection.js'
import { calculateCriticalPath } from '../utils/criticalPath.js'
import { 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ApiResponse, 
  Project 
} from '../types/index.js'
import { v4 as uuidv4 } from 'uuid'

// 获取所有项目
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query
    const filter = userId ? { userId } : {}
    
    const projects = await ProjectModel.find(filter).sort({ updatedAt: -1 })
    
    const response: ApiResponse<Project[]> = {
      success: true,
      data: projects.map(project => project.toObject())
    }
    
    res.json(response)
  } catch (error) {
    console.error('获取项目列表失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '获取项目列表失败'
    }
    res.status(500).json(response)
  }
}

// 获取单个项目
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    
    const project = await ProjectModel.findOne({ id })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    // 获取项目的连接
    const connections = await ConnectionModel.find({ projectId: id })
    
    // 计算关键路径
    const { updatedTasks, criticalTasks, projectDuration } = calculateCriticalPath(project.tasks)
    
    // 更新项目中的任务
    project.tasks = updatedTasks
    await project.save()

    const response: ApiResponse<Project & { connections: any[], criticalPath: any }> = {
      success: true,
      data: {
        ...project.toObject(),
        connections: connections.map(conn => conn.toObject()),
        criticalPath: {
          criticalTasks,
          projectDuration
        }
      }
    }
    
    res.json(response)
  } catch (error) {
    console.error('获取项目失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '获取项目失败'
    }
    res.status(500).json(response)
  }
}

// 创建项目
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, color }: CreateProjectRequest = req.body
    const { userId } = req.query

    if (!name) {
      const response: ApiResponse = {
        success: false,
        error: '项目名称不能为空'
      }
      res.status(400).json(response)
      return
    }

    const project = new ProjectModel({
      id: uuidv4(),
      name,
      description,
      color: color || '#3B82F6',
      tasks: [],
      userId: userId as string
    })

    await project.save()

    const response: ApiResponse<Project> = {
      success: true,
      data: project.toObject(),
      message: '项目创建成功'
    }
    
    res.status(201).json(response)
  } catch (error) {
    console.error('创建项目失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '创建项目失败'
    }
    res.status(500).json(response)
  }
}

// 更新项目
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updates: UpdateProjectRequest = req.body

    const project = await ProjectModel.findOne({ id })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    // 更新项目字段
    Object.assign(project, updates)
    await project.save()

    const response: ApiResponse<Project> = {
      success: true,
      data: project.toObject(),
      message: '项目更新成功'
    }
    
    res.json(response)
  } catch (error) {
    console.error('更新项目失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '更新项目失败'
    }
    res.status(500).json(response)
  }
}

// 删除项目
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const project = await ProjectModel.findOne({ id })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    // 删除项目及其相关连接
    await ProjectModel.deleteOne({ id })
    await ConnectionModel.deleteMany({ projectId: id })

    const response: ApiResponse = {
      success: true,
      message: '项目删除成功'
    }
    
    res.json(response)
  } catch (error) {
    console.error('删除项目失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '删除项目失败'
    }
    res.status(500).json(response)
  }
}
