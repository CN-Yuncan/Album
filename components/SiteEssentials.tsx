// components/SiteEssentials.tsx
'use client';

import { useEffect, useState } from 'react';

// 优雅的鼠标光标效果
export function MagicCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsHovering((e.target as HTMLElement).matches('a, button, .interactive'));
        };

        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, []);

    return (
        <div
            className="pointer-events-none fixed z-50 transition-transform duration-150"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
        >
            <div
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
                    isHovering ? 'w-6 h-6 bg-opacity-20' : 'w-4 h-4 bg-opacity-10'
                } bg-primary`}
            />
        </div>
    );
}

// 点击涟漪效果
export function ClickEffects() {
    useEffect(() => {
        const createRipple = (e: MouseEvent) => {
            const ripple = document.createElement('div');
            const rect = (e.target as HTMLElement).getBoundingClientRect();

            Object.assign(ripple.style, {
                left: `${e.clientX - rect.left - 5}px`,
                top: `${e.clientY - rect.top - 5}px`,
                width: '10px',
                height: '10px',
                position: 'absolute',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.3)',
                animation: 'ripple 0.6s linear'
            });

            (e.target as HTMLElement).appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        };

        document.addEventListener('click', createRipple);
        return () => document.removeEventListener('click', createRipple);
    }, []);

    return null;
}

// 优雅的底部备案信息
export function Footer() {
    return (
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm text-gray-500 font-light transition-opacity hover:opacity-80">
                <a
                    href="https://beian.miit.gov.cn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-600"
                >
                    晋ICP备2024030642号-1
                </a>
            </p>
        </footer>
    );
}