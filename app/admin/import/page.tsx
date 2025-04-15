'use client'

import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { AlbumType } from '~/types'
import COS from 'cos-js-sdk-v5'

export default function Import() {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

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

  const handleListFiles = async () => {
    if (!selectedAlbum) {
      toast.warning('请先选择相册')
      return
    }

    try {
      setLoading(true)
      const files = await new Promise<string[]>((resolve, reject) => {
        cos.getBucket({
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
          Prefix: selectedAlbum,
        }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            const fileList = data.Contents
              ?.filter(item => !item.Key.endsWith('/'))
              .map(item => item.Key) || []
            resolve(fileList)
          }
        })
      })

      setSelectedFiles(files)
      toast.success(`找到 ${files.length} 个文件`)
    } catch (error) {
      console.error('获取文件列表失败:', error)
      toast.error('获取文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast.warning('请先获取文件列表')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/v1/images/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          album: selectedAlbum,
          files: selectedFiles,
        }),
      }).then(res => res.json())

      if (res?.code === 200) {
        toast.success('导入成功')
        setSelectedFiles([])
      } else {
        toast.error('导入失败')
      }
    } catch (error) {
      console.error('导入失败:', error)
      toast.error('导入失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-4">导入相册</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择相册
          </label>
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择相册</option>
            {albums?.map((album) => (
              <option key={album.id} value={album.name}>
                {album.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleListFiles}
            disabled={loading || !selectedAlbum}
          >
            获取文件列表
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || selectedFiles.length === 0}
          >
            导入选中文件
          </Button>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">文件列表</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedFiles.map((file) => (
                <div
                  key={file}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={`https://${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com/${file}`}
                    alt={file}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 