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
        show: true,
      },
    })

    return NextResponse.json({
      code: 200,
      message: '批量添加到首页成功',
    })
  } catch (error) {
    console.error('批量添加到首页失败:', error)
    return NextResponse.json({
      code: 500,
      message: '批量添加到首页失败',
    })
  }
} 