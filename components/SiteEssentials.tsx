// components/SiteEssentials.tsx
'use client';

import { useSpring, animated } from '@react-spring/web';
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

// 三维粒子光标 - 最终稳定版
export function MagicCursor() {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);

    // 安全获取窗口尺寸
    const getWindowSize = () => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    // 状态管理
    const interaction = useRef({
        isPressed: false,
        position: [getWindowSize().width/2, getWindowSize().height/2],
        velocity: 0,
        lastTime: Date.now()
    });

    // 主光标动画
    const mainSpring = useSpring({
        x: interaction.current.position[0],
        y: interaction.current.position[1],
        config: { mass: 0.4, tension: 800, friction: 28 }
    });

    // 拖影系统（独立声明每个实例）
    const trail1 = useSpring({ x: mainSpring.x.get(), y: mainSpring.y.get() });
    const trail2 = useSpring({ x: mainSpring.x.get(), y: mainSpring.y.get() });
    const trail3 = useSpring({ x: mainSpring.x.get(), y: mainSpring.y.get() });
    const trail4 = useSpring({ x: mainSpring.x.get(), y: mainSpring.y.get() });
    const trail5 = useSpring({ x: mainSpring.x.get(), y: mainSpring.y.get() });

    // 动画参数
    const scaleSpring = useSpring({
        scale: interaction.current.isPressed ? 0.7 : 1,
        config: { tension: 600, friction: 20 }
    });

    const rotateZ = useMotionValue(0);

    // 颜色配置
    const colorConfig = useMemo(() => ({
        dark: { baseHue: 260, saturation: '100%', lightness: '60%' },
        light: { baseHue: 180, saturation: '90%', lightness: '50%' }
    }), []);

    // 颜色生成
    const getColor = useMemo(() => (hueOffset: number, alpha: number) => {
        const config = theme === 'dark' ? colorConfig.dark : colorConfig.light;
        const baseHue = interaction.current.isPressed ?
            config.baseHue + 20 :
            config.baseHue;
        return `hsla(
            ${(baseHue + hueOffset) % 360},
            ${config.saturation},
            ${interaction.current.isPressed ? '70%' : config.lightness},
            ${alpha}
        )`;
    }, [theme]);

    // 动态渐变（兼容性修复）
    const gradient = useTransform(
        [scaleSpring.scale, rotateZ],
        (values) => `conic-gradient(
            from ${values[1]}deg,
            ${getColor(0, 0.8)},
            ${getColor(60, 0.6)},
            ${getColor(120, 0.4)}
        )`
    );

    // 事件处理（稳定引用）
    const handlers = useMemo(() => ({
        move: (e: MouseEvent) => {
            const { width, height } = getWindowSize();
            const x = Math.min(Math.max(e.clientX, 0), width);
            const y = Math.min(Math.max(e.clientY, 0), height);

            // 更新主光标
            mainSpring.x.start(x);
            mainSpring.y.start(y);

            // 更新拖影
            const updateTrail = (trail: typeof trail1, delay: number) => {
                trail.x.start(x, { delay });
                trail.y.start(y, { delay });
            };
            updateTrail(trail1, 15);
            updateTrail(trail2, 30);
            updateTrail(trail3, 45);
            updateTrail(trail4, 60);
            updateTrail(trail5, 75);

            // 计算速度
            const now = Date.now();
            const delta = now - interaction.current.lastTime;
            interaction.current.velocity = Math.hypot(
                (x - interaction.current.position[0]) / delta,
                (y - interaction.current.position[1]) / delta
            );
            interaction.current.position = [x, y];
            interaction.current.lastTime = now;

            // 更新旋转
            rotateZ.set(Math.min(interaction.current.velocity * 0.2, 25));
        },
        down: () => {
            interaction.current.isPressed = true;
            scaleSpring.scale.start(0.7);
            cursorRef.current?.style.setProperty('--glow-intensity', '1.8');
        },
        up: () => {
            interaction.current.isPressed = false;
            scaleSpring.scale.start(1);
            cursorRef.current?.style.setProperty('--glow-intensity', '1');
        },
        resize: () => {
            const center = [
                getWindowSize().width/2,
                getWindowSize().height/2
            ];
            interaction.current.position = center;
            mainSpring.x.start(center[0]);
            mainSpring.y.start(center[1]);
            [trail1, trail2, trail3, trail4, trail5].forEach(trail => {
                trail.x.start(center[0]);
                trail.y.start(center[1]);
            });
        }
    }), []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 事件绑定
        const events = [
            { type: 'mousemove', handler: handlers.move },
            { type: 'mousedown', handler: handlers.down },
            { type: 'mouseup', handler: handlers.up },
            { type: 'resize', handler: handlers.resize }
        ];

        events.forEach(({ type, handler }) =>
            window.addEventListener(type, handler)
        );

        return () => {
            events.forEach(({ type, handler }) =>
                window.removeEventListener(type, handler)
            );
        };
    }, [handlers]);

    return (
        <>
            {/* 主光标 */}
            <animated.div
                ref={cursorRef}
                className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2
                    w-14 h-14 backdrop-blur-xl transition-all duration-300 ease-out"
                style={{
                    x: mainSpring.x,
                    y: mainSpring.y,
                    scale: scaleSpring.scale,
                    rotateZ,
                    backgroundImage: gradient,
                    clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                    filter: 'saturate(var(--glow-intensity, 1))'
                }}
            >
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
            {[trail1, trail2, trail3, trail4, trail5].map((trail, i) => (
                <animated.div
                    key={`trail-${i}`}
                    className="pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-1/2
                        w-8 h-8 backdrop-blur-md"
                    style={{
                        x: trail.x,
                        y: trail.y,
                        opacity: 0.8 - i * 0.15,
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

// 量子涟漪效果 - 稳定版
export function ClickEffects() {
    const { resolvedTheme } = useTheme();
    const lastClickTime = useRef(0);
    const activeType = useButtonStore((state) => state.activeType);
    const cursorRef = useRef<HTMLDivElement>(null);

    // 静态声明effects
    const [effect1, effect1Api] = useSpring(() => ({ scale: 0, opacity: 0, rotate: 0 }));
    const [effect2, effect2Api] = useSpring(() => ({ scale: 0, opacity: 0, rotate: 0 }));
    const [effect3, effect3Api] = useSpring(() => ({ scale: 0, opacity: 0, rotate: 0 }));

    const effects = [
        { api: effect1Api, style: effect1, config: { tension: 800, friction: 17 } },
        { api: effect2Api, style: effect2, config: { tension: 1000, friction: 15 } },
        { api: effect3Api, style: effect3, config: { tension: 1200, friction: 13 } }
    ];

    // 动态颜色
    const getEffectColor = useMemo(() => (index: number) => {
        const baseHue = resolvedTheme === 'dark' ? 260 : 180;
        return `hsla(
            ${(baseHue + index * 40) % 360},
            80%,
            ${resolvedTheme === 'dark' ? '60%' : '50%'},
            ${0.3 - index * 0.1}
        )`;
    }, [resolvedTheme]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (Date.now() - lastClickTime.current < 100) return;
            lastClickTime.current = Date.now();

            const intensity = activeType === 'important' ? 1.5 : 1;
            const target = e.target as HTMLElement;
            const rect = target.getBoundingClientRect();
            const centerX = rect.left + rect.width/2;
            const centerY = rect.top + rect.height/2;

            effects.forEach(({ api }, i) => {
                api.start({
                    from: {
                        scale: (0.8 + i * 0.2) * intensity,
                        opacity: 0.6 - i * 0.2,
                        rotate: Math.random() * 360
                    },
                    to: {
                        scale: (3 + i) * intensity,
                        opacity: 0,
                        rotate: effect1.rotate.get() + 180
                    },
                    delay: i * 30,
                    config: effects[i].config
                });
            });

            // 粒子效果
            cursorRef.current?.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: 'translate(-50%, -50%) scale(1.8)', opacity: 0 }
            ], {
                duration: 300,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [activeType]);

    return (
        <>
            {effects.map(({ style }, i) => (
                <animated.div
                    key={`ripple-${i}`}
                    className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none
                        w-24 h-24 rounded-full mix-blend-screen blur-[2px]"
                    style={{
                        ...style,
                        backgroundColor: getEffectColor(i),
                        transform: `translate(-50%, -50%) scale(${style.scale}) rotate(${style.rotate}deg)`
                    }}
                />
            ))}

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