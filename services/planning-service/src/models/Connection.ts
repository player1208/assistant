import mongoose, { Schema, Document } from 'mongoose'
import { Connection as IConnection } from '../types/index.js'

// 连接Schema
const ConnectionSchema = new Schema<IConnection & Document>({
  id: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
    default: 'finish-to-start'
  },
  projectId: { type: String, required: true }
}, {
  timestamps: true,
  _id: false // 禁用默认的_id，使用自定义的id字段
})

// 索引
ConnectionSchema.index({ id: 1 })
ConnectionSchema.index({ projectId: 1 })
ConnectionSchema.index({ from: 1, to: 1 })

// 中间件：保存前生成ID
ConnectionSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString()
  }
  next()
})

export const ConnectionModel = mongoose.model<IConnection & Document>('Connection', ConnectionSchema)
