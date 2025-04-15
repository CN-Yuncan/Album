'use client'

import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { useButtonStore } from '~/stores/button-stores'

export function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    try {
      // TODO: 实现上传逻辑
      console.log('Uploading file:', file)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
      setFile(null)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-64"
      />
      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
      >
        {isUploading ? '上传中...' : '上传'}
      </Button>
    </div>
  )
} 