'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { useButtonStore } from '~/stores/button-stores'
import { Progress } from '~/components/ui/progress'

export function ImportDialog() {
  const { importDialog, importSource, importProgress, importTotal, importCurrent, setImportDialog } = useButtonStore()
  const [selectedFiles, setSelectedFiles] = useState<{ key: string, url: string }[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!importSource || selectedFiles.length === 0) return
    
    setIsImporting(true)
    try {
      const response = await fetch('/api/settings/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: importSource,
          files: selectedFiles
        })
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      setImportDialog(false)
      setSelectedFiles([])
    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={importDialog} onOpenChange={setImportDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量导入图片</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button
              variant={importSource === 'cos' ? 'default' : 'outline'}
              onClick={() => useButtonStore.setState({ importSource: 'cos' })}
            >
              从腾讯云导入
            </Button>
            <Button
              variant={importSource === 'alist' ? 'default' : 'outline'}
              onClick={() => useButtonStore.setState({ importSource: 'alist' })}
            >
              从Alist导入
            </Button>
          </div>
          
          {importSource && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>已选择 {selectedFiles.length} 个文件</span>
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: 实现文件选择逻辑
                  }}
                >
                  选择文件
                </Button>
              </div>
              
              {isImporting && (
                <div className="space-y-2">
                  <Progress value={importProgress} />
                  <div className="text-sm text-muted-foreground">
                    正在导入 {importCurrent}/{importTotal}
                  </div>
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={handleImport}
                disabled={!importSource || selectedFiles.length === 0 || isImporting}
              >
                {isImporting ? '导入中...' : '开始导入'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 