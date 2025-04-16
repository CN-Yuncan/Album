'use client'

import React, { useEffect, useState } from 'react'
import { Button, Card, Checkbox, Form, Input, List, Select, Spin, message } from 'antd'
import { fetchAlbumAllList } from '~/server/db/query/albums'
import { AlbumType, ImageType, UploadStorageType } from '~/types'
import AdminContainer from '~/components/layout/admin/app-sidebar'
import { fetchConfigByKeys } from '~/server/db/query/configs'

export default function ImportPage() {
  const [albums, setAlbums] = useState<AlbumType[]>([])
  const [storageType, setStorageType] = useState('s3')
  const [loading, setLoading] = useState(false)
  const [directories, setDirectories] = useState<string[]>([])
  const [images, setImages] = useState<any[]>([])
  const [selectedImages, setSelectedImages] = useState<any[]>([])
  const [statusMap, setStatusMap] = useState<{[key: string]: {s3: boolean, r2: boolean, cos: boolean, alist: boolean}}>({})
  const [form] = Form.useForm()
  const [currentDir, setCurrentDir] = useState('')
  const [importLoading, setImportLoading] = useState(false)

  // 获取相册列表
  useEffect(() => {
    fetchAlbumAllList().then((res) => {
      if (res?.code === 200) {
        setAlbums(res?.data || [])
      }
    })
  }, [])

  // 检查存储连接状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const s3Config = await fetchConfigByKeys(['accesskey_id', 'accesskey_secret', 'endpoint', 'bucket'])
        const r2Config = await fetchConfigByKeys(['r2_accesskey_id', 'r2_accesskey_secret', 'r2_endpoint', 'r2_bucket'])
        const cosConfig = await fetchConfigByKeys(['cos_secret_id', 'cos_secret_key', 'cos_region', 'cos_bucket'])
        const alistConfig = await fetchConfigByKeys(['alist_url', 'alist_token'])

        const map = {
          s3: s3Config.every(item => item.config_value !== ''),
          r2: r2Config.every(item => item.config_value !== ''),
          cos: cosConfig.every(item => item.config_value !== ''),
          alist: alistConfig.every(item => item.config_value !== '')
        }

        setStatusMap({
          s3: { 
            s3: map.s3, r2: false, cos: false, alist: false 
          },
          r2: { 
            s3: false, r2: map.r2, cos: false, alist: false 
          },
          cos: { 
            s3: false, r2: false, cos: map.cos, alist: false 
          },
          alist: { 
            s3: false, r2: false, cos: false, alist: map.alist 
          }
        })
      } catch (error) {
        console.error('检查存储连接状态失败', error)
      }
    }

    checkStatus()
  }, [])

  // 连接测试
  const testConnection = async () => {
    try {
      setLoading(true)
      const values = form.getFieldsValue()
      
      const result = await fetch('/api/v1/storage/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storage: storageType,
          prefix: values.prefix || '',
          path: values.path || ''
        }),
      }).then(res => res.json())

      if (result?.code === 200) {
        message.success('连接成功')
        setDirectories(result.data.directories || [])
        setImages(result.data.files || [])
      } else {
        message.error('连接失败: ' + result?.message)
      }
    } catch (error) {
      message.error('连接失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 浏览目录
  const browseDirectory = async (dir: string) => {
    try {
      setLoading(true)
      setCurrentDir(dir)
      
      const values = form.getFieldsValue()
      const result = await fetch('/api/v1/storage/browse-directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storage: storageType,
          path: dir,
          prefix: values.prefix || '',
        }),
      }).then(res => res.json())

      if (result?.code === 200) {
        setDirectories(result.data.directories || [])
        setImages(result.data.files || [])
      } else {
        message.error('获取目录内容失败: ' + result?.message)
      }
    } catch (error) {
      message.error('获取目录内容失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 图片选择
  const toggleImageSelection = (item: any) => {
    const isSelected = selectedImages.some(img => img.url === item.url)
    if (isSelected) {
      setSelectedImages(selectedImages.filter(img => img.url !== item.url))
    } else {
      setSelectedImages([...selectedImages, item])
    }
  }

  // 导入选中的图片
  const importImages = async () => {
    try {
      setImportLoading(true)
      const values = form.getFieldsValue()
      
      if (!values.album) {
        message.warning('请选择相册')
        return
      }
      
      if (selectedImages.length === 0) {
        message.warning('请选择要导入的图片')
        return
      }
      
      const result = await fetch('/api/v1/images/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: selectedImages,
          album: values.album
        }),
      }).then(res => res.json())

      if (result?.code === 200) {
        message.success(`成功导入 ${result.data} 张图片`)
        setSelectedImages([])
      } else {
        message.error('导入失败: ' + result?.message)
      }
    } catch (error) {
      message.error('导入失败')
      console.error(error)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <AdminContainer>
      <Card title="图片导入工具" className="mb-4">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ storage: 's3' }}
        >
          <Form.Item
            label="存储类型"
            name="storage"
            rules={[{ required: true, message: '请选择存储类型' }]}
          >
            <Select 
              onChange={(value) => setStorageType(value)} 
              options={[
                { label: 'S3/阿里云OSS', value: 's3', disabled: !statusMap.s3?.s3 },
                { label: 'Cloudflare R2', value: 'r2', disabled: !statusMap.r2?.r2 },
                { label: '腾讯云COS', value: 'cos', disabled: !statusMap.cos?.cos },
                { label: 'AList', value: 'alist', disabled: !statusMap.alist?.alist },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="目标相册"
            name="album"
            rules={[{ required: true, message: '请选择相册' }]}
          >
            <Select
              showSearch
              placeholder="请选择相册"
              optionFilterProp="label"
              options={albums.map(album => ({ label: album.name, value: album.album_value }))}
            />
          </Form.Item>

          <Form.Item label="目录前缀" name="prefix">
            <Input placeholder="可选，指定要浏览的目录前缀" />
          </Form.Item>

          {storageType === 'alist' && (
            <Form.Item label="挂载路径" name="path" rules={[{ required: true, message: '请填写AList挂载路径' }]}>
              <Input placeholder="请输入AList挂载路径" />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" onClick={testConnection} loading={loading}>
              连接存储并浏览
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {(directories.length > 0 || images.length > 0) && (
        <Card title="浏览结果" className="mb-4">
          {currentDir && (
            <Button className="mb-4" onClick={() => {
              const parentDir = currentDir.split('/').slice(0, -1).join('/')
              browseDirectory(parentDir)
            }}>
              返回上一级
            </Button>
          )}

          {directories.length > 0 && (
            <div className="mb-4">
              <h3>目录</h3>
              <List
                bordered
                dataSource={directories}
                renderItem={item => (
                  <List.Item 
                    style={{ cursor: 'pointer' }}
                    onClick={() => browseDirectory(item)}
                  >
                    📁 {item.split('/').pop()}
                  </List.Item>
                )}
              />
            </div>
          )}

          {images.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3>图片</h3>
                <div>
                  <Button className="mr-2" onClick={() => setSelectedImages(images)}>
                    全选
                  </Button>
                  <Button onClick={() => setSelectedImages([])}>
                    取消选择
                  </Button>
                </div>
              </div>
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
                dataSource={images}
                renderItem={item => (
                  <List.Item>
                    <Card
                      hoverable
                      className={`${selectedImages.some(img => img.url === item.url) ? 'border-2 border-blue-500' : ''}`}
                      cover={
                        <div style={{ height: '150px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img 
                            alt="图片" 
                            src={item.url} 
                            style={{ maxWidth: '100%', maxHeight: '150px' }}
                          />
                        </div>
                      }
                      onClick={() => toggleImageSelection(item)}
                    >
                      <Card.Meta
                        title={
                          <Checkbox 
                            checked={selectedImages.some(img => img.url === item.url)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                !selectedImages.some(img => img.url === item.url) && setSelectedImages([...selectedImages, item])
                              } else {
                                setSelectedImages(selectedImages.filter(img => img.url !== item.url))
                              }
                            }}
                          >
                            {item.name}
                          </Checkbox>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </div>
          )}
        </Card>
      )}

      {selectedImages.length > 0 && (
        <Card title={`已选择 ${selectedImages.length} 张图片`} className="mb-4">
          <Button 
            type="primary" 
            onClick={importImages} 
            loading={importLoading}
          >
            导入到相册
          </Button>
        </Card>
      )}
    </AdminContainer>
  )
} 