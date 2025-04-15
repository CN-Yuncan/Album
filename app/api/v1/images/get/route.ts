import { NextResponse } from 'next/server'
import { prisma } from '~/server/db'

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      code: 200,
      data: images,
    })
  } catch (error) {
    console.error('获取图片列表失败:', error)
    return NextResponse.json({
      code: 500,
      message: '获取图片列表失败',
    })
  }
} 