// components/SiteEssentials.tsx
'use client';

import { useSpring, animated, config } from '@react-spring/web';
import { useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useStore } from 'zustand';
import { useButtonStore } from '~/app/providers/button-store-providers'

// 三维粒子光标
export function MagicCursor() {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);

    // 主光标物理动画
    const [{ pos }, api] = useSpring(() => ({
        pos: [0, 0],
        config: { mass: 0.8, tension: 500, friction: 25 }
    }));

    // 副光标延迟动画
    const [{ pos: trailPos }, trailApi] = useSpring(() => ({
        pos: [0, 0],
        config: { ...config.wobbly, precision: 0.001 }
    }));

    // 动态响应参数
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
        let velocity = [0, 0];
        let lastTime = Date.now();

        const updateCursor = (e: MouseEvent) => {
            const now = Date.now();
            const deltaTime = Math.min(100, now - lastTime) / 1000;
            const newVelocity = [
                (e.clientX - pos.get()[0]) / deltaTime,
                (e.clientY - pos.get()[1]) / deltaTime
            ];

            velocity = [
                0.6 * velocity[0] + 0.4 * newVelocity[0],
                0.6 * velocity[1] + 0.4 * newVelocity[1]
            ];

            // 速度响应缩放
            const speed = Math.hypot(...velocity) / 1000;
            scale.set(Math.max(1, 1 + speed * 0.8));
            rotateZ.set(speed * 15);

            api.start({ pos: [e.clientX, e.clientY] });
            setTimeout(() => trailApi.start({ pos: [e.clientX, e.clientY] }), 50);

            // 交互元素检测
            const target = e.target as HTMLElement;
            const isInteractive = target?.closest('a, button, [role="button"]');
            cursorRef.current?.style.setProperty('--glow-scale', isInteractive ? '1.8' : '1');

            lastTime = now;
        };

        document.addEventListener('mousemove', updateCursor);
        return () => document.removeEventListener('mousemove', updateCursor);
    }, []);

    return (
        <>
            {/* 主光标 */}
            <animated.div
                ref={cursorRef}
                className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2
                    w-8 h-8 rounded-full backdrop-blur-lg border
                    shadow-[0_0_30px_10px_var(--glow-color)] transition-colors"
                style={{
                    x: pos.to((x, y) => x),
                    y: pos.to((x, y) => y),
                    scale,
                    rotateZ,
                    backgroundColor,
                    borderColor: backgroundColor,
                    '--glow-color': backgroundColor,
                    '--glow-scale': 1
                } as any}
            />

            {/* 粒子拖影 */}
            <animated.div
                className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2
                    w-6 h-6 rounded-full bg-current opacity-20"
                style={{
                    x: trailPos.to((x, y) => x),
                    y: trailPos.to((x, y) => y),
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
                    filter: 'blur(20px) saturate(180%)'
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
                        晋ICP备2024030642号-1
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