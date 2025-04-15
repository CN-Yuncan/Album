import { NextResponse } from 'next/server'
import { prisma } from '~/server/db'

export async function POST(request: Request) {
  try {
    const { imageIds } = await request.json()

    await prisma.image.updateMany({
      where: {
        id: {
          in: imageIds,
        },
      },
      data: {
        show: false,
      },
    })

    return NextResponse.json({
      code: 200,
      message: '批量从首页移除成功',
    })
  } catch (error) {
    console.error('批量从首页移除失败:', error)
    return NextResponse.json({
      code: 500,
      message: '批量从首页移除失败',
    })
  }
} 