'use client'

import React, { useState } from 'react'
import type { ImageType, AlbumType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'
import { ConfigProvider, Pagination } from 'antd'
import { ArrowDown10, ScanSearch, Replace, PlusSquare, MinusSquare, Star, StarOff } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import ImageEditSheet from '~/components/admin/list/image-edit-sheet'
import ImageView from '~/components/admin/list/image-view'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ListImage from '~/components/admin/list/list-image'
import ImageBatchDeleteSheet from '~/components/admin/list/image-batch-delete-sheet'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Switch } from '~/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { SquarePenIcon } from '~/components/icons/square-pen'
import { DeleteIcon } from '~/components/icons/delete'
import { useTranslations } from 'next-intl'
import { Badge } from '~/components/ui/badge'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [album, setAlbum] = useState('')
  const [imageAlbum, setImageAlbum] = useState('')
  const { data, isLoading, mutate } = useSwrInfiniteServerHook(props, pageNum, album)
  const { data: total, mutate: totalMutate } = useSwrPageTotalServerHook(props, album)
  const [image, setImage] = useState({} as ImageType)
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
  const [updateImageAlbumLoading, setUpdateImageAlbumLoading] = useState(false)
  const [updateShowId, setUpdateShowId] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [batchOperationLoading, setBatchOperationLoading] = useState(false)
  const { setImageEdit, setImageEditData, setImageView, setImageViewData, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const { data: albums, isLoading: albumsLoading } = useSWR('/api/v1/albums/get', fetcher)
  const t = useTranslations()

  const dataProps: ImageListDataProps = {
    data: data,
  }

  async function updateImageShow(id: string, show: number) {
    try {
      setUpdateShowLoading(true)
      setUpdateShowId(id)
      const res = await fetch(`/api/v1/images/update-show`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          show
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setUpdateShowId('')
      setUpdateShowLoading(false)
    }
  }

  async function updateImageAlbum() {
    if (!imageAlbum) {
      toast.error('图片绑定的相册不能为空！')
      return
    }
    try {
      setUpdateImageAlbumLoading(true)
      const res = await fetch(`/api/v1/images/update-Album`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: image.id,
          albumId: imageAlbum
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        setImageAlbum('')
        setImage({} as ImageType)
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setUpdateImageAlbumLoading(false)
    }
  }

  // 处理图片选择
  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => 
      prev.includes(id) ? prev.filter(imgId => imgId !== id) : [...prev, id]
    )
  }

  // 全选图片
  const selectAllImages = () => {
    if (!data || !Array.isArray(data)) return
    setSelectedImages(data.map((img: ImageType) => img.id))
  }

  // 反选图片
  const invertSelection = () => {
    if (!data || !Array.isArray(data)) return
    const allIds = data.map((img: ImageType) => img.id)
    setSelectedImages(prev => 
      allIds.filter(id => !prev.includes(id))
    )
  }

  // 清除选择
  const clearSelection = () => {
    setSelectedImages([])
  }

  // 批量设置首页显示
  const batchUpdateMainpage = async (showOnMainpage: number) => {
    if (selectedImages.length === 0) {
      toast.warning('请先选择图片')
      return
    }

    try {
      setBatchOperationLoading(true)
      const res = await fetch('/api/v1/images/batch-update-mainpage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds: selectedImages,
          showOnMainpage
        }),
      })

      if (res.status === 200) {
        toast.success('批量更新成功！')
        await mutate()
        clearSelection()
      } else {
        toast.error('批量更新失败！')
      }
    } catch (e) {
      toast.error('批量更新失败！')
    } finally {
      setBatchOperationLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div className="flex items-center w-full sm:w-64 md:w-80 relative z-[999]">
          <Select
            disabled={albumsLoading}
            onValueChange={async (value: string) => {
              setAlbum(value)
              await totalMutate()
              await mutate()
            }}
          >
            <SelectTrigger className="cursor-pointer relative z-[999]">
              <SelectValue placeholder={t('List.selectAlbum')} />
            </SelectTrigger>
            <SelectContent className="z-[999]">
              <SelectGroup>
                <SelectLabel>{t('Words.album')}</SelectLabel>
                <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                {albums?.map((album: AlbumType) => (
                  <SelectItem className="cursor-pointer" key={album.album_value} value={album.album_value}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-1 relative z-[999]">
          <Button
            variant="outline"
            size="icon"
            aria-label={t('Button.batchDelete')}
            onClick={() => setImageBatchDelete(true)}
            className="relative z-[999]"
          >
            <DeleteIcon />
          </Button>
          <Button
            className="cursor-pointer relative z-[999]"
            variant="outline"
            disabled={isLoading}
            onClick={async () => {
              await totalMutate()
              await mutate()
            }}
            aria-label={t('Button.refresh')}
          >
            {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin relative z-[999]" />}
            {t('Button.refresh')}
          </Button>
        </div>
      </div>

      {/* 批量操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between space-y-1 sm:space-y-0 space-x-0 sm:space-x-1 p-2 border rounded-md bg-gray-50 relative z-30">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium">批量操作:</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectAllImages}
            className="gap-1"
          >
            <PlusSquare size={16} />
            全选
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={invertSelection}
            className="gap-1"
          >
            <MinusSquare size={16} />
            反选
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearSelection}
            className="gap-1"
          >
            清除选择
          </Button>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium">已选: {selectedImages.length} 张</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => batchUpdateMainpage(0)}
            disabled={batchOperationLoading || selectedImages.length === 0}
            className="gap-1"
          >
            {batchOperationLoading && <ReloadIcon className="h-3 w-3 animate-spin" />}
            <Star size={16} />
            设为首页
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => batchUpdateMainpage(1)}
            disabled={batchOperationLoading || selectedImages.length === 0}
            className="gap-1"
          >
            {batchOperationLoading && <ReloadIcon className="h-3 w-3 animate-spin" />}
            <StarOff size={16} />
            取消首页
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.isArray(data) && data?.map((image: ImageType) => (
          <Card key={image.id} className={`flex flex-col h-72 show-up-motion items-center gap-0 py-0 ${selectedImages.includes(image.id) ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex h-12 justify-between w-full p-2 space-x-2 relative z-[999]">
              <div className="flex gap-2 items-center">
                <Checkbox 
                  id={`select-${image.id}`}
                  checked={selectedImages.includes(image.id)}
                  onCheckedChange={() => toggleImageSelection(image.id)}
                  className="relative z-[999]"
                />
                <Badge variant="secondary" aria-label={t('Words.album')} className="relative z-[999]">{image.album_name}</Badge>
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer relative z-[999]"
                  onClick={() => {
                    setImageViewData(image)
                    setImageView(true)
                  }}
                  aria-label={t('List.viewImage')}
                >
                  <ScanSearch size={20} />
                </Button>
              </div>
            </div>
            <CardContent className="flex h-48 items-center justify-center w-full p-2 scrollbar-hide relative z-10">
              <ListImage image={image} />
            </CardContent>
            <CardFooter
              className="flex h-12 p-2 mb-1 space-x-1 select-none rounded-md before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-[999]">
              <div className="flex flex-1 space-x-1 items-center">
                {
                  updateShowLoading && updateShowId === image.id ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin relative z-[999]"/> :
                  <Switch
                    checked={image.show === 0}
                    disabled={updateShowLoading}
                    className="cursor-pointer relative z-[999]"
                    onCheckedChange={(isSelected: boolean) => updateImageShow(image.id, isSelected ? 0 : 1)}
                  />
                }
                <Badge variant={image.show_on_mainpage === 0 ? "secondary" : "outline"} aria-label="首页显示" className="relative z-[999]">
                  {image.show_on_mainpage === 0 ? <Star size={16} /> : <StarOff size={16} />}
                </Badge>
                <Badge variant="secondary" aria-label={t('Words.sort')} className="relative z-[999]"><ArrowDown10 size={18}/>{image.sort}</Badge>
              </div>
              <div className="space-x-1 relative z-[999]">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer relative z-[999]"
                      onClick={() => {
                        setImage(image)
                        setImageAlbum(image.album_value)
                      }}
                      aria-label={t('List.bindAlbum')}
                    >
                      <Replace size={20} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="z-[999]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('List.bindAlbum')}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <Select
                      defaultValue={imageAlbum}
                      disabled={isLoading}
                      onValueChange={async (value: string) => {
                        setImageAlbum(value)
                        await totalMutate()
                        await mutate()
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder={t('List.selectAlbum')} />
                      </SelectTrigger>
                      <SelectContent className="z-[300]">
                        <SelectGroup>
                          <SelectLabel>{t('Words.album')}</SelectLabel>
                          {albums?.map((album: AlbumType) => (
                            <SelectItem className="cursor-pointer" key={album.album_value} value={album.id}>
                              {album.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">{t('Button.cancel')}</AlertDialogCancel>
                      <AlertDialogAction className="cursor-pointer" onClick={updateImageAlbum} disabled={updateImageAlbumLoading}>{t('Button.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer relative z-40"
                  aria-label={t('Words.edit')}
                  onClick={() => {
                    setImageEditData(image)
                    setImageEdit(true)
                  }}
                >
                  <SquarePenIcon size={20} />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="flex flex-col space-y-2">
        <ConfigProvider
          theme={{
            components: {
              Pagination: {
                colorPrimary: '#000000',
                colorPrimaryHover: '#7a7a7a',
                colorPrimaryBorder: '#7a7a7a',
                colorPrimaryText: '#ffffff',
              },
            },
          }}
        >
          <Pagination
            className="flex self-center cursor-pointer"
            disabled={isLoading}
            defaultCurrent={1}
            current={pageNum}
            onChange={(page) => {
              setPageNum(page)
            }}
            total={total}
            showSizeChanger={false}
          />
        </ConfigProvider>
      </div>
      <ImageEditSheet pageNum={pageNum} album={album} {...props} />
      <ImageView />
      <ImageBatchDeleteSheet pageNum={pageNum} album={album} dataProps={dataProps} {...props} />
    </div>
  )
}