// components/layout/header.tsx
import Logo from '~/components/layout/logo'
import type { AlbumDataProps } from '~/types/props'
import HeaderIconGroup from '~/components/layout/header-icon-group'

export default async function Header(props: Readonly<AlbumDataProps>) {
    return (
        <div
            className="flex items-center w-full p-2 sm:w-[66.667%] mx-auto sticky top-0 z-50
      backdrop-blur-lg bg-white/80 dark:bg-black/80
      border-b border-gray-200 dark:border-gray-800
      transition-all duration-300 hover:bg-white/90 dark:hover:bg-black/90"
            style={{
                willChange: 'background-color, backdrop-filter',
                transform: 'translateZ(0)'
            }}
        >
      <div className="justify-start">
        <Logo/>
      </div>
      <div className="flex gap-1 flex-1 select-none justify-center w-full">
      </div>
      <div className="flex h-full items-center space-x-2 justify-end">
        <HeaderIconGroup {...props} />
      </div>
    </div>
  );
}