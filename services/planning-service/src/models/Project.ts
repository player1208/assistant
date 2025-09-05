import mongoose, { Schema, Document } from 'mongoose'
import { Project as IProject, Task } from '../types/index.js'

// 任务子文档Schema
const TaskSchema = new Schema<Task>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'blocked'],
    default: 'pending'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dependencies: [{ type: String }],
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  estimatedHours: { type: Number, min: 0 },
  actualHours: { type: Number, min: 0 },
  // 关键路径计算字段
  earlyStart: { type: Date },
  earlyFinish: { type: Date },
  lateStart: { type: Date },
  lateFinish: { type: Date },
  slack: { type: Number },
  isOnCriticalPath: { type: Boolean, default: false },
  duration: { type: Number }
}, {
  timestamps: true,
  _id: false // 禁用默认的_id，使用自定义的id字段
})

// 项目Schema
const ProjectSchema = new Schema<IProject & Document>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  tasks: [TaskSchema],
  color: { type: String, default: '#3B82F6' },
  userId: { type: String } // 用于多用户支持
}, {
  timestamps: true,
  _id: false // 禁用默认的_id，使用自定义的id字段
})

// 索引
ProjectSchema.index({ id: 1 })
ProjectSchema.index({ userId: 1 })
ProjectSchema.index({ 'tasks.id': 1 })

// 中间件：保存前生成ID
ProjectSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString()
  }
  next()
})

// 中间件：保存前为任务生成ID
ProjectSchema.pre('save', function(next) {
  this.tasks.forEach(task => {
    if (!task.id) {
      task.id = new mongoose.Types.ObjectId().toString()
    }
  })
  next()
})

export const ProjectModel = mongoose.model<IProject & Document>('Project', ProjectSchema)
