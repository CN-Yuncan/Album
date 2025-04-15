'use client'

import React from 'react'
import BatchActions from '~/components/admin/images/batch-actions'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ImageType } from '~/types'

export default function Images() {
  const { data: images, mutate } = useSWR<ImageType[]>('/api/v1/images/get', fetcher)

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-4">图片管理</h1>
      {images && <BatchActions images={images} onUpdate={mutate} />}
    </div>
  )
} 