import { NextResponse } from 'next/server'
import { db } from '~/server/lib/db'

export async function GET() {
  try {
    // 获取所有公开图片
    const publicImages = await db.$queryRaw`
      SELECT id
      FROM "public"."images"
      WHERE del = 0 AND show = 0
      ORDER BY id
    ` as { id: string }[]
    
    if (!publicImages || publicImages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '没有找到可用的图片' 
      }, { status: 404 })
    }
    
    // 随机选择一张图片
    const randomIndex = Math.floor(Math.random() * publicImages.length)
    const randomImage = publicImages[randomIndex]
    
    return NextResponse.json({ 
      success: true, 
      id: randomImage.id 
    }, { status: 200 })
  } catch (error) {
    console.error('获取随机图片失败:', error)
    return NextResponse.json({ 
      success: false, 
      message: '获取随机图片失败' 
    }, { status: 500 })
  }
} 