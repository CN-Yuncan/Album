'use client'

import type { HandleProps, ImageHandleProps } from '~/types/props'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import React, { useEffect, useRef, useCallback } from 'react'
import GalleryImage from '~/components/album/gallery-image'

export default function Gallery(props : Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)
  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
      return [`client-${props.args}-${index}-${props.album}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)
  const dataList = data ? [].concat(...data) : [];
  const processedDataList = props.randomShow ? [...dataList].sort(() => Math.random() - 0.5) : dataList;
  const t = useTranslations()
  const loaderRef = useRef<HTMLDivElement>(null)
  
  // 当用户滚动到底部附近时，自动加载更多内容
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    // 当加载指示器可见、不在加载中、还有更多内容可加载时，加载更多
    if (entry.isIntersecting && !isLoading && !isValidating && size < pageTotal) {
      setSize(size + 1);
    }
  }, [isLoading, isValidating, setSize, size, pageTotal]);
  
  // 设置IntersectionObserver来监视加载指示器元素
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null, // 使用视口作为根
      rootMargin: '200px', // 当元素接近视口底部200px时触发
      threshold: 0.1, // 当10%的元素可见时触发
    });
    
    const currentRef = loaderRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleObserver]);

  return (
    <div className="w-full p-2 space-y-4">
      {processedDataList?.map((item: ImageType) => (
        <GalleryImage key={item.id} photo={item} configData={configData} />
      ))}
      <div ref={loaderRef} className="flex items-center justify-center my-4 py-4">
        {isValidating && <ReloadIcon className="h-6 w-6 animate-spin" />}
        {!isValidating && size >= pageTotal && processedDataList.length > 0 && 
          <div className="text-sm text-gray-500">已加载全部内容</div>
        }
        {!isValidating && processedDataList.length === 0 && 
          <div className="text-sm text-gray-500">{t('Tips.noImg')}</div>
        }
      </div>
    </div>
  )
}
