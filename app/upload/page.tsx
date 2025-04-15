'use client'

import { Upload } from '~/components/upload/Upload'
import { ImportDialog } from '~/components/upload/ImportDialog'
import { Button } from '~/components/ui/button'
import { createButtonStore } from '~/stores/button-stores'

const useButtonStore = createButtonStore()

export default function UploadPage() {
  const { setImportDialog } = useButtonStore()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">上传图片</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => setImportDialog(true)}
          >
            批量导入
          </Button>
          <Upload />
        </div>
      </div>
      <ImportDialog />
    </div>
  )
} 