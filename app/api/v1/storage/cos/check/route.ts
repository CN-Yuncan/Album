import { NextResponse } from 'next/server'
import COS from 'cos-js-sdk-v5'

export async function POST(request: Request) {
  try {
    const { secretId, secretKey, bucket, region } = await request.json()

    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey,
    })

    // 尝试获取存储桶列表来验证连接
    await new Promise((resolve, reject) => {
      cos.getBucket({
        Bucket: bucket,
        Region: region,
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })

    return NextResponse.json({
      code: 200,
      message: '连接成功',
    })
  } catch (error) {
    console.error('COS连接检测失败:', error)
    return NextResponse.json({
      code: 500,
      message: '连接失败',
    })
  }
} 