// components/SiteEssentials.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { useTheme } from 'next-themes';
import { create } from 'zustand';

interface MouseStore {
    position: [number, number];
    velocity: number;
    update: (pos: [number, number], vel: number) => void;
}

export const useMouseStore = create<MouseStore>((set) => ({
    position: [0, 0],
    velocity: 0,
    update: (pos, vel) => set({ position: pos, velocity: vel })
}));

export function DynamicBackground() {
    const { resolvedTheme } = useTheme();
    const { position: [x, y], velocity } = useMouseStore();
    const bgUrl = resolvedTheme === 'dark'
        ? 'https://apir.yuncan.xyz/dark.php'
        : 'https://apir.yuncan.xyz/light.php';

    const getWindowSize = () => {
        if (typeof window === 'undefined') return [1, 1];
        return [window.innerWidth, window.innerHeight];
    };

    const bgOffset = useTransform(() => {
        const [winW, winH] = getWindowSize();
        return [
            (x / winW - 0.5) * 20,
            (y / winH - 0.5) * 20
        ];
    });

    const bgBlur = useTransform(() => Math.min(12 + velocity * 0.5, 20)); // 增加模糊度动态变化
    const bgScale = useTransform(() => 1 + Math.min(velocity * 0.002, 0.1)); // 背景缩放

    return (
        <motion.div
            className="fixed inset-0 z-[-1] overflow-hidden"
            style={{
                backgroundImage: `url(${bgUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                opacity: 0.5, // 透明度
                filter: 'saturate(120%) contrast(100%)',
                x: bgOffset.get()[0],
                y: bgOffset.get()[1],
                scale: bgScale,
                backdropFilter: `blur(${bgBlur.get()}px)` // 修复类型错误
            }}
        >
            <motion.div
                className="absolute inset-0"
                style={{
                    backdropFilter: `blur(${bgBlur.get()}px)`, // 动态调整背景模糊度
                    background: resolvedTheme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)' // 针对夜间模式与白天模式的不同蒙版
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        </motion.div>
    );
}

function lerp(start: number, end: number, amount: number) {
    return (1 - amount) * start + amount * end;
}

export function MagicCursor() {
    const [cursorX, setCursorX] = useState(0);
    const [cursorY, setCursorY] = useState(0);
    const [pageX, setPageX] = useState(0);
    const [pageY, setPageY] = useState(0);
    const [size] = useState(8);
    const [sizeF] = useState(36);
    const [clicked, setClicked] = useState(false);
    const [startY, setStartY] = useState(0);
    const followSpeed = 0.16;

    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window;
        const cursor = document.querySelector('.cursor') as HTMLElement;
        const cursorF = document.querySelector('.cursor-f') as HTMLElement;

        if (isTouchDevice && cursor && cursorF) {
            cursor.style.display = 'none';
            cursorF.style.display = 'none';
        }

        const handleMouseMove = (e: MouseEvent) => {
            setPageX(e.clientX);
            setPageY(e.clientY);
            if (cursor) {
                cursor.style.left = `${e.clientX - size / 2}px`;
                cursor.style.top = `${e.clientY - size / 2}px`;
            }
            if (cursorF) {
                cursorF.style.left = `${e.clientX - sizeF / 2}px`;
                cursorF.style.top = `${e.clientY - sizeF / 2}px`;
            }
        };

        const handleMouseDown = (e: MouseEvent | TouchEvent) => {
            gsap.to('.cursor', { scale: 4.5, duration: 0.2, ease: "power3.out" });
            gsap.to('.cursor-f', { 
                scale: 0.4, 
                duration: 0.2, 
                ease: "power3.out",
                onComplete: () => {
                    // 动画完成后让外圈消失
                    const cursorF = document.querySelector('.cursor-f') as HTMLElement;
                    if (cursorF) {
                        cursorF.style.opacity = '0';
                    }
                }
            });
            setClicked(true);
            const clientY = (e as TouchEvent).touches?.[0]?.clientY || (e as MouseEvent).clientY;
            setStartY(clientY);
        };

        const handleMouseUp = (e: MouseEvent | TouchEvent) => {
            // 先恢复外圈的显示
            const cursorF = document.querySelector('.cursor-f') as HTMLElement;
            if (cursorF) {
                cursorF.style.opacity = '0.9'; // 恢复到CSS中定义的默认值
            }
            
            gsap.to('.cursor', { scale: 1, duration: 0.4, ease: "elastic.out(1.2, 0.3)" });
            gsap.to('.cursor-f', { scale: 1, duration: 0.4, ease: "elastic.out(1.2, 0.3)" });
            const endY = (e as TouchEvent).changedTouches?.[0]?.clientY || (e as MouseEvent).clientY;
            if (clicked && Math.abs(startY - endY) >= 40) {
                // Handle swipe logic here if needed
            }
            setClicked(false);
            setStartY(0);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchstart', handleMouseDown);
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchstart', handleMouseDown);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [clicked, startY, size, sizeF]);

    return (
        <>
            <div
                className="cursor"
                style={{
                    '--size': `${size}px`,
                    '--color': 'rgba(255,255,255,0.5)' // 基础颜色
                } as React.CSSProperties}
            />
            <div
                className="cursor-f"
                style={{
                    '--size': `${sizeF}px`,
                    '--color-1': 'rgba(79, 115, 204)', // RGB效果
                    '--color-2': 'rgba(182, 61, 139)',
                    '--color-3': 'rgba(137, 179, 63)'
                } as React.CSSProperties}
            />
        </>
    );
}

// 艺术化备案信息
export function Footer() {
    const { theme, resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    // 动态颜色配置
    const gradientConfig = {
        light: {
            bg: 'from-[rgba(255,251,224,0.55)] to-[rgba(221,255,247,0.56)]',
            shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.05)]',
            border: 'border-gray-200/50',
            svgGradient: ['#6366f1', '#8b5cf6'],
            glow: '#6366f1'
        },

        dark: {
            bg: 'from-[rgba(140,106,88,0.26)] to-[rgba(104,145,145,0.45)]',
            shadow: 'shadow-[0_8px_32px_rgba(255,255,255,0.07)]',
            border: 'border-gray-700/60',
            svgGradient: ['#a855f7', '#ec4899'],
            glow: '#a855f7'
        }
    }

    const { bg, shadow, border, svgGradient, glow } =
        isDark ? gradientConfig.dark : gradientConfig.light

    return (
        <footer className="fixed bottom-4 inset-x-0 text-center">
            <div className={`inline-flex px-6 py-3 rounded-2xl backdrop-blur-xl
        bg-gradient-to-r ${bg}
        ${shadow}
        ${border}
        transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group
        relative overflow-hidden isolate`}>

                {/* 动态渐变边框 */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent
          group-hover:bg-[conic-gradient(var(--tw-gradient-stops))]
          group-hover:from-blue-400/20
          group-hover:via-purple-400/20
          group-hover:to-pink-400/20
          dark:group-hover:from-blue-600/30
          dark:group-hover:via-purple-600/30
          dark:group-hover:to-pink-600/30
          transition-all duration-700 animate-gradient-rotate" />

                <p className="text-sm font-medium
          text-white-300 dark:text-white
          flex items-center">

                    <a
                        href="https://beian.miit.gov.cn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors"
                    >
                        晋ICP备2024030642号-1 | Refactor by Yuncan
                    </a>

                    <a
                        href="https://yuncan.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 hover:text-purple-400 dark:hover:text-pink-300 transition-colors relative group"
                        title="进入个人站"
                    >
                        {/* 优化后的SVG */}
                        <svg
                            viewBox="0 0 100 100"
                            className="w-5 h-5 ml-2 animate-breathe"
                            style={{filter: `drop-shadow(0 2px 4px ${glow}30)`}}>
                            <linearGradient id="footerGradient">
                                <stop offset="0%" stopColor={svgGradient[0]}/>
                                <stop offset="100%" stopColor={svgGradient[1]}/>
                            </linearGradient>
                            <path
                                d="M50 15a35 35 0 1 1 0 70 35 35 0 0 1 0-70zm0 10c-13.8 0-25 11.2-25 25s11.2 25 25 25 25-11.2 25-25-11.2-25-25-25z"
                                fill="url(#footerGradient)"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                        </svg>
                    </a>
                </p>

                {/* 适配暗色的光效 */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity
          bg-[radial-gradient(circle_at_50%_120%,var(--glow-color)_20%,transparent_60%)]"
                     style={{
                         '--glow-color': glow,
                         mixBlendMode: isDark ? 'screen' : 'multiply'
                     } as React.CSSProperties}/>
            </div>
        </footer>
    )
}
