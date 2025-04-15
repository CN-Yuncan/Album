'use client'

import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'

interface BatchActionsProps {
  images: ImageType[]
  onUpdate: () => void
}

export default function BatchActions({ images, onUpdate }: BatchActionsProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(images.map(img => img.id)))
    }
  }

  const handleInvertSelection = () => {
    const newSelected = new Set<string>()
    images.forEach(img => {
      if (!selectedImages.has(img.id)) {
        newSelected.add(img.id)
      }
    })
    setSelectedImages(newSelected)
  }

  const handleToggleImage = (imageId: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  const handleBatchAddToHomepage = async () => {
    if (selectedImages.size === 0) {
      toast.warning('请先选择图片')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/v1/images/batch-add-to-homepage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds: Array.from(selectedImages),
        }),
      }).then(res => res.json())

      if (res?.code === 200) {
        toast.success('批量添加到首页成功')
        onUpdate()
      } else {
        toast.error('批量添加到首页失败')
      }
    } catch (error) {
      console.error('批量添加到首页失败:', error)
      toast.error('批量添加到首页失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchRemoveFromHomepage = async () => {
    if (selectedImages.size === 0) {
      toast.warning('请先选择图片')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/v1/images/batch-remove-from-homepage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds: Array.from(selectedImages),
        }),
      }).then(res => res.json())

      if (res?.code === 200) {
        toast.success('批量从首页移除成功')
        onUpdate()
      } else {
        toast.error('批量从首页移除失败')
      }
    } catch (error) {
      console.error('批量从首页移除失败:', error)
      toast.error('批量从首页移除失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          onClick={handleSelectAll}
          variant="outline"
          size="sm"
        >
          {selectedImages.size === images.length ? '取消全选' : '全选'}
        </Button>
        <Button
          onClick={handleInvertSelection}
          variant="outline"
          size="sm"
        >
          反选
        </Button>
        <Button
          onClick={handleBatchAddToHomepage}
          disabled={loading || selectedImages.size === 0}
          size="sm"
        >
          批量添加到首页
        </Button>
        <Button
          onClick={handleBatchRemoveFromHomepage}
          disabled={loading || selectedImages.size === 0}
          variant="destructive"
          size="sm"
        >
          批量从首页移除
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative cursor-pointer ${
              selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleToggleImage(image.id)}
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-32 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
} 