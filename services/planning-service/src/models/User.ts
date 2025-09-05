import mongoose, { Schema, Document } from 'mongoose'
import { User as IUser } from '../types/index.js'

// 用户Schema
const UserSchema = new Schema<IUser & Document>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }
}, {
  timestamps: true,
  _id: false // 禁用默认的_id，使用自定义的id字段
})

// 索引
UserSchema.index({ id: 1 })
UserSchema.index({ username: 1 })
UserSchema.index({ email: 1 })

// 中间件：保存前生成ID
UserSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString()
  }
  next()
})

export const UserModel = mongoose.model<IUser & Document>('User', UserSchema)
