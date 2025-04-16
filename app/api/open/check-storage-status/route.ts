import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

export async function GET(req: Request) {
  try {
    // 验证用户是否登录
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.json({ code: 401, message: '未授权，请登录' }, { status: 401 })
    }

    // 获取S3配置
    const s3Config = await fetchConfigsByKeys([
      'accesskey_id', 
      'accesskey_secret', 
      'endpoint', 
      'bucket'
    ])
    
    // 获取R2配置
    const r2Config = await fetchConfigsByKeys([
      'r2_accesskey_id', 
      'r2_accesskey_secret', 
      'r2_endpoint', 
      'r2_bucket'
    ])
    
    // 获取COS配置
    const cosConfig = await fetchConfigsByKeys([
      'cos_secret_id', 
      'cos_secret_key', 
      'cos_region', 
      'cos_bucket'
    ])
    
    // 获取Alist配置
    const alistConfig = await fetchConfigsByKeys([
      'alist_url', 
      'alist_token'
    ])

    // 检查配置是否完整
    const s3Enabled = s3Config.every(item => item.config_value !== '')
    const r2Enabled = r2Config.every(item => item.config_value !== '')
    const cosEnabled = cosConfig.every(item => item.config_value !== '')
    const alistEnabled = alistConfig.every(item => item.config_value !== '')

    const statusMap = {
      s3: { 
        s3: s3Enabled, 
        loading: false 
      },
      r2: { 
        r2: r2Enabled, 
        loading: false 
      },
      cos: { 
        cos: cosEnabled, 
        loading: false 
      },
      alist: { 
        alist: alistEnabled, 
        loading: false 
      }
    }

    return NextResponse.json({ 
      code: 200, 
      message: 'Success', 
      data: statusMap 
    })
  } catch (error) {
    console.error('检查存储状态失败', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
} 