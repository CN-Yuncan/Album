// components/layout/header.tsx
import Logo from '~/components/layout/logo'
import type { AlbumDataProps } from '~/types/props'
import HeaderIconGroup from '~/components/layout/header-icon-group'

export default async function Header(props: Readonly<AlbumDataProps>) {
    return (
        <div
            className="flex items-center w-full p-2 sm:w-[70%] mx-auto sticky top-0 z-50
            rounded-2xl backdrop-blur-xl
            bg-gradient-to-r from-white/90 via-white/85 to-white/80
            dark:from-black/90 dark:via-black/85 dark:to-black/80
            shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(255,255,255,0.05)]
            border border-gray-100/50 dark:border-gray-800/50
            transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.15)]
            hover:-translate-y-[2px] group overflow-hidden"
            style={{
                willChange: 'transform, background-color, box-shadow',
                transform: 'translateZ(0)',
                // 添加伪元素实现双层渐变边框
                position: 'relative',
            }}
        >
            <div className="justify-start relative z-20">
                <Logo/>
            </div>
            <div className="flex gap-1 flex-1 select-none justify-center w-full">
            </div>
            <div className="flex h-full items-center space-x-2 justify-end relative z-20">
                <HeaderIconGroup {...props} />
            </div>
            {/* 添加动态光效装饰层 */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity
                bg-[radial-gradient(circle_at_50%_-20%,#fff_10%,transparent_60%)]
                dark:bg-[radial-gradient(circle_at_50%_-20%,#4f46e5_10%,transparent_60%)] pointer-events-none z-10"/>
        </div>
    );
}