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

// 三维粒子光标 - 美化版
export function MagicCursor() {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);
    const isPressed = useRef(false);

    // 安全初始化主光标
    const getInitialX = () => typeof window !== 'undefined' ? window.innerWidth/2 : 0;
    const getInitialY = () => typeof window !== 'undefined' ? window.innerHeight/2 : 0;

    // 主光标动画
    const [{ x, y }, api] = useSpring(() => ({
        x: getInitialX(),
        y: getInitialY(),
        config: { mass: 0.4, tension: 800, friction: 28 }
    }));

    // 正确声明拖影系统（使用useMemo保持引用稳定）
    const trailCount = 5;
    const trails = useMemo(() =>
            Array.from({ length: trailCount }).map((_, i) =>
                useSpring({
                    x: getInitialX(),
                    y: getInitialY(),
                    config: {
                        tension: 600 - i * 80,
                        friction: 20,
                        mass: 0.3,
                        delay: i * 15
                    }
                })
            ),
        []); // 空依赖确保只创建一次


    // 动态参数
    const scale = useMotionValue(1);
    const rotateZ = useMotionValue(0);

    // 新增：动态渐变颜色
    const gradient = useTransform(
        [scale, rotateZ],
        ([s, r]) => `conic-gradient(
            from ${r}deg,
            hsl(${s * 180} 100% 60%),
            hsl(${s * 240} 100% 50%),
            hsl(${s * 300} 100% 60%)
        )`
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let animationFrameId: number;
        let lastX = window.innerWidth/2;
        let lastY = window.innerHeight/2;
        let lastTime = Date.now();

        // 窗口尺寸安全获取
        const getSafePosition = (e: MouseEvent) => {
            const safeX = Math.min(
                Math.max(e.clientX, 0),
                window.innerWidth
            );
            const safeY = Math.min(
                Math.max(e.clientY, 0),
                window.innerHeight
            );
            return [safeX, safeY];
        };

        const updateStore = useMouseStore.getState().update;
        const handleMouseMove = (e: MouseEvent) => {
            const [currentX, currentY] = getSafePosition(e);
            const now = Date.now();

            // 计算速度
            const deltaTime = (now - lastTime) || 1;
            const velocityX = (currentX - lastX) / deltaTime;
            const velocityY = (currentY - lastY) / deltaTime;
            const speed = Math.hypot(velocityX, velocityY);

            // 更新主光标
            api.start({ x: currentX, y: currentY });

            // 更新所有拖影
            trails.forEach((trailApi, index) => {
                trailApi.start({
                    x: currentX,
                    y: currentY,
                    delay: index * 15
                });
            });

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

        // 新增：鼠标按下/抬起监听
        const handleMouseDown = () => {
            isPressed.current = true;
            scale.set(0.6);
        };
        const handleMouseUp = () => {
            isPressed.current = false;
            scale.set(1 + Math.min(speed * 0.02, 0.6));
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        // 窗口大小变化处理
        const handleResize = () => {
            const centerX = window.innerWidth/2;
            const centerY = window.innerHeight/2;

            api.start({ x: centerX, y: centerY });
            trailRefs.current.forEach(trailApi => {
                trailApi.start({ x: centerX, y: centerY });
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        // 初始化位置
        api.start({ pos: [lastX, lastY] });
        trailApi.start({ pos: [lastX, lastY] });

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            document.body.style.cursor = 'default';
        };
    }, []);

    return (
        <>
            {/* 主光标 - 改为液态效果 */}
            <animated.div
                ref={cursorRef}
                className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2
                    w-12 h-8 rounded-[40%] border-2 backdrop-blur-2xl
                    transition-all duration-300 ease-out"
                style={{
                    x,
                    y,
                    scale,
                    rotateZ,
                    backgroundImage: gradient,
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                    boxShadow: theme === 'dark'
                        ? '0 0 30px 10px hsl(240 100% 60% / 0.4)'
                        : '0 0 30px 8px hsl(180 100% 60% / 0.3)',
                    filter: 'saturate(180%)',
                    transform: `
                        translate(-50%, -50%)
                        scale(${scale.get()})
                        rotateZ(${rotateZ.get()}deg)
                    `
                }}
            >
                {/* 新增：核心光点 */}
                <div className="absolute inset-0 bg-white/30 blur-[2px] rounded-full" />
            </animated.div>

            {/* 粒子拖影系统 */}
            {trails.map(([styles], index) => (
                <animated.div
                    key={`trail-${index}`}
                    style={{
                        ...styles,
                        opacity: 0.8 - index * 0.15,
                        scale: 0.7 - index * 0.1
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