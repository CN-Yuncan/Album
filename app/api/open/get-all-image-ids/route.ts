import { NextResponse } from 'next/server'
import { db } from '~/server/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const order = searchParams.get('order') || 'timeDesc' // 默认时间倒序
    
    // 根据排序参数确定SQL排序
    let orderBySql = 'created_at DESC'
    if (order === 'timeAsc') {
      orderBySql = 'created_at ASC'
    } else if (order === 'nameAsc') {
      orderBySql = 'title ASC'
    } else if (order === 'nameDesc') {
      orderBySql = 'title DESC'
    }
    
    // 使用模板字符串构建SQL查询
    // 获取所有公开图片ID，按指定顺序排序
    const query = `
      SELECT id
      FROM "public"."images"
      WHERE del = 0 AND show = 0
      ORDER BY ${orderBySql}
    `
    
    const publicImages = await db.$queryRaw(Prisma.sql([query])) as { id: string }[]
    
    // 提取ID列表
    const imageIds = publicImages.map(img => img.id)
    
    return NextResponse.json({ 
      success: true, 
      ids: imageIds,
      order: order
    }, { status: 200 })
  } catch (error) {
    console.error('获取所有图片ID失败:', error)
    return NextResponse.json({ 
      success: false, 
      message: '获取图片列表失败',
      ids: []
    }, { status: 500 })
  }
} 