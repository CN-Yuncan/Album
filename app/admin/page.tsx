import { fetchImagesAnalysis } from '~/server/db/query/images'
import CardList from '~/components/admin/dashboard/card-list'
import type { AnalysisDataProps } from '~/types/props'
import dynamic from 'next/dynamic';

const DynamicCursor = dynamic(
    () => import('@/components/cursor').then((mod) => ({
      default: () => (
          <>
            {mod.DynamicBackground && <mod.DynamicBackground />}
            {mod.MagicCursor && <mod.MagicCursor />}
            {mod.ClickEffects && <mod.ClickEffects />}
          </>
      )
    })),
    {
      ssr: false,
      loading: () => (
          <div className="pointer-events-none">
            <div className="fixed inset-0 bg-background" />
          </div>
      )
    }
);

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
    <div className="flex flex-col mt-4 space-y-2">
      <DynamicCursor />
      <CardList {...props} />
    </div>
  )
}