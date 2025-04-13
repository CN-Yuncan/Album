// components/SiteEssentials.tsx
'use client'; // 必须作为文件的第一行

import { useSpring, animated, config } from '@react-spring/web';
import { useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useButtonStore } from '~/app/providers/button-store-providers';
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

// 动态背景组件
export function DynamicBackground() {
    const { resolvedTheme } = useTheme();
    const { position: [x, y], velocity } = useMouseStore();
    const bgUrl = resolvedTheme === 'dark'
        ? 'https://apir.yuncan.xyz/dark.php'
        : 'https://apir.yuncan.xyz/light.php';

    // 背景动态效果参数
    const bgOffset = useTransform(() => [
        (x / window.innerWidth - 0.5) * 20,
        (y / window.innerHeight - 0.5) * 20
    ]);

    const bgBlur = useTransform(() =>
        Math.min(12 + velocity * 0.5, 20)
    );

    const bgScale = useTransform(() =>
        1 + Math.min(velocity * 0.002, 0.1)
    );

    return (
        <motion.div
            className="fixed inset-0 z-0 overflow-hidden"
            style={{
                backgroundImage: `url(${bgUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                opacity: 0.15,
                filter: 'saturate(140%) contrast(105%)',
                x: bgOffset[0],
                y: bgOffset[1],
                scale: bgScale,
                blur: bgBlur
            }}
        >
            <motion.div
                className="absolute inset-0 backdrop-blur-xl"
                style={{
                    opacity: useTransform(() => velocity * 0.02)
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        </motion.div>
    );
}

// 三维粒子光标
export function MagicCursor() {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);

    // 主光标动画
    const [{ pos }, api] = useSpring(() => ({
        pos: [window.innerWidth/2, window.innerHeight/2],
        config: {
            mass: 0.5,
            tension: 720,
            friction: 28,
            clamp: true,
            precision: 0.01
        }
    }));

    // 拖影动画（新增第三个拖影）
    const [{ pos: trail1Pos }, trail1Api] = useSpring(() => ({ pos: pos.get() }));
    const [{ pos: trail2Pos }, trail2Api] = useSpring(() => ({ pos: pos.get() }));

    // 动态参数
    const scale = useSpring(1, { damping: 15, stiffness: 300 });
    const rotateZ = useSpring(0, { damping: 20, stiffness: 200 });
    const glowScale = useSpring(1, { tension: 300, friction: 20 });

    // 颜色配置
    const colorConfig = {
        dark: {
            primary: '#a0d8ff',
            secondary: 'rgba(160,216,255,0.33)'
        },
        light: {
            primary: '#ffd700',
            secondary: 'rgba(255,215,0,0.33)'
        }
    };

    useEffect(() => {
        let lastX = window.innerWidth/2;
        let lastY = window.innerHeight/2;
        let lastTime = Date.now();

        const updateStore = useMouseStore.getState().update;
        const handleMouseMove = (e: MouseEvent) => {
            const currentX = e.clientX;
            const currentY = e.clientY;
            const now = Date.now();

            // 计算速度（增加加速度计算）
            const deltaTime = Math.min(now - lastTime, 32);
            const velocityX = (currentX - lastX) / deltaTime;
            const velocityY = (currentY - lastY) / deltaTime;
            const speed = Math.hypot(velocityX, velocityY);

            // 主光标动画
            api.start({ pos: [currentX, currentY] });

            // 拖影延迟动画（优化延迟算法）
            trail1Api.start({
                pos: [currentX + velocityX*0.8, currentY + velocityY*0.8],
                delay: 16
            });
            trail2Api.start({
                pos: [currentX + velocityX*0.4, currentY + velocityY*0.4],
                delay: 32
            });

            // 动态效果（优化缓动曲线）
            scale.start(1 + Math.min(speed * 0.025, 0.8));
            rotateZ.start(Math.min(speed * 0.25, 30));

            // 交互检测（优化元素检测逻辑）
            const target = e.target as HTMLElement;
            const isInteractive = target?.matches('a, button, [role="button"], input, select, textarea');
            glowScale.start(isInteractive ? 1.6 : 1);

            // 更新状态
            lastX = currentX;
            lastY = currentY;
            lastTime = now;
            updateStore([currentX, currentY], speed);
        };

        const handleResize = () => api.set({ pos: [lastX, lastY] });

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            document.body.style.cursor = 'default';
        };
    }, []);

    return (
        <>
            {/* 主光标 */}
            <animated.div
                ref={cursorRef}
                className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2
                    w-6 h-6 rounded-full border-2 backdrop-blur-xl transition-all"
                style={{
                    x: pos.to(x => x),
                    y: pos.to(y => y),
                    scale,
                    rotateZ,
                    borderColor: colorConfig[theme].primary,
                    background: `radial-gradient(circle at center, 
                        ${colorConfig[theme].secondary} 0%, 
                        transparent 70%)`,
                    boxShadow: glowScale.to(s =>
                        `0 0 ${s * 15}px ${s * 2}px ${colorConfig[theme].primary}33`)
                }}
            />

            {/* 拖影层 1 */}
            <animated.div
                className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2
                    w-7 h-7 rounded-full backdrop-blur-md border border-opacity-30"
                style={{
                    x: trail1Pos.to(x => x),
                    y: trail1Pos.to(y => y),
                    scale: scale.to(s => s * 0.7),
                    borderColor: colorConfig[theme].primary,
                    background: `radial-gradient(circle at center, 
                        ${colorConfig[theme].secondary}22, 
                        transparent 70%)`
                }}
            />

            {/* 拖影层 2 */}
            <animated.div
                className="pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-1/2
                    w-8 h-8 rounded-full backdrop-blur-sm"
                style={{
                    x: trail2Pos.to(x => x),
                    y: trail2Pos.to(y => y),
                    scale: scale.to(s => s * 0.5),
                    background: `radial-gradient(circle at center, 
                        ${colorConfig[theme].secondary}11, 
                        transparent 70%)`
                }}
            />
        </>
    );
}

// 量子涟漪效果（更新版）
export function ClickEffects() {
    const { resolvedTheme } = useTheme();
    const lastClickTime = useRef(0);
    const activeType = useButtonStore((state) => state.activeType)
    const setActiveType = useButtonStore((state) => state.setActiveType)

    const [{ scale, opacity }, api] = useSpring(() => ({
        scale: 0,
        opacity: 0,
        config: { tension: 600, friction: 30 }
    }));

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // 节流处理
            if (Date.now() - lastClickTime.current < 100) return;
            lastClickTime.current = Date.now();

            // 根据按钮类型变化效果
            const intensity = activeType === 'important' ? 2 : 1;

            api.start({
                from: {
                    scale: 0.5 * intensity,
                    opacity: 0.8 / intensity
                },
                to: {
                    scale: 3 * intensity,
                    opacity: 0
                },
                config: {
                    tension: 500 * intensity,
                    friction: 20 / intensity
                }
            });
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [activeType]);

    return (
        <animated.div
            className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none
                w-16 h-16 rounded-full mix-blend-screen"
            style={{
                scale,
                opacity,
                backgroundColor: resolvedTheme === 'dark'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(0,0,0,0.1)',
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
}

// 艺术化备案信息
export function Footer() {
    return (
        <footer className="fixed bottom-4 inset-x-0 text-center">
            <div className="inline-flex px-6 py-3 rounded-2xl backdrop-blur-xl
                bg-gradient-to-r from-white/70 to-white/90 dark:from-gray-900/70 dark:to-gray-900/90
                shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.05)]
                border border-gray-200/50 dark:border-gray-700/50
                transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group
                relative overflow-hidden">

                {/* 动态渐变边框 */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent
                    group-hover:bg-[conic-gradient(var(--tw-gradient-stops))]
                    group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20
                    transition-all duration-700 animate-gradient-rotate" />

                {/* 文字优化 */}
                <p className="text-sm font-medium
                text-gray-700 dark:text-gray-300  // 添加具体颜色
                flex items-center">
                    <a
                        href="https://beian.miit.gov.cn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline underline-offset-4 decoration-dotted"
                    >
                        晋ICP备2024030642号-1 | Refactor by Yuncan
                    </a>

                    {/* SVG优化 */}
                    <svg viewBox="0 0 100 100"
                         className="w-5 h-5 ml-2 animate-breathe"
                         style={{filter: 'drop-shadow(0 2px 4px rgba(99,102,241,0.3))'}}>
                        <path
                            d="M50 15a35 35 0 1 1 0 70 35 35 0 0 1 0-70zm0 10c-13.8 0-25 11.2-25 25s11.2 25 25 25 25-11.2 25-25-11.2-25-25-25z"
                            fill="url(#gradient)"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1"/>
                                <stop offset="100%" stopColor="#a855f7"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </p>

                {/* 悬浮光效 */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity
                    bg-[radial-gradient(circle_at_50%_120%,#6366f1_20%,transparent_60%)]"/>
            </div>
        </footer>
    )
}