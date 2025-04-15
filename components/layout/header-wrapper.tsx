// app/layout/header-wrapper.tsx
import { Suspense } from 'react'
import { fetchHeaderData } from '~/server/api/header'
import HeaderSkeleton from '~/components/skeletons/header'

// 服务端组件
export default async function HeaderWrapper() {
    const data = await fetchHeaderData() // 服务端数据获取

    return (
        <Suspense fallback={<HeaderSkeleton />}>
            {/* 客户端组件 */}
            <Header {...data} />
        </Suspense>
    )
}