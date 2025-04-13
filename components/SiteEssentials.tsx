// components/SiteEssentials.tsx
'use client';

import { useSpring, animated, config } from '@react-spring/web';
import { useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect, useRef, useMemo } from 'react';
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

    // 安全获取窗口尺寸
    const getWindowSize = () => {
        if (typeof window === 'undefined') return [1, 1]; // SSR时返回默认值
        return [window.innerWidth, window.innerHeight];
    };

    // 背景动态效果参数（修复SSR）
    const bgOffset = useTransform(() => {
        const [winW, winH] = getWindowSize();
        return [
            (x / winW - 0.5) * 20,
            (y / winH - 0.5) * 20
        ];
    });

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

// 三维粒子光标 - 最终正确版
// 三维粒子光标 - 最终完善版
export function MagicCursor() {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);

    // 状态统一管理
    const interactionState = useRef({
        isPressed: false,
        lastX: typeof window !== 'undefined' ? window.innerWidth/2 : 0,
        lastY: typeof window !== 'undefined' ? window.innerHeight/2 : 0,
        speed: 0
    });

    // 主光标动画
    const [{ x, y }, api] = useSpring(() => ({
        x: interactionState.current.lastX,
        y: interactionState.current.lastY,
        config: { mass: 0.4, tension: 800, friction: 28 }
    }));

    // 拖影系统
    const trails = Array.from({ length: 5 }).map((_, i) => {
        const [style, api] = useSpring(() => ({
            x: interactionState.current.lastX,
            y: interactionState.current.lastY,
            config: { tension: 600 - i * 80, friction: 20, mass: 0.3 }
        }));
        return { style, api, delay: i * 15 };
    });

    // 动画参数
    const rotateZ = useMotionValue(0);
    const { scale } = useSpring({
        scale: interactionState.current.isPressed ? 0.7 : 1,
        config: { tension: 600, friction: 20 }
    });

    // 颜色配置系统
    const colorConfig = {
        dark: { primary: 260, secondary: 180, saturation: '100%', lightness: '60%' },
        light: { primary: 180, secondary: 300, saturation: '90%', lightness: '50%' }
    };

    // 动态颜色生成器
    const getColor = (hueOffset: number, alpha: number) => {
        const config = theme === 'dark' ? colorConfig.dark : colorConfig.light;
        const baseHue = interactionState.current.isPressed ? config.primary + 20 : config.primary;
        return `hsla(
            ${(baseHue + hueOffset) % 360},
            ${config.saturation},
            ${interactionState.current.isPressed ? '70%' : config.lightness},
            ${alpha}
        )`;
    };

    // 动态渐变
    const gradient = useTransform(
        [scale, rotateZ],
        ([s, r]) => `conic-gradient(
            from ${r}deg,
            ${getColor(0, 0.8)},
            ${getColor(60, 0.6)},
            ${getColor(120, 0.4)}
        )`
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 初始化函数
        const initPosition = () => {
            const centerX = window.innerWidth/2;
            const centerY = window.innerHeight/2;

            api.start({ x: centerX, y: centerY });
            trails.forEach(({ api }) => {
                api.start({ x: centerX, y: centerY, immediate: true });
            });
        };

        // 鼠标移动处理
        const handleMouseMove = (e: MouseEvent) => {
            const currentX = Math.min(Math.max(e.clientX, 0), window.innerWidth);
            const currentY = Math.min(Math.max(e.clientY, 0), window.innerHeight);
            const now = Date.now();

            // 计算速度
            const deltaTime = now - interactionState.current.lastTime || 1;
            const velocityX = (currentX - interactionState.current.lastX) / deltaTime;
            const velocityY = (currentY - interactionState.current.lastY) / deltaTime;
            interactionState.current.speed = Math.hypot(velocityX, velocityY);
            interactionState.current.lastTime = now;

            // 更新主光标
            api.start({ x: currentX, y: currentY });

            // 更新拖影系统
            trails.forEach(({ api }, i) => {
                api.start({
                    x: currentX,
                    y: currentY,
                    delay: i * 15,
                    config: { tension: 600 - i * 80 }
                });
            });

            // 更新旋转和缩放
            rotateZ.set(Math.min(interactionState.current.speed * 0.2, 25));
        };

        // 交互事件处理
        const handleMouseDown = () => {
            interactionState.current.isPressed = true;
            scale.start(0.7);
            cursorRef.current?.style.setProperty('--glow-intensity', '1.8');
        };

        const handleMouseUp = () => {
            interactionState.current.isPressed = false;
            scale.start(1);
            cursorRef.current?.style.setProperty('--glow-intensity', '1');
        };

        // 窗口resize处理
        const handleResize = () => {
            interactionState.current.lastX = window.innerWidth/2;
            interactionState.current.lastY = window.innerHeight/2;
            initPosition();
        };

        // 初始化
        initPosition();
        const eventListeners = [
            { event: 'mousemove', handler: handleMouseMove },
            { event: 'resize', handler: handleResize },
            { event: 'mousedown', handler: handleMouseDown },
            { event: 'mouseup', handler: handleMouseUp }
        ];

        eventListeners.forEach(({ event, handler }) =>
            window.addEventListener(event, handler)
        );

        return () => {
            eventListeners.forEach(({ event, handler }) =>
                window.removeEventListener(event, handler)
            );
        };
    }, [api, scale]);

    return (
        <>
            {/* 主光标 */}
            <animated.div
                ref={cursorRef}
                className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2
                    w-14 h-14 backdrop-blur-xl transition-all duration-300 ease-out"
                style={{
                    x,
                    y,
                    scale,
                    rotateZ,
                    backgroundImage: gradient,
                    clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                    filter: 'saturate(var(--glow-intensity, 1))',
                    transform: `
                        translate(-50%, -50%)
                        scale(${scale.get()})
                        rotateZ(${rotateZ.get()}deg)
                    `
                }}
            >
                {/* 核心光效 */}
                <div className="absolute inset-0 animate-pulse" style={{
                    background: `radial-gradient(
                        circle at 50% 50%,
                        ${getColor(0, 0.4)},
                        transparent 70%
                    )`,
                    mixBlendMode: 'screen'
                }} />
            </animated.div>

            {/* 拖影系统 */}
            {trails.map(({ style }, i) => (
                <animated.div
                    key={`trail-${i}`}
                    className="pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-1/2
                        w-8 h-8 backdrop-blur-md"
                    style={{
                        ...style,
                        opacity: 0.8 - i * 0.15,
                        scale: 0.7 - i * 0.1,
                        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                        background: `linear-gradient(
                            ${45 + rotateZ.get()}deg,
                            ${getColor(i * 20, 0.6)},
                            ${getColor(i * 40, 0.4)}
                        )`
                    }}
                />
            ))}
        </>
    );
}

// 量子涟漪效果（更新版）
export function ClickEffects() {
    const { resolvedTheme } = useTheme();
    const lastClickTime = useRef(0);
    const activeType = useButtonStore((state) => state.activeType);
    const cursorRef = useRef<HTMLDivElement>(null);

    // 多层涟漪系统
    const effects = Array.from({ length: 3 }).map((_, i) =>
        useSpring(() => ({
            scale: 0,
            opacity: 0,
            rotate: 0,
            config: {
                tension: 600 + i * 200,
                friction: 20 - i * 3
            }
        }))
    );

    // 动态颜色生成
    const getEffectColor = (index: number) => {
        const baseHue = resolvedTheme === 'dark' ? 260 : 180;
        return `hsla(
            ${(baseHue + index * 40) % 360},
            80%,
            ${resolvedTheme === 'dark' ? '60%' : '50%'},
            ${0.3 - index * 0.1}
        )`;
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (Date.now() - lastClickTime.current < 100) return;
            lastClickTime.current = Date.now();

            const intensity = activeType === 'important' ? 1.5 : 1;
            const target = e.target as HTMLElement;
            const rect = target.getBoundingClientRect();
            const centerX = rect.left + rect.width/2;
            const centerY = rect.top + rect.height/2;

            effects.forEach(([styles, api], i) => {
                api.start({
                    from: {
                        scale: (0.8 + i * 0.2) * intensity,
                        opacity: 0.6 - i * 0.2,
                        rotate: Math.random() * 360
                    },
                    to: {
                        scale: (3 + i) * intensity,
                        opacity: 0,
                        rotate: styles.rotate.get() + 180
                    },
                    delay: i * 30,
                    config: {
                        tension: 500 * intensity + i * 100,
                        friction: 20 / intensity - i * 2
                    }
                });
            });

            // 粒子爆破效果
            if (cursorRef.current) {
                cursorRef.current.animate([
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(1.8)', opacity: 0 }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [activeType]);

    return (
        <>
            {/* 多层涟漪 */}
            {effects.map(([styles], i) => (
                <animated.div
                    key={`ripple-${i}`}
                    className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none
                        w-24 h-24 rounded-full mix-blend-screen blur-[2px]"
                    style={{
                        scale: styles.scale,
                        opacity: styles.opacity,
                        backgroundColor: getEffectColor(i),
                        transform: `
                            translate(-50%, -50%)
                            scale(${styles.scale})
                            rotate(${styles.rotate}deg)
                        `
                    }}
                />
            ))}

            {/* 粒子效果 */}
            <div
                ref={cursorRef}
                className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none
                    w-4 h-4 rounded-full blur-[1px]"
                style={{
                    background: resolvedTheme === 'dark'
                        ? 'radial-gradient(circle, #7B61FF 0%, #00C4FF 100%)'
                        : 'radial-gradient(circle, #00FF87 0%, #FFEB3B 100%)'
                }}
            />
        </>
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