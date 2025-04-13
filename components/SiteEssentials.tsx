// components/SiteEssentials.tsx
'use client';

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
            mass: 0.6,
            tension: 680,
            friction: 32,
            clamp: true,
            precision: 0.1
        }
    }));

    // 拖影动画
    const [{ pos: trailPos }, trailApi] = useSpring(() => ({
        pos: [window.innerWidth/2, window.innerHeight/2],
        config: { ...config.stiff, precision: 0.1 }
    }));

    // 动态参数
    const scale = useMotionValue(1);
    const rotateZ = useMotionValue(0);
    const backgroundColor = useTransform(
        scale,
        [1, 2],
        theme === 'dark'
            ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)']
            : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']
    );

    useEffect(() => {
        let animationFrameId: number;
        let lastX = window.innerWidth/2;
        let lastY = window.innerHeight/2;
        let lastTime = Date.now();

        const updateStore = useMouseStore.getState().update;
        const handleMouseMove = (e: MouseEvent) => {
            // 立即更新坐标
            const currentX = e.clientX;
            const currentY = e.clientY;
            const now = Date.now();

            // 计算速度
            const deltaTime = (now - lastTime) || 1;
            const velocityX = (currentX - lastX) / deltaTime;
            const velocityY = (currentY - lastY) / deltaTime;
            const speed = Math.hypot(velocityX, velocityY);

            // 更新动画
            api.start({ pos: [currentX, currentY] });
            trailApi.start({ pos: [currentX, currentY] });

            // 动态缩放和旋转
            scale.set(1 + Math.min(speed * 0.02, 0.6));
            rotateZ.set(Math.min(speed * 0.2, 25));

            // 交互状态检测
            const target = e.target as HTMLElement;
            const isInteractive = target?.closest('a, button, [role="button"]');
            cursorRef.current?.style.setProperty('--glow-scale', isInteractive ? '1.8' : '1');

            // 更新坐标缓存
            lastX = currentX;
            lastY = currentY;
            lastTime = now;

            // 隐藏原生光标
            document.body.style.cursor = 'none';
            document.querySelectorAll('button, a').forEach(el => {
                (el as HTMLElement).style.cursor = 'none';
            });
            // 新增：更新全局鼠标状态
            updateStore([currentX, currentY], speed);
        };

        // 窗口大小变化处理
        const handleResize = () => {
            api.set({ pos: [lastX, lastY] });
            trailApi.set({ pos: [lastX, lastY] });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        // 初始化位置
        api.start({ pos: [lastX, lastY] });
        trailApi.start({ pos: [lastX, lastY] });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            document.body.style.cursor = 'default';
        };
    }, []);

    return (
        <>
            {/* 主光标 */}
            <animated.div
                ref={cursorRef}
                className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2
                    w-8 h-8 rounded-full backdrop-blur-lg border
                    shadow-[0_0_30px_10px_var(--glow-color)]"
                style={{
                    x: pos.to(x => x),
                    y: pos.to(y => y),
                    scale,
                    rotateZ,
                    backgroundColor,
                    borderColor: backgroundColor,
                    '--glow-color': backgroundColor,
                    '--glow-scale': 1
                } as any}
            />

            {/* 拖影 */}
            <animated.div
                className="pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-1/2
                    w-6 h-6 rounded-full bg-current opacity-20"
                style={{
                    x: trailPos.to(x => x),
                    y: trailPos.to(y => y),
                    scale: 0.8
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