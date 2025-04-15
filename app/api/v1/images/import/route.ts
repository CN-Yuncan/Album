import { NextResponse } from 'next/server'
import { prisma } from '~/server/db'

export async function POST(request: Request) {
  try {
    const { album, files } = await request.json()

    // 批量创建图片记录
    const images = await Promise.all(
      files.map(async (file: string) => {
        const fileName = file.split('/').pop() || ''
        const title = fileName.split('.')[0]

        return prisma.image.create({
          data: {
            album,
            url: file,
            title,
            type: 1,
            show: false,
          },
        })
      })
    )

    return NextResponse.json({
      code: 200,
      message: '导入成功',
      data: images,
    })
  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json({
      code: 500,
      message: '导入失败',
    })
  }
} 