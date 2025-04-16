import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import { getCosClient } from '~/server/lib/cos'
import { 
  ListObjectsV2Command, 
  S3Client
} from '@aws-sdk/client-s3'

const app = new Hono()

// 测试连接并列出顶层目录
app.post('/test-connection', async (c) => {
  try {
    const body = await c.req.json()
    const { storage, prefix, path } = body

    if (!storage) {
      throw new HTTPException(400, { message: '存储类型不能为空' })
    }

    // 根据存储类型获取存储桶内容
    const result = await listBucketContents(storage, prefix || '', path || '')
    return c.json({
      code: 200, 
      message: 'Success',
      data: result
    })
  } catch (e) {
    console.error(e)
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

// 浏览目录
app.post('/browse-directory', async (c) => {
  try {
    const body = await c.req.json()
    const { storage, path, prefix } = body

    if (!storage) {
      throw new HTTPException(400, { message: '存储类型不能为空' })
    }

    // 根据存储类型和路径获取目录内容
    const result = await listBucketContents(storage, path || '', prefix || '')
    return c.json({
      code: 200, 
      message: 'Success',
      data: result
    })
  } catch (e) {
    console.error(e)
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

// 列出存储桶内容
async function listBucketContents(storage: string, directoryPath: string = '', prefix: string = '') {
  try {
    switch (storage) {
      case 's3': return await listS3BucketContents(directoryPath, prefix)
      case 'r2': return await listR2BucketContents(directoryPath, prefix)
      case 'cos': return await listCosBucketContents(directoryPath, prefix)
      case 'alist': return await listAlistContents(directoryPath, prefix)
      default:
        throw new Error('不支持的存储类型')
    }
  } catch (error) {
    console.error('获取存储桶内容失败', error)
    throw error
  }
}

// 列出S3存储桶内容
async function listS3BucketContents(directoryPath: string = '', prefix: string = '') {
  const findConfig = await fetchConfigsByKeys([
    'accesskey_id',
    'accesskey_secret',
    'region',
    'endpoint',
    'bucket',
    'storage_folder',
    'force_path_style',
    's3_cdn',
    's3_cdn_url'
  ])

  const bucket = findConfig.find((item) => item.config_key === 'bucket')?.config_value || ''
  const storageFolder = findConfig.find((item) => item.config_key === 'storage_folder')?.config_value || ''
  const endpoint = findConfig.find((item) => item.config_key === 'endpoint')?.config_value || ''
  const s3Cdn = findConfig.find((item) => item.config_key === 's3_cdn')?.config_value
  const s3CdnUrl = findConfig.find((item) => item.config_key === 's3_cdn_url')?.config_value || ''

  if (!bucket) {
    throw new Error('存储桶名称未配置')
  }

  const s3Client = getClient(findConfig)
  const folderPrefix = storageFolder ? (storageFolder.endsWith('/') ? storageFolder : `${storageFolder}/`) : ''
  const fullPrefix = directoryPath
    ? `${folderPrefix}${directoryPath}${directoryPath.endsWith('/') ? '' : '/'}`
    : folderPrefix

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: fullPrefix,
    Delimiter: '/'
  })
  
  const response = await s3Client.send(command)
  
  // 提取目录
  const directories = (response.CommonPrefixes || [])
    .map(prefix => prefix.Prefix)
    .filter(prefix => prefix && prefix !== fullPrefix) as string[]
  
  // 提取文件
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']
  const files = (response.Contents || [])
    .filter(item => {
      const key = item.Key || ''
      const name = key.split('/').pop() || ''
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
      return imageExtensions.includes(ext) && key !== fullPrefix
    })
    .map(item => {
      const key = item.Key || ''
      // 生成访问URL
      let url = ''
      if (s3Cdn === 'true') {
        url = `${s3CdnUrl}/${key}`
      } else {
        url = `https://${bucket}.${endpoint}/${key}`
      }
      
      return {
        name: key.split('/').pop(),
        url,
        key,
        size: item.Size,
        lastModified: item.LastModified
      }
    })
  
  return {
    directories,
    files
  }
}

// 列出R2存储桶内容
async function listR2BucketContents(directoryPath: string = '', prefix: string = '') {
  const findConfig = await fetchConfigsByKeys([
    'r2_accesskey_id',
    'r2_accesskey_secret',
    'r2_endpoint',
    'r2_bucket',
    'r2_storage_folder',
    'r2_public_domain'
  ])

  const r2Bucket = findConfig.find((item) => item.config_key === 'r2_bucket')?.config_value || ''
  const r2StorageFolder = findConfig.find((item) => item.config_key === 'r2_storage_folder')?.config_value || ''
  const r2Endpoint = findConfig.find((item) => item.config_key === 'r2_endpoint')?.config_value || ''
  const r2PublicDomain = findConfig.find((item) => item.config_key === 'r2_public_domain')?.config_value || ''

  if (!r2Bucket) {
    throw new Error('存储桶名称未配置')
  }

  const r2Client = getR2Client(findConfig)
  const folderPrefix = r2StorageFolder ? (r2StorageFolder.endsWith('/') ? r2StorageFolder : `${r2StorageFolder}/`) : ''
  const fullPrefix = directoryPath
    ? `${folderPrefix}${directoryPath}${directoryPath.endsWith('/') ? '' : '/'}`
    : folderPrefix

  const command = new ListObjectsV2Command({
    Bucket: r2Bucket,
    Prefix: fullPrefix,
    Delimiter: '/'
  })
  
  const response = await r2Client.send(command)
  
  // 提取目录
  const directories = (response.CommonPrefixes || [])
    .map(prefix => prefix.Prefix)
    .filter(prefix => prefix && prefix !== fullPrefix) as string[]
  
  // 提取文件
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']
  const files = (response.Contents || [])
    .filter(item => {
      const key = item.Key || ''
      const name = key.split('/').pop() || ''
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
      return imageExtensions.includes(ext) && key !== fullPrefix
    })
    .map(item => {
      const key = item.Key || ''
      // 生成访问URL
      const baseUrl = r2PublicDomain
        ? (r2PublicDomain.includes('https://') ? r2PublicDomain : `https://${r2PublicDomain}`)
        : (r2Endpoint.includes('https://') ? r2Endpoint : `https://${r2Endpoint}`)
      
      return {
        name: key.split('/').pop(),
        url: `${baseUrl}/${key}`,
        key,
        size: item.Size,
        lastModified: item.LastModified
      }
    })
  
  return {
    directories,
    files
  }
}

// 列出COS存储桶内容
async function listCosBucketContents(directoryPath: string = '', prefix: string = '') {
  const findConfig = await fetchConfigsByKeys([
    'cos_secret_id',
    'cos_secret_key',
    'cos_region',
    'cos_bucket',
    'cos_storage_folder',
    'cos_domain'
  ])

  const cosBucket = findConfig.find((item) => item.config_key === 'cos_bucket')?.config_value || ''
  const cosStorageFolder = findConfig.find((item) => item.config_key === 'cos_storage_folder')?.config_value || ''
  const cosRegion = findConfig.find((item) => item.config_key === 'cos_region')?.config_value || ''
  const cosDomain = findConfig.find((item) => item.config_key === 'cos_domain')?.config_value || ''

  if (!cosBucket) {
    throw new Error('存储桶名称未配置')
  }

  const cosClient = getCosClient(findConfig)
  const folderPrefix = cosStorageFolder ? (cosStorageFolder.endsWith('/') ? cosStorageFolder : `${cosStorageFolder}/`) : ''
  const fullPrefix = directoryPath
    ? `${folderPrefix}${directoryPath}${directoryPath.endsWith('/') ? '' : '/'}`
    : folderPrefix

  return new Promise((resolve, reject) => {
    cosClient.getBucket({
      Bucket: cosBucket,
      Region: cosRegion,
      Prefix: fullPrefix,
      Delimiter: '/'
    }, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      // 提取目录
      const directories = (data.CommonPrefixes || [])
        .map(prefix => prefix.Prefix)
        .filter(prefix => prefix && prefix !== fullPrefix)

      // 提取文件
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']
      const files = (data.Contents || [])
        .filter(item => {
          const key = item.Key || ''
          const name = key.split('/').pop() || ''
          const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
          return imageExtensions.includes(ext) && key !== fullPrefix
        })
        .map(item => {
          const key = item.Key || ''
          // 生成访问URL
          const baseUrl = cosDomain
            ? (cosDomain.includes('https://') ? cosDomain : `https://${cosDomain}`)
            : `https://${cosBucket}.cos.${cosRegion}.myqcloud.com`
          
          return {
            name: key.split('/').pop(),
            url: `${baseUrl}/${key}`,
            key,
            size: item.Size,
            lastModified: item.LastModified
          }
        })

      resolve({
        directories,
        files
      })
    })
  })
}

// 列出Alist内容
async function listAlistContents(directoryPath: string = '', mountPath: string = '') {
  const findConfig = await fetchConfigsByKeys([
    'alist_url',
    'alist_token'
  ])

  const alistToken = findConfig.find((item) => item.config_key === 'alist_token')?.config_value || ''
  const alistUrl = findConfig.find((item) => item.config_key === 'alist_url')?.config_value || ''

  if (!alistToken || !alistUrl) {
    throw new Error('AList 配置信息不完整')
  }

  if (!mountPath) {
    throw new Error('AList 挂载路径不能为空')
  }

  const fullPath = directoryPath
    ? `${mountPath}${mountPath.endsWith('/') ? '' : '/'}${directoryPath}`
    : mountPath

  // 获取目录内容
  const response = await fetch(`${alistUrl}/api/fs/list`, {
    method: 'POST',
    headers: {
      'Authorization': alistToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path: fullPath })
  }).then(res => res.json())

  if (response.code !== 200) {
    throw new Error(response.message || 'AList 获取目录内容失败')
  }

  // 提取目录
  const directories = response.data.content
    .filter((item: any) => item.is_dir)
    .map((item: any) => `${fullPath}${fullPath.endsWith('/') ? '' : '/'}${item.name}`)

  // 提取图片文件
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']
  const files = response.data.content
    .filter((item: any) => {
      if (item.is_dir) return false
      const name = item.name || ''
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
      return imageExtensions.includes(ext)
    })
    .map((item: any) => {
      return {
        name: item.name,
        url: item.thumb_url || '', // AList可能提供预览URL
        key: `${fullPath}${fullPath.endsWith('/') ? '' : '/'}${item.name}`,
        size: item.size,
        lastModified: item.modified
      }
    })

  // 如果文件的URL为空，则尝试获取实际URL
  const filesWithUrls = await Promise.all(
    files.map(async (file) => {
      if (!file.url) {
        try {
          const fileRes = await fetch(`${alistUrl}/api/fs/get`, {
            method: 'POST',
            headers: {
              'Authorization': alistToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: file.key })
          }).then(res => res.json())

          if (fileRes.code === 200 && fileRes.data.raw_url) {
            file.url = fileRes.data.raw_url
          }
        } catch (e) {
          console.error('获取文件URL失败', e)
        }
      }
      return file
    })
  )

  return {
    directories,
    files: filesWithUrls
  }
}

export default app 