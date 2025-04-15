'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'

interface StorageStatus {
  name: string
  status: 'connected' | 'disconnected' | 'not_configured'
  message: string
}

export default function StorageStatus() {
  const [statuses, setStatuses] = useState<StorageStatus[]>([])
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  useEffect(() => {
    const checkStorageStatus = async () => {
      const newStatuses: StorageStatus[] = []

      // 检查COS配置
      const cosSecretId = configs?.find(config => config.config_key === 'cos_secret_id')?.config_value
      const cosSecretKey = configs?.find(config => config.config_key === 'cos_secret_key')?.config_value
      const cosBucket = configs?.find(config => config.config_key === 'cos_bucket')?.config_value
      const cosRegion = configs?.find(config => config.config_key === 'cos_region')?.config_value

      if (!cosSecretId || !cosSecretKey || !cosBucket || !cosRegion) {
        newStatuses.push({
          name: '腾讯云COS',
          status: 'not_configured',
          message: '未配置COS参数'
        })
      } else {
        try {
          const res = await fetch('/api/v1/storage/cos/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              secretId: cosSecretId,
              secretKey: cosSecretKey,
              bucket: cosBucket,
              region: cosRegion,
            }),
          }).then(res => res.json())

          if (res?.code === 200) {
            newStatuses.push({
              name: '腾讯云COS',
              status: 'connected',
              message: '连接成功'
            })
          } else {
            newStatuses.push({
              name: '腾讯云COS',
              status: 'disconnected',
              message: '连接失败'
            })
          }
        } catch (error) {
          newStatuses.push({
            name: '腾讯云COS',
            status: 'disconnected',
            message: '连接失败'
          })
        }
      }

      setStatuses(newStatuses)
    }

    checkStorageStatus()
  }, [configs])

  const getStatusIcon = (status: StorageStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'not_configured':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-2">
      {statuses.map((status) => (
        <div key={status.name} className="flex items-center space-x-2">
          {getStatusIcon(status.status)}
          <span className="text-sm font-medium">{status.name}</span>
          <span className="text-sm text-gray-500">- {status.message}</span>
        </div>
      ))}
    </div>
  )
} 