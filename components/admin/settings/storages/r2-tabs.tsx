'use client'

import { Card } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Button } from '~/components/ui/button'
import { ReloadIcon, CircleIcon } from '@radix-ui/react-icons'
import React, { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import R2EditSheet from '~/components/admin/settings/storages/r2-edit-sheet'
import { Badge } from '~/components/ui/badge'

export default function R2Tabs() {
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unconfigured' | null>(null)
  
  const { data, error, isValidating, mutate } = useSWR('/api/v1/storage/r2/info', fetcher
    , { revalidateOnFocus: false })
  const { setR2Edit, setR2EditData } = useButtonStore(
    (state) => state,
  )

  if (error) {
    toast.error('请求失败！')
  }
  
  const isConfigured = () => {
    if (!data || !Array.isArray(data)) return false
    
    const requiredKeys = ['account_id', 'access_key_id', 'secret_access_key', 'bucket', 'public_url']
    return requiredKeys.every(key => 
      data.some(item => item.config_key === key && item.config_value)
    )
  }
  
  const testConnection = async () => {
    if (!isConfigured()) {
      toast.error('请先完成R2存储配置')
      setConnectionStatus('unconfigured')
      return
    }
    
    setConnectionLoading(true)
    setConnectionStatus(null)
    
    try {
      const res = await fetch('/api/v1/storage/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: 'r2' })
      }).then(res => res.json())
      
      if (res?.code === 200) {
        toast.success('R2连接成功')
        setConnectionStatus('connected')
      } else {
        toast.error(res?.message || 'R2连接失败')
        setConnectionStatus('disconnected')
      }
    } catch (e) {
      console.error('测试连接失败', e)
      toast.error('R2连接失败')
      setConnectionStatus('disconnected')
    } finally {
      setConnectionLoading(false)
    }
  }
  
  const getStatusBadge = () => {
    if (connectionStatus === 'connected') {
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">已连接</Badge>
    } else if (connectionStatus === 'disconnected') {
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">连接失败</Badge>
    } else if (connectionStatus === 'unconfigured') {
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">未配置</Badge>
    }
    return null
  }

  return (
    <div className="space-y-2">
      <Card className="py-0">
        <div className="flex justify-between p-2">
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-1 items-start justify-center">
              <div className="flex items-center space-x-2">
                <h4 className="text-small font-semibold leading-none text-default-600">R2 配置</h4>
                {connectionStatus === 'connected' && <CircleIcon className="h-4 w-4 text-green-500 fill-green-500" />}
                {connectionStatus === 'disconnected' && <CircleIcon className="h-4 w-4 text-red-500 fill-red-500" />}
                {connectionStatus === 'unconfigured' && <CircleIcon className="h-4 w-4 text-gray-400 fill-gray-400" />}
                {getStatusBadge()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={connectionLoading}
              onClick={testConnection}
              aria-label="测试连接"
            >
              {connectionLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              测试连接
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={isValidating}
              onClick={() => mutate()}
              aria-label="刷新"
            >
              {isValidating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              刷新
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setR2Edit(true)
                setR2EditData(JSON.parse(JSON.stringify(data)))
              }}
              aria-label="编辑"
            >
              编辑
            </Button>
          </div>
        </div>
      </Card>
      {
        data &&
        <Card className="p-2">
          <Table aria-label="R2 设置">
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.config_key}</TableCell>
                  <TableCell className="truncate max-w-48">{item.config_value || 'N&A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      }
      {Array.isArray(data) && data.length > 0 && <R2EditSheet />}
    </div>
  )
}