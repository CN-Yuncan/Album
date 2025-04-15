'use client'

import React, { useState, useCallback } from 'react'
import { Upload, ConfigProvider, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Tag, TagInput } from 'emblor'
import { useTranslations } from 'next-intl'
import { exifReader } from '~/lib/utils/file'
import { Send } from 'lucide-react'
import COS from 'cos-js-sdk-v5'

const { Dragger } = Upload

export default function CosFileUpload() {
  const t = useTranslations()
  const [storage, setStorage] = useState('cos')
  const [album, setAlbum] = useState('')
  const [exif, setExif] = useState({} as ExifType)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [detail, setDetail] = useState('')
  const [imageLabels, setImageLabels] = useState([] as string[])
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)

  const { data: albums } = useSWR<AlbumType[]>('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const cosConfig = {
    SecretId: configs?.find(config => config.config_key === 'cos_secret_id')?.config_value,
    SecretKey: configs?.find(config => config.config_key === 'cos_secret_key')?.config_value,
    Bucket: configs?.find(config => config.config_key === 'cos_bucket')?.config_value,
    Region: configs?.find(config => config.config_key === 'cos_region')?.config_value,
  }

  const cos = new COS({
    SecretId: cosConfig.SecretId,
    SecretKey: cosConfig.SecretKey,
  })

  const uploadToCos = async (file: File, key: string) => {
    return new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: key,
        Body: file,
        onProgress: (info) => {
          const percent = Math.round(info.loaded / info.total * 100)
          console.log('上传进度:', percent)
        },
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  const handleUpload = async (file: File) => {
    try {
      setLoading(true)
      
      if (!album) {
        toast.warning('请先选择相册！')
        return
      }

      // 生成文件路径
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const key = `${album}/${timestamp}.${fileExt}`
      const previewKey = `${album}/preview/${timestamp}.${fileExt}`

      // 上传原图
      await uploadToCos(file, key)
      setUrl(`https://${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com/${key}`)

      // 创建预览图
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      img.onload = async () => {
        setWidth(img.width)
        setHeight(img.height)
        
        // 计算预览图尺寸
        const maxWidth = 800
        const scale = maxWidth / img.width
        canvas.width = maxWidth
        canvas.height = img.height * scale
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // 转换为Blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            const previewFile = new File([blob], `preview_${timestamp}.${fileExt}`, { type: 'image/jpeg' })
            await uploadToCos(previewFile, previewKey)
            setPreviewUrl(`https://${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com/${previewKey}`)
          }
        }, 'image/jpeg', 0.8)
      }
      
      img.src = URL.createObjectURL(file)

      // 读取EXIF信息
      const { tags, exifObj } = await exifReader(file)
      setExif(exifObj)
      if (tags?.GPSLatitude?.description) {
        setLat(tags.GPSLatitude.description)
      }
      if (tags?.GPSLongitude?.description) {
        setLon(tags.GPSLongitude.description)
      }

      toast.success('上传成功')
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      if (!url) {
        toast.warning('请先上传文件！')
        return
      }

      const data = {
        album,
        url,
        title,
        preview_url: previewUrl,
        exif,
        labels: imageLabels,
        detail,
        width,
        height,
        type: 1,
        lat,
        lon,
      } as ImageType

      const res = await fetch('/api/v1/images/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => res.json())

      if (res?.code === 200) {
        toast.success('保存成功')
        // 重置表单
        setTitle('')
        setUrl('')
        setPreviewUrl('')
        setImageLabels([])
        setDetail('')
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    name: 'file',
    multiple: false,
    customRequest: ({ file }: { file: File }) => {
      handleUpload(file)
    },
    showUploadList: false,
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Select value={storage} onValueChange={setStorage}>
          <SelectTrigger>
            <SelectValue placeholder={t('Upload.selectStorage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="cos">腾讯云 COS</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={album} onValueChange={setAlbum}>
          <SelectTrigger>
            <SelectValue placeholder={t('Upload.selectAlbum')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {albums?.map((album) => (
                <SelectItem key={album.id} value={album.name}>
                  {album.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{t('Upload.uploadTips1')}</p>
          <p className="ant-upload-hint">{t('Upload.uploadTips2')}</p>
        </Dragger>

        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-gray-700">{t('Upload.title')}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={t('Upload.inputTitle')}
            />
          </div>

          <div>
            <span className="text-xs font-medium text-gray-700">{t('Upload.detail')}</span>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={t('Upload.inputDetail')}
            />
          </div>

          <div>
            <span className="text-xs font-medium text-gray-700">{t('Upload.tags')}</span>
            <TagInput
              tags={imageLabels}
              onChange={setImageLabels}
              activeTagIndex={activeTagIndex}
              setActiveTagIndex={setActiveTagIndex}
              placeholder={t('Upload.indexTag')}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {t('Upload.submit')}
        </Button>
      </div>
    </div>
  )
} 