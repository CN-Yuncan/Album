// components/SiteEssentials.tsx
'use client';

import { useSpring, animated, useSprings } from '@react-spring/web';
import { useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { create } from 'zustand';

interface MouseStore {
    position: [number, number];
    velocity: number;
    pressure: number;
    update: (pos: [number, number], vel: number, pressure: number) => void;
}

export const useMouseStore = create<MouseStore>((set) => ({
    position: [0, 0],
    velocity: 0,
    pressure: 0,
    update: (pos, vel, pressure) => set({ position: pos, velocity: vel, pressure })
}));

// 流体动态背景
export function DynamicBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { resolvedTheme } = useTheme();
    const { position: [x, y], velocity, pressure } = useMouseStore();

    useEffect(() => {
        if (typeof window === 'undefined') return; // SSR保护
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        let animationFrame: number;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = Array.from({ length: 200 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: 0,
            vy: 0,
            life: 1
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 背景色
            ctx.fillStyle = resolvedTheme === 'dark' ? '#0a0a0f' : '#f5f5ff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 粒子系统
            particles.forEach((p, i) => {
                const dx = p.x - x;
                const dy = p.y - y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const force = Math.min(2000/(dist*dist), 0.5);

                p.vx += (dx/dist * -force) + (Math.random()-0.5)*0.2;
                p.vy += (dy/dist * -force) + (Math.random()-0.5)*0.2;

                p.x = (p.x + p.vx + canvas.width) % canvas.width;
                p.y = (p.y + p.vy + canvas.height) % canvas.height;

                // 绘制
                ctx.beginPath();
                ctx.strokeStyle = resolvedTheme === 'dark' ?
                    `rgba(150,180,255,${0.2*p.life})` :
                    `rgba(50,80,150,${0.1*p.life})`;
                ctx.lineWidth = 1.5;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx*3, p.y - p.vy*3);
                ctx.stroke();

                p.life = dist < 100 ? Math.min(p.life + 0.1, 1) : Math.max(p.life - 0.005, 0.2);
                p.vx *= 0.95;
                p.vy *= 0.95;
            });

            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [resolvedTheme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 opacity-30 blur-[2px]"
            style={{ mixBlendMode: resolvedTheme === 'dark' ? 'screen' : 'multiply' }}
        />
    );
}

// 量子流体光标
export function MagicCursor() {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);
    const trailCount = 8;

    // 修复1：安全的初始位置
    const [isMounted, setIsMounted] = useState(false);
    const safePos = useMemo(() => [
        typeof window !== 'undefined' ? window.innerWidth/2 : 0,
        typeof window !== 'undefined' ? window.innerHeight/2 : 0
    ], []);

    // 主光标动画
    const [{ pos }, api] = useSpring(() => ({
        pos: safePos,
        config: { mass: 0.8, tension: 1200, friction: 40 }
    }));

    // 拖影粒子系统
    const [trailSprings, trailApi] = useSprings(trailCount, (i) => ({
        pos: pos.get(),
        opacity: 1 - i/trailCount,
        scale: 1 - i/(trailCount*2),
        config: { tension: 800, friction: 30 }
    }));

    // 动态参数
    const scale = useMotionValue(1);
    const turbulence = useMotionValue(0);
    const energy = useTransform(turbulence, [0, 1], [0, 0.4]);

    useEffect(() => {
        setIsMounted(true); // 标记组件已挂载
        if (!cursorRef.current) return;

        let lastX = safePos[0];
        let lastY = safePos[1];
        let velocity = 0;

        const updateStore = useMouseStore.getState().update;
        const handleMouseMove = (e: MouseEvent) => {
            const currentX = e.clientX;
            const currentY = e.clientY;
            const deltaX = currentX - lastX;
            const deltaY = currentY - lastY;
            velocity = Math.hypot(deltaX, deltaY);

            api.start({ pos: [currentX, currentY] });
            trailApi.start((i) => ({
                delay: i * 8,
                pos: [currentX - deltaX*(i/trailCount), currentY - deltaY*(i/trailCount)]
            }));

            // 动态效果
            scale.set(1 + Math.min(velocity*0.008, 0.6));
            turbulence.set(Math.min(velocity*0.02, 1));

            // 交互检测
            const target = e.target as HTMLElement;
            const isInteractive = target?.closest('a, button, [role="button"]');
            cursorRef.current?.style.setProperty('--energy', isInteractive ? '0.8' : '0');

            updateStore([currentX, currentY], velocity, turbulence.get());

            lastX = currentX;
            lastY = currentY;
            document.body.style.cursor = 'none';
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // 修复2：只在客户端渲染
    if (!isMounted) return null;
    return (
        <>
            {/* 拖影粒子 */}
            {trailSprings.map((style, i) => (
                <animated.div
                    key={i}
                    className="absolute pointer-events-none rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{
                        width: 24 + i*2,
                        height: 24 + i*2,
                        opacity: style.opacity,
                        scale: style.scale,
                        x: style.pos.to((x: number) => x),
                        y: style.pos.to((y: number) => y),
                        background: `radial-gradient(circle at 35% 35%, 
                            ${theme === 'dark' ? '#a0f2ff' : '#3a6afc'}, 
                            transparent 70%)`,
                        filter: `blur(${i*2}px)`
                    }}
                />
            ))}

            {/* 主光标 */}
            <animated.div
                ref={cursorRef}
                className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2
                    w-9 h-9 rounded-full backdrop-blur-xl"
                style={{
                    x: pos.to((x: number) => x),
                    y: pos.to((y: number) => y),
                    scale,
                    background: `radial-gradient(circle at 35% 35%, 
                        ${theme === 'dark' ? 'rgba(160,242,255,0.3)' : 'rgba(58,106,252,0.3)'}, 
                        transparent 70%)`,
                    boxShadow: energy.to(e => `
                        0 0 15px 2px ${theme === 'dark' ? '#a0f2ff66' : '#3a6afc33'},
                        0 0 30px 10px ${theme === 'dark' ? '#a0f2ff22' : '#3a6afc11'}
                    `),
                    filter: turbulence.to(t => `
                        url(#turbulence)
                        drop-shadow(0 0 2px ${theme === 'dark' ? '#a0f2ff' : '#3a6afc'})
                    `)
                }}
            >
                <svg className="absolute inset-0">
                    <filter id="turbulence">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency={energy.to(e => `0.00${1 + e}`)}
                            numOctaves="3"
                        />
                        <feDisplacementMap in="SourceGraphic" scale={energy.to(e => e*8)} />
                    </filter>
                </svg>
            </animated.div>
        </>
    );
}

// 量子涟漪效果
export function ClickEffects() {
    const { resolvedTheme } = useTheme();
    const [springs, api] = useSprings(0, () => ({
        pos: [0, 0],
        scale: 1,
        opacity: 1,
        config: { tension: 600, friction: 20 }
    }));

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newParticles = Array.from({ length: 8 }, (_, i) => ({
                angle: (Math.PI * 2 * i) / 8 + Math.random() * 0.2,
                speed: 3 + Math.random() * 4
            }));

            api.start(index => ({
                from: {
                    pos: [e.clientX, e.clientY],
                    scale: 0.5,
                    opacity: 0.8
                },
                to: async next => {
                    await next({
                        pos: [
                            e.clientX + Math.cos(newParticles[index].angle) * 100,
                            e.clientY + Math.sin(newParticles[index].angle) * 100
                        ],
                        scale: 2,
                        opacity: 0
                    });
                },
                delay: index => index * 20
            }));
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <>
            {springs.map((style, i) => (
                <animated.div
                    key={i}
                    className="absolute pointer-events-none w-2 h-2 rounded-full"
                    style={{
                        x: style.pos.to((x: number) => x),
                        y: style.pos.to((y: number) => y),
                        scale: style.scale,
                        opacity: style.opacity,
                        background: resolvedTheme === 'dark' ?
                            'radial-gradient(circle, #a0f2ff, transparent)' :
                            'radial-gradient(circle, #3a6afc, transparent)',
                        boxShadow: resolvedTheme === 'dark' ?
                            '0 0 10px #a0f2ff' : '0 0 10px #3a6afc'
                    }}
                />
            ))}
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
                    bg-gradient-to-r from-blue-600 to-purple-500 dark:from-blue-400 dark:to-purple-300
                    bg-clip-text text-transparent
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
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>
                </p>

                {/* 悬浮光效 */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity
                    bg-[radial-gradient(circle_at_50%_120%,#6366f1_20%,transparent_60%)]" />
            </div>
        </footer>
    )
}