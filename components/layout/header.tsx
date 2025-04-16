// components/layout/header.tsx
import Logo from '~/components/layout/logo'
import type { AlbumDataProps } from '~/types/props'
import HeaderIconGroup from '~/components/layout/header-icon-group'

export default async function Header(props: Readonly<AlbumDataProps>) {
    return (
        <div
            className="flex items-center w-full p-2 sm:w-[70%] mx-auto sticky top-0 z-50
      rounded-2xl
      bg-[hsl(0_0%_100%/0.8)]  // 亮色模式基础
      dark:bg-[hsl(240_5%_7%/0.95)] // 精准暗色 HSL 值
      shadow-[0_10px_30px_hsl(240_10%_3.9%/0.1)]
      dark:shadow-[0_10px_30px_hsl(0_0%_98%/0.03)] // 阴影透明度调整
      border border-gray-100/50
      dark:border-gray-800
      transition-all duration-500
      hover:shadow-[0_15px_40px_hsl(240_10%_3.9%/0.15)]
      dark:hover:shadow-[0_15px_40px_hsl(0_0%_98%/0.05)]
      hover:-translate-y-[2px] group overflow-hidden
      backdrop-blur-xl  // 单独声明模糊层
      before:absolute before:inset-0 before:-z-1  // 隔离背景层
      before:bg-[radial-gradient(circle_at_50%_-20%,hsl(263.4_70%_50.4%/0.1),transparent_60%)]
      dark:before:bg-[radial-gradient(circle_at_50%_-20%,hsl(263.4_70%_50.4%/0.2),transparent_70%)]"
            style={{
                willChange: 'transform, background-color, box-shadow',
                transform: 'translateZ(0)',
            }}
        >
            {/* Logo 区域 */}
            <div className="justify-start relative z-20">
                <Logo/>
            </div>

            {/* 中间区域 */}
            <div className="flex gap-1 flex-1 select-none justify-center w-full">
                <h1 className="font-moqugufeng 
    text-xl      // 移动端基准
    xs:text-2xl   // 超小屏
    sm:text-[1.35rem] // 小屏
    md:text-2xl   // 中屏
    lg:text-3xl   // 大屏
    tracking-[0.15em]  // 调整字间距
    sm:tracking-[0.2em]
    leading-[1.4] 
    sm:leading-[1.8]
    break-keep    // 防止文字换行
    px-1          // 增加左右内边距
    [word-spacing:-0.05em]  // 微调字间距
    [font-family:var(--font-moqugufeng)]">
    云笺藏霁月 镜底锁烟霞
  </h1>
            </div>

            {/* 图标组 */}
            <div className="flex h-full items-center space-x-2 justify-end relative z-20">
                <HeaderIconGroup {...props} />
            </div>

            {/* 动态光效层 (优化版) */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity
        bg-[radial-gradient(circle_at_50%_-20%,hsl(0_0%_100%/0.4)_15%,transparent_70%)]
        dark:bg-[radial-gradient(circle_at_50%_-20%,hsl(263.4_70%_50.4%/0.3)_10%,transparent_70%)]
        mix-blend-mode-screen
        pointer-events-none z-10"
            />
        </div>
    )
}
