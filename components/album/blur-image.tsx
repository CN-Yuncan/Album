'use client'

import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { useRouter } from 'next-nprogress-bar'
import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'

export default function BlurImage({ photo, dataList }: { photo: any, dataList: any }) {
  const router = useRouter()
  const imgRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const element = imgRef.current
    if (!element) return

    // 移动设备检测
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // 创建主动画控制器
    const animation = gsap.timeline({ paused: true })
      .to(element, {
        scale: 1.03,
        boxShadow: '0 22px 35px rgba(0, 0, 0, 0.20)',
        filter: 'contrast(1.05) brightness(1.05)',
        transform: 'translateZ(50px)',
        duration: 0.4,
        ease: 'expo.out'
      })
    
    // 创建持续浮动动画
    const floatAnimation = gsap.timeline({ 
      paused: true,
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.1
    }).to(element, {
      y: '-=8',
      duration: 1.2,
      ease: 'sine.inOut'
    })
    
    // 光效动画
    const glowElement = document.createElement('div')
    glowElement.className = 'absolute inset-0 opacity-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-md z-10 pointer-events-none'
    gsap.set(glowElement, { opacity: 0 })
    element.appendChild(glowElement)
    
    const glowAnimation = gsap.timeline({ 
      paused: true,
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.3
    }).to(glowElement, {
      opacity: 0.8,
      duration: 1.5,
      ease: 'sine.inOut'
    })
    
    // 闪光效果
    const flashElement = document.createElement('div')
    flashElement.className = 'absolute inset-0 opacity-0 bg-white/40 rounded-md z-20 pointer-events-none'
    element.appendChild(flashElement)
    
    // 鼠标位置跟踪变量
    let mouseX = 0
    let mouseY = 0
    let lastMouseX = 0
    let lastMouseY = 0
    let velocityX = 0
    let velocityY = 0
    let rafId: number | null = null
    
    function updatePosition() {
      if (!isHovered || isMobile) return
      
      // 计算鼠标速度
      velocityX = (mouseX - lastMouseX) * 0.05
      velocityY = (mouseY - lastMouseY) * 0.05
      
      // 限制速度范围
      velocityX = Math.min(Math.max(velocityX, -5), 5)
      velocityY = Math.min(Math.max(velocityY, -5), 5)
      
      // 保存上一帧鼠标位置
      lastMouseX = mouseX
      lastMouseY = mouseY
      
      // 应用倾斜和光效
      gsap.to(element, {
        rotationY: velocityX * 1.5,
        rotationX: -velocityY * 1.5,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: true
      })
      
      gsap.to(glowElement, {
        backgroundPosition: `${50 + velocityX * 10}% ${50 + velocityY * 10}%`,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: true
      })
      
      rafId = requestAnimationFrame(updatePosition)
    }
    
    // 闪光动画函数
    function playFlashAnimation() {
      // 重置闪光元素状态
      gsap.set(flashElement, { opacity: 0 })
      
      // 创建闪光动画
      gsap.timeline()
        .to(flashElement, {
          opacity: 0.8,
          duration: 0.2,
          ease: 'power1.in'
        })
        .to(flashElement, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out'
        })
    }
    
    // 鼠标进入事件
    const handleMouseEnter = () => {
      setIsHovered(true)
      animation.play()
      floatAnimation.play()
      glowAnimation.play()
      // 触发闪光效果
      playFlashAnimation()
      rafId = requestAnimationFrame(updatePosition)
    }
    
    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return
      
      const rect = element.getBoundingClientRect()
      // 计算鼠标在元素内的相对位置 (0,0)为中心点
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2 
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    
    // 鼠标离开事件
    const handleMouseLeave = () => {
      setIsHovered(false)
      
      // 停止持续动画
      floatAnimation.pause(0)
      glowAnimation.pause(0)
      
      // 恢复原始状态
      gsap.to(element, {
        scale: 1,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        filter: 'contrast(1) brightness(1)',
        rotationY: 0,
        rotationX: 0,
        transform: 'translateZ(0px)',
        y: 0,
        duration: 0.5,
        ease: 'power3.out'
      })
      
      // 隐藏光效
      gsap.to(glowElement, {
        opacity: 0,
        duration: 0.3,
        ease: 'power1.in'
      })
      
      // 取消动画帧
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
    
    // 添加事件监听
    element.addEventListener('mouseenter', handleMouseEnter, { passive: true })
    element.addEventListener('mousemove', handleMouseMove, { passive: true })
    element.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    
    // 清理函数
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
      
      // 移除创建的DOM元素
      if (element.contains(glowElement)) {
        element.removeChild(glowElement)
      }
      if (element.contains(flashElement)) {
        element.removeChild(flashElement)
      }
      
      // 清理动画
      animation.kill()
      floatAnimation.kill()
      glowAnimation.kill()
    }
  }, [])

  return (
    <div 
      ref={imgRef} 
      className={`show-up-motion relative inline-block select-none shadow-sm shadow-gray-200 dark:shadow-gray-800 rounded-md overflow-hidden ${isHovered ? 'z-10' : ''}`}
      style={{ 
        transformStyle: 'preserve-3d', 
        perspective: '800px',
        transformOrigin: 'center center',
        willChange: 'transform',
        transition: 'z-index 0.2s'
      }}
    >
      <LazyLoadImage
        className="cursor-pointer relative z-0"
        width={photo.width}
        height={photo.height}
        src={photo.src}
        alt={photo.alt}
        effect="blur"
        wrapperProps={{
          style: {
            width: '100%',
            height: '100%',
            display: 'block'
          },
        }}
        onClick={() => router.push(`/preview/${photo?.id}`)}
      />
      {
        photo.type === 2 &&
        <div className="absolute top-2 left-2 p-5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute bottom-3 right-3 text-white opacity-75 z-10"
               width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
               strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" fill="none"></path>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="15.9" y1="20.11" x2="15.9" y2="20.12"></line>
            <line x1="19.04" y1="17.61" x2="19.04" y2="17.62"></line>
            <line x1="20.77" y1="14" x2="20.77" y2="14.01"></line>
            <line x1="20.77" y1="10" x2="20.77" y2="10.01"></line>
            <line x1="19.04" y1="6.39" x2="19.04" y2="6.4"></line>
            <line x1="15.9" y1="3.89" x2="15.9" y2="3.9"></line>
            <line x1="12" y1="3" x2="12" y2="3.01"></line>
            <line x1="8.1" y1="3.89" x2="8.1" y2="3.9"></line>
            <line x1="4.96" y1="6.39" x2="4.96" y2="6.4"></line>
            <line x1="3.23" y1="10" x2="3.23" y2="10.01"></line>
            <line x1="3.23" y1="14" x2="3.23" y2="14.01"></line>
            <line x1="4.96" y1="17.61" x2="4.96" y2="17.62"></line>
            <line x1="8.1" y1="20.11" x2="8.1" y2="20.12"></line>
            <line x1="12" y1="21" x2="12" y2="21.01"></line>
          </svg>
        </div>
      }
    </div>
  )
}