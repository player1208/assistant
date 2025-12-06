/**
 * 检查和修复 MongoDB 数据库中的编码问题
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: './services/schedule-service/.env' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:mongo@localhost:27017/assistent?authSource=admin'

async function checkDatabaseEncoding() {
  try {
    console.log('🔍 连接到 MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ 连接成功')

    const db = mongoose.connection.db
    if (!db) {
      console.error('❌ 无法获取数据库连接')
      return
    }

    // 获取所有集合
    const collections = await db.listCollections().toArray()
    console.log(`\n📊 找到 ${collections.length} 个集合:`)

    for (const collection of collections) {
      const collectionName = collection.name
      console.log(`\n📋 检查集合: ${collectionName}`)

      const col = db.collection(collectionName)
      const count = await col.countDocuments()
      console.log(`   文档数: ${count}`)

      if (count > 0) {
        // 获取第一条文档
        const doc = await col.findOne()
        console.log(`   第一条文档:`)
        console.log(JSON.stringify(doc, null, 2))
      }
    }

    console.log('\n✅ 检查完成')
  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkDatabaseEncoding()

