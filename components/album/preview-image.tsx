'use client'

import type { HandleProps, ImageDataProps, PreviewImageHandleProps } from '~/types/props'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import dayjs from 'dayjs'
import * as React from 'react'
import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next-nprogress-bar'
import { ClockIcon } from '~/components/icons/clock'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { TimerIcon } from '~/components/icons/timer'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { Badge } from '~/components/ui/badge'
import { LanguagesIcon } from '~/components/icons/languages'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { cn } from '~/lib/utils'
import PreviewImageExif from '~/components/album/preview-image-exif'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import gsap from 'gsap'

const buttonIconClass = "w-10 h-10 rounded-full bg-gray-800/60 text-white flex items-center justify-center cursor-pointer hover:bg-gray-700/70 backdrop-blur-sm transition-all duration-200 hover:scale-110";
const activeButtonClass = "bg-gray-700/90 ring-2 ring-white/40";

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentImageIndex, setCurrentImageIndex] = useState(-1)
  const [imageIds, setImageIds] = useState<string[]>([])
  const [isLoadingNav, setIsLoadingNav] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  
  // 使用CSS强制隐藏导航栏
  useEffect(() => {
    // 创建一个样式元素，使用更精确的ID和类选择器
    const style = document.createElement('style')
    style.innerHTML = `
      /* 精确隐藏导航栏 */
      div[class*="flex items-center w-full p-2 sm:w-[70%] mx-auto sticky top-0"], 
      .flex.items-center.w-full.p-2,
      nav, header, footer, 
      .border-t.border-border,
      #masonry-footer,
      .footer-nav,
      [class*="rounded-2xl bg-[hsl(0_0%_100%/0.8)]"],
      [class*="before:bg-[radial-gradient"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: fixed !important;
        left: -9999px !important;
        top: -9999px !important;
        z-index: -9999 !important;
        pointer-events: none !important;
      }
      
      /* 修复底部白边 */
      body, html {
        overflow: hidden !important;
        background: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* 去除所有可能的白边 */
      body::after, body::before, 
      div::after, div::before {
        display: none !important;
      }
      
      /* 强制设置预览容器样式 */
      .flex.flex-col.overflow-hidden.h-full {
        position: fixed !important;
        inset: 0 !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        background-color: rgba(0,0,0,0.95) !important;
      }
    `
    document.head.appendChild(style)
    
    // 组件卸载时移除样式
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  // 初始化和更新图片列表，修复上一页/下一页按钮灰色问题
  useEffect(() => {
    // 立即执行一次获取图片列表
    fetchImageIds()
    
    // 强制延迟200ms后再次尝试获取，确保DOM完全加载
    const timer = setTimeout(() => {
      fetchImageIds()
    }, 200)
    
    return () => clearTimeout(timer)
  }, [props.id, props.data?.id])
  
  // 获取所有公开图片ID和当前图片索引
  useEffect(() => {
    const fetchAllImageIds = async () => {
      try {
        const response = await fetch('/api/open/get-all-image-ids')
        const data = await response.json()
        
        if (data.success && Array.isArray(data.ids) && data.ids.length > 0) {
          setImageIds(data.ids)
          // 找到当前图片索引
          const currentIndex = data.ids.findIndex((id: string) => id === props.id)
          setCurrentImageIndex(currentIndex !== -1 ? currentIndex : 0)
        }
      } catch (error) {
        console.error('获取图片列表失败:', error)
      }
    }
    
    fetchAllImageIds()
  }, [props.id])
  
  // 图片缩放和拖动相关功能
  useEffect(() => {
    if (!imageContainerRef.current) return
    
    const container = imageContainerRef.current
    
    const handleWheel = (e: WheelEvent) => {
      if (!dragMode) return
      
      e.preventDefault()
      const delta = e.deltaY * -0.01
      const newScale = Math.min(Math.max(scale + delta, 0.5), 5)
      
      setScale(newScale)
    }
    
    const handleMouseDown = (e: MouseEvent) => {
      if (!dragMode) return
      
      setIsDragging(true)
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragMode) return
      
      const newX = e.clientX - startPos.x
      const newY = e.clientY - startPos.y
      
      setPosition({ x: newX, y: newY })
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    const handleTouchStart = (e: TouchEvent) => {
      if (!dragMode) return
      
      setIsDragging(true)
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      })
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragMode) return
      
      const newX = e.touches[0].clientX - startPos.x
      const newY = e.touches[0].clientY - startPos.y
      
      setPosition({ x: newX, y: newY })
    }
    
    const handleTouchEnd = () => {
      setIsDragging(false)
    }
    
    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragMode, isDragging, position, scale, startPos])
  
  // 重置图片位置和缩放
  const resetImageTransform = () => {
    gsap.to(imageRef.current, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    })
  }
  
  // 切换拖动模式
  const toggleDragMode = () => {
    // 按钮动画
    const button = document.querySelector('.drag-btn svg')
    if (button) {
      gsap.to(button, {
        rotation: dragMode ? 0 : 45,
        duration: 0.4,
        ease: 'back.out'
      })
    }
    
    if (dragMode) {
      resetImageTransform()
    }
    setDragMode(!dragMode)
  }
  
  // 获取图片ID列表，支持排序控制
  const fetchImageIds = async () => {
    // 从本地存储获取当前的浏览顺序设置
    const order = localStorage.getItem('galleryOrder') || 'timeDesc'
    
    try {
      const response = await fetch(`/api/open/get-all-image-ids?order=${order}`)
      const data = await response.json()
      
      if (data.success && Array.isArray(data.ids) && data.ids.length > 0) {
        setImageIds(data.ids)
        
        // 处理props.id和props.data?.id，确保能找到当前图片
        const currentId = props.id || props.data?.id || ''
        // 尝试匹配完整ID或转换为字符串后匹配
        let index = data.ids.findIndex((id: string) => id === currentId)
        if (index === -1) {
          index = data.ids.findIndex((id: string) => id === String(currentId))
        }
        
        // 如果找到了索引，直接设置当前索引
        if (index !== -1) {
          setCurrentImageIndex(index)
          setIsLoadingNav(false) // 立即解除加载状态
          console.log(`当前图片索引: ${index}, 总图片数: ${data.ids.length}`)
        } else {
          // 如果没找到，尝试使用第一个ID
          console.warn('无法在图片列表中找到当前图片ID，将使用第一张图片')
          setCurrentImageIndex(0)
        }
      } else {
        console.error('获取图片列表失败或列表为空')
      }
    } catch (error) {
      console.error('获取图片列表失败:', error)
    }
  }
  
  // 前往上一张图片
  const goToPrevImage = () => {
    if (isLoadingNav || currentImageIndex <= 0) return
    
    // 按钮动画
    const button = document.querySelector('.prev-btn svg')
    if (button) {
      gsap.timeline()
        .to(button, {
          x: -10,
          opacity: 0.5,
          duration: 0.2,
          ease: 'power2.in'
        })
        .to(button, {
          x: 0,
          opacity: 1,
          duration: 0.2,
          ease: 'power2.out'
        })
    }
    
    setIsLoadingNav(true)
    const prevIndex = currentImageIndex - 1
    const prevId = imageIds[prevIndex]
    router.push(`/preview/${prevId}`)
  }
  
  // 前往下一张图片
  const goToNextImage = () => {
    if (isLoadingNav || currentImageIndex === -1 || currentImageIndex >= imageIds.length - 1) return
    
    // 按钮动画
    const button = document.querySelector('.next-btn svg')
    if (button) {
      gsap.timeline()
        .to(button, {
          x: 10,
          opacity: 0.5,
          duration: 0.2,
          ease: 'power2.in'
        })
        .to(button, {
          x: 0,
          opacity: 1,
          duration: 0.2,
          ease: 'power2.out'
        })
    }
    
    setIsLoadingNav(true)
    const nextIndex = currentImageIndex + 1
    const nextId = imageIds[nextIndex]
    router.push(`/preview/${nextId}`)
  }
  
  // 返回按钮
  const goBack = () => {
    // 按钮动画
    const button = document.querySelector('.back-btn svg')
    if (button) {
      gsap.to(button, {
        x: -5,
        duration: 0.2,
        ease: 'power2.in',
        yoyo: true,
        repeat: 1
      })
    }
    
    router.back()
  }
  
  // 放大按钮
  const zoomIn = () => {
    // 按钮动画
    const button = document.querySelector('.zoom-in-btn svg')
    if (button) {
      gsap.to(button, {
        scale: 1.2,
        duration: 0.2,
        ease: 'power2.in',
        yoyo: true,
        repeat: 1
      })
    }
    
    if (!dragMode) {
      setDragMode(true)
    }
    const newScale = Math.min(scale + 0.25, 5)
    setScale(newScale)
  }
  
  // 缩小按钮
  const zoomOut = () => {
    // 按钮动画
    const button = document.querySelector('.zoom-out-btn svg')
    if (button) {
      gsap.to(button, {
        scale: 0.8,
        duration: 0.2,
        ease: 'power2.in',
        yoyo: true,
        repeat: 1
      })
    }
    
    if (!dragMode) {
      setDragMode(true)
    }
    const newScale = Math.max(scale - 0.25, 0.5)
    setScale(newScale)
    
    if (newScale === 0.5) {
      setPosition({ x: 0, y: 0 })
    }
  }
  
  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', props.data?.url ?? ''], null)

  const exifIconClass = 'dark:text-gray-50 text-gray-500'
  const exifTextClass = 'text-tiny text-sm select-none items-center dark:text-gray-50 text-gray-500'

  const exifProps: ImageDataProps = {
    data: props.data,
  }
  
  // 添加估算的EXIF信息
  const estimatedExif = React.useMemo(() => {
    const result = { ...props.data?.exif || {} }
    
    // 估算缺失的光圈值
    if (!result.f_number) {
      result.f_number = 'f/2.8 (估算值)'
    }
    
    // 估算缺失的快门速度
    if (!result.exposure_time) {
      result.exposure_time = '1/60s (估算值)'
    }
    
    // 估算缺失的焦距
    if (!result.focal_length) {
      // 根据图片宽高比估算焦距
      const aspectRatio = props.data?.width / props.data?.height
      let estimatedFocalLength = '35mm'
      
      if (aspectRatio > 1.7) {
        estimatedFocalLength = '24mm' // 广角
      } else if (aspectRatio < 0.8) {
        estimatedFocalLength = '85mm' // 人像
      }
      
      result.focal_length = `${estimatedFocalLength} (估算值)`
    }
    
    // 估算缺失的ISO值
    if (!result.iso_speed_rating) {
      result.iso_speed_rating = 'ISO 400 (估算值)'
    }
    
    return result
  }, [props.data])

  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)

  async function downloadImg() {
    // 按钮动画
    const button = document.querySelector('.download-btn svg')
    if (button) {
      gsap.to(button, {
        y: 3,
        duration: 0.2,
        ease: 'power2.in',
        yoyo: true,
        repeat: 1
      })
    }
    
    setDownload(true)
    try {
      let msg = '开始下载，原图较大，请耐心等待！'
      if (props.data.album_license != null) {
        msg += '图片版权归作者所有, 分享转载需遵循 ' + props.data.album_license + ' 许可协议！'
      }

      toast.warning(msg, { duration: 1500 })
      await fetch(`/api/open/get-image-blob?imageUrl=${props.data.url}`)
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement("a");
          link.href = url;
          const parsedUrl = new URL(props.data.url);
          const filename = parsedUrl.pathname.split('/').pop();
          link.download = filename || "downloaded-file";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
    } catch (e) {
      toast.error('下载失败！', { duration: 500 })
    } finally {
      setDownload(false)
    }
  }

  // 返回主页
  const goToHome = () => {
    // 按钮动画
    const button = document.querySelector('.home-btn svg')
    if (button) {
      gsap.to(button, {
        rotation: 360,
        duration: 0.5,
        ease: 'power2.in'
      })
    }
    
    router.push('/')
  }

  return (
    <div className="flex flex-col overflow-hidden h-full !rounded-none max-w-none gap-0 p-0 bg-black/90">
      {/* 图片区域 */}
      <div 
        ref={imageContainerRef}
        className="h-full flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ cursor: dragMode ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {props.data.type === 1 ? (
          <img
            ref={imageRef}
            src={props.data.preview_url || props.data.url}
            alt={props.data.detail}
            className={cn(
              "max-h-[90vh] max-w-[95vw] object-contain select-none transition-opacity duration-300 opacity-100",
              isDragging && "opacity-90"
            )}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s',
              transformOrigin: 'center'
            }}
            onDoubleClick={toggleDragMode}
            onLoad={() => setIsLoadingNav(false)}
          />
        ) : (
          <LivePhoto
            url={props.data.preview_url || props.data.url}
            videoUrl={props.data.video_url}
            className="md:h-[90vh] md:max-h-[90vh]"
          />
        )}
        
        {/* 标题栏 - 增加返回首页按钮，特别针对移动设备 */}
        <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
          {/* 移动端返回首页按钮 - 左侧 */}
          <div 
            className={cn(
              "w-10 h-10 sm:hidden rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all hover:bg-gray-700/70"
            )}
            onClick={goToHome}
          >
            <svg className="w-5 h-5 text-white home-mobile-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          
          {/* 标题 - 中间 */}
          <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white font-medium">
            {props.data?.title}
          </div>
          
          {/* 移动端返回按钮 - 右侧 */}
          <div 
            className={cn(
              "w-10 h-10 sm:hidden rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all hover:bg-gray-700/70"
            )}
            onClick={goBack}
          >
            <svg className="w-5 h-5 text-white back-mobile-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
        </div>
        
        {/* 上一张/下一张控制按钮 */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <div 
            className={cn(
              "pointer-events-auto w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm transition-all",
              currentImageIndex <= 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-700/70 hover:scale-110"
            )}
            onClick={goToPrevImage}
          >
            <svg className="w-6 h-6 text-white prev-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          
          <div 
            className={cn(
              "pointer-events-auto w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm transition-all",
              currentImageIndex === -1 || currentImageIndex >= imageIds.length - 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-700/70 hover:scale-110"
            )}
            onClick={goToNextImage}
          >
            <svg className="w-6 h-6 text-white next-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
        
        {/* 功能按钮组 - 保留现有按钮但在移动端隐藏首页和返回 */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 px-4 py-3 rounded-full bg-black/40 backdrop-blur-md">
          {/* 回到主页按钮 - 桌面显示，移动隐藏 */}
          <div className={cn(buttonIconClass, "home-btn hidden sm:flex")} onClick={goToHome} title="回到主页">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          
          {/* 返回按钮 - 桌面显示，移动隐藏 */}
          <div className={cn(buttonIconClass, "back-btn hidden sm:flex")} onClick={goBack} title="返回">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          
          {/* 拖动模式切换按钮 */}
          <div 
            className={cn(buttonIconClass, dragMode && activeButtonClass, "drag-btn")} 
            onClick={toggleDragMode}
            title="拖动模式"
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8M11 21H3v-8M14 10l7-7M16 3h5v5"></path>
            </svg>
          </div>
          
          {/* 放大按钮 */}
          <div 
            className={cn(buttonIconClass, "zoom-in-btn")} 
            onClick={zoomIn}
            title="放大"
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          
          {/* 缩小按钮 */}
          <div 
            className={cn(buttonIconClass, "zoom-out-btn")} 
            onClick={zoomOut}
            title="缩小"
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          
          {/* 下载按钮 */}
          {configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true' && (
            <>
              {download ? (
                <div className={cn(buttonIconClass, "cursor-wait")}>
                  <RefreshCWIcon className="animate-spin" size={20} />
                </div>
              ) : (
                <div className={cn(buttonIconClass, "download-btn")} onClick={downloadImg} title="下载">
                  <DownloadIcon size={20} />
                </div>
              )}
            </>
          )}
        </div>
        
        {/* 浏览顺序控制 - 完整选项 */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
          <h3 className="text-white text-xs font-medium mb-1">浏览顺序</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className={cn(
                "px-2 py-1 text-xs rounded text-white transition-colors", 
                localStorage.getItem('galleryOrder') === 'timeDesc' 
                  ? "bg-white/40 hover:bg-white/50" 
                  : "bg-white/20 hover:bg-white/30"
              )}
              onClick={() => {
                localStorage.setItem('galleryOrder', 'timeDesc')
                toast.success('已设置为时间倒序浏览模式')
                fetchImageIds() // 立即刷新列表
              }}
              title="按时间倒序浏览（新→旧）"
            >
              时间↓
            </button>
            <button 
              className={cn(
                "px-2 py-1 text-xs rounded text-white transition-colors", 
                localStorage.getItem('galleryOrder') === 'timeAsc' 
                  ? "bg-white/40 hover:bg-white/50" 
                  : "bg-white/20 hover:bg-white/30"
              )}
              onClick={() => {
                localStorage.setItem('galleryOrder', 'timeAsc')
                toast.success('已设置为时间正序浏览模式')
                fetchImageIds() // 立即刷新列表
              }}
              title="按时间正序浏览（旧→新）"
            >
              时间↑
            </button>
            <button 
              className={cn(
                "px-2 py-1 text-xs rounded text-white transition-colors", 
                localStorage.getItem('galleryOrder') === 'nameAsc' 
                  ? "bg-white/40 hover:bg-white/50" 
                  : "bg-white/20 hover:bg-white/30"
              )}
              onClick={() => {
                localStorage.setItem('galleryOrder', 'nameAsc')
                toast.success('已设置为名称正序浏览模式')
                fetchImageIds() // 立即刷新列表
              }}
              title="按名称正序浏览（A→Z）"
            >
              名称↑
            </button>
            <button 
              className={cn(
                "px-2 py-1 text-xs rounded text-white transition-colors", 
                localStorage.getItem('galleryOrder') === 'nameDesc' 
                  ? "bg-white/40 hover:bg-white/50" 
                  : "bg-white/20 hover:bg-white/30"
              )}
              onClick={() => {
                localStorage.setItem('galleryOrder', 'nameDesc')
                toast.success('已设置为名称倒序浏览模式')
                fetchImageIds() // 立即刷新列表
              }}
              title="按名称倒序浏览（Z→A）"
            >
              名称↓
            </button>
          </div>
        </div>
      </div>
      
      {/* 图片信息区域 - 右下角 */}
      <div className="absolute bottom-0 right-0 max-w-sm bg-black/60 backdrop-blur-md text-white p-4 rounded-tl-lg border-t border-l border-white/10">
        <div className="flex flex-col gap-2">
          {/* EXIF信息 */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {props.data?.exif?.make && props.data?.exif?.model && (
              <div className="flex items-center gap-1.5">
                <CameraIcon className="text-gray-400" size={16} />
                <span className="text-gray-300">{`${props.data?.exif?.make} ${props.data?.exif?.model}`}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5">
              <ApertureIcon className="text-gray-400" size={16} />
              <span className="text-gray-300">{estimatedExif.f_number}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <TimerIcon className="text-gray-400" size={16} />
              <span className="text-gray-300">{estimatedExif.exposure_time}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <CrosshairIcon className="text-gray-400" size={16} />
              <span className="text-gray-300">{estimatedExif.focal_length}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <GaugeIcon className="text-gray-400" size={16} />
              <span className="text-gray-300">{estimatedExif.iso_speed_rating}</span>
            </div>
            
            {props.data?.exif?.data_time && (
              <div className="flex items-center gap-1.5">
                <ClockIcon className="text-gray-400" size={16} />
                <span className="text-gray-300">
                  {dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid() 
                    ? dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
                    : props.data?.exif.data_time
                  }
                </span>
              </div>
            )}
          </div>
          
          {/* 描述信息 */}
          {props.data?.detail && (
            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{props.data?.detail}</p>
          )}
          
          {/* 标签 */}
          {props.data?.labels && props.data?.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {props.data?.labels.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer bg-white/20 hover:bg-white/30 text-xs"
                  onClick={() => {
                    router.push(`/tag/${tag}`)
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}