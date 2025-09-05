import { Request, Response } from 'express'
import { ConnectionModel } from '../models/Connection.js'
import { ProjectModel } from '../models/Project.js'
import { 
  CreateConnectionRequest, 
  ApiResponse, 
  Connection 
} from '../types/index.js'
import { v4 as uuidv4 } from 'uuid'

// 获取项目的所有连接
export const getConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params

    const connections = await ConnectionModel.find({ projectId }).sort({ createdAt: -1 })

    const response: ApiResponse<Connection[]> = {
      success: true,
      data: connections.map(conn => conn.toObject())
    }
    
    res.json(response)
  } catch (error) {
    console.error('获取连接列表失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '获取连接列表失败'
    }
    res.status(500).json(response)
  }
}

// 获取单个连接
export const getConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const connection = await ConnectionModel.findOne({ id })
    if (!connection) {
      const response: ApiResponse = {
        success: false,
        error: '连接不存在'
      }
      res.status(404).json(response)
      return
    }

    const response: ApiResponse<Connection> = {
      success: true,
      data: connection.toObject()
    }
    
    res.json(response)
  } catch (error) {
    console.error('获取连接失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '获取连接失败'
    }
    res.status(500).json(response)
  }
}

// 创建连接
export const createConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params
    const { from, to, type }: CreateConnectionRequest = req.body

    // 验证项目存在
    const project = await ProjectModel.findOne({ id: projectId })
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: '项目不存在'
      }
      res.status(404).json(response)
      return
    }

    // 验证任务存在
    const fromTask = project.tasks.find(t => t.id === from)
    const toTask = project.tasks.find(t => t.id === to)
    
    if (!fromTask || !toTask) {
      const response: ApiResponse = {
        success: false,
        error: '源任务或目标任务不存在'
      }
      res.status(400).json(response)
      return
    }

    // 检查是否已存在相同的连接
    const existingConnection = await ConnectionModel.findOne({ 
      projectId, 
      from, 
      to 
    })
    
    if (existingConnection) {
      const response: ApiResponse = {
        success: false,
        error: '连接已存在'
      }
      res.status(400).json(response)
      return
    }

    // 检查循环依赖
    if (from === to) {
      const response: ApiResponse = {
        success: false,
        error: '任务不能连接到自己'
      }
      res.status(400).json(response)
      return
    }

    // 检查是否会形成循环依赖
    const wouldCreateCycle = await checkForCycle(projectId, from, to)
    if (wouldCreateCycle) {
      const response: ApiResponse = {
        success: false,
        error: '此连接会创建循环依赖'
      }
      res.status(400).json(response)
      return
    }

    const connection = new ConnectionModel({
      id: uuidv4(),
      from,
      to,
      type: type || 'finish-to-start',
      projectId
    })

    await connection.save()

    const response: ApiResponse<Connection> = {
      success: true,
      data: connection.toObject(),
      message: '连接创建成功'
    }
    
    res.status(201).json(response)
  } catch (error) {
    console.error('创建连接失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '创建连接失败'
    }
    res.status(500).json(response)
  }
}

// 更新连接
export const updateConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { type } = req.body

    const connection = await ConnectionModel.findOne({ id })
    if (!connection) {
      const response: ApiResponse = {
        success: false,
        error: '连接不存在'
      }
      res.status(404).json(response)
      return
    }

    // 更新连接类型
    connection.type = type
    await connection.save()

    const response: ApiResponse<Connection> = {
      success: true,
      data: connection.toObject(),
      message: '连接更新成功'
    }
    
    res.json(response)
  } catch (error) {
    console.error('更新连接失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '更新连接失败'
    }
    res.status(500).json(response)
  }
}

// 删除连接
export const deleteConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const connection = await ConnectionModel.findOne({ id })
    if (!connection) {
      const response: ApiResponse = {
        success: false,
        error: '连接不存在'
      }
      res.status(404).json(response)
      return
    }

    await ConnectionModel.deleteOne({ id })

    const response: ApiResponse = {
      success: true,
      message: '连接删除成功'
    }
    
    res.json(response)
  } catch (error) {
    console.error('删除连接失败:', error)
    const response: ApiResponse = {
      success: false,
      error: '删除连接失败'
    }
    res.status(500).json(response)
  }
}

// 检查是否会形成循环依赖
async function checkForCycle(projectId: string, from: string, to: string): Promise<boolean> {
  const connections = await ConnectionModel.find({ projectId })
  
  // 构建邻接表
  const graph = new Map<string, string[]>()
  connections.forEach(conn => {
    if (!graph.has(conn.from)) {
      graph.set(conn.from, [])
    }
    graph.get(conn.from)!.push(conn.to)
  })

  // 添加新连接
  if (!graph.has(from)) {
    graph.set(from, [])
  }
  graph.get(from)!.push(to)

  // 使用DFS检查循环
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  const hasCycle = (node: string): boolean => {
    if (recursionStack.has(node)) {
      return true
    }
    if (visited.has(node)) {
      return false
    }

    visited.add(node)
    recursionStack.add(node)

    const neighbors = graph.get(node) || []
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) {
        return true
      }
    }

    recursionStack.delete(node)
    return false
  }

  // 检查所有节点
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        return true
      }
    }
  }

  return false
}
