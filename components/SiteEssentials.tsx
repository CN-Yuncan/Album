// components/SiteEssentials.tsx
'use client';

import { useSpring, animated, config } from '@react-spring/web';
import { useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useButtonStore } from '~/app/providers/button-store-providers'

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

// 动态背景组件
export function DynamicBackground() {
    const { resolvedTheme } = useTheme();
    const bgUrl = resolvedTheme === 'dark'
        ? 'https://apir.yuncan.xyz/dark.php'
        : 'https://apir.yuncan.xyz/light.php';

    return (
        <div className="fixed inset-0 z-0 overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20
                    mix-blend-soft-light transition-opacity duration-1000"
                style={{
                    backgroundImage: `url(${bgUrl})`,
                    filter: 'blur(12px) saturate(140%) contrast(105%)',
                    opacity: 25,
                    transition: 'filter 0.5s ease-in-out' // 过渡属性
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        </div>
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
            <div className="inline-flex px-4 py-2 rounded-full backdrop-blur-sm
                bg-white/50 dark:bg-gray-900/50 shadow-lg hover:shadow-xl
                transition-all duration-300 hover:scale-[1.03] group">
                <div className="absolute inset-0 rounded-full border-2 border-transparent
                    group-hover:border-primary/20 transition-colors" />

                <p className="text-sm text-gray-600 dark:text-gray-300 font-light
                    bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    <a
                        href="https://beian.miit.gov.cn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline underline-offset-4 decoration-2"
                    >
                        晋ICP备2024030642号-1 Refactor by Yuncan   |
                    </a>
                </p>

                {/* SVG装饰 */}
                <svg viewBox="0 0 100 100" className="w-4 h-4 ml-2 text-primary animate-pulse">
                    <path
                        d="M50 0 L100 50 L50 100 L0 50 Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            </div>
        </footer>
    );
}
