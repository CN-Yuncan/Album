// components/CursorWrapper.tsx
'use client'; // 必须添加客户端指令

import dynamic from 'next/dynamic';

const DynamicCursor = dynamic(
    () => import('@/components/SiteEssentials').then((mod) => ({
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

export default DynamicCursor;