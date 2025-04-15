import { fetchImagesAnalysis } from '~/server/db/query/images'
import CardList from '~/components/admin/dashboard/card-list'
import type { AnalysisDataProps } from '~/types/props'
import StorageStatus from '~/components/admin/storage/storage-status'

export default async function Admin() {
  const getData = async (): Promise<AnalysisDataProps> => {
    'use server'
    // @ts-ignore
    return await fetchImagesAnalysis()
  }

  const data = await getData()

  const props: AnalysisDataProps = {
    data: data,
  }

  return (
    <div className="container mx-auto py-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">存储状态</h2>
        <StorageStatus />
      </div>
      <div className="flex flex-col mt-4 space-y-2">
        <CardList {...props} />
      </div>
    </div>
  )
}