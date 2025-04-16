import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function POST(req: Request) {
  try {
    // 验证用户是否登录
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.json({ code: 401, message: '未授权，请登录' }, { status: 401 })
    }

    const body = await req.json()
    const { storage, path, prefix } = body

    if (!storage) {
      return NextResponse.json({ code: 400, message: '存储类型不能为空' }, { status: 400 })
    }

    // 调用Hono API获取目录内容
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/hono/storage/browse-directory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storage, path, prefix }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('浏览目录失败', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
} 