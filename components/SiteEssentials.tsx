// components/SiteEssentials.tsx
'use client'; // 必须作为文件的第一行

import { useSpring, animated } from '@react-spring/web';
import { useMotionValue, useTransform, motion, useVelocity } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { create } from 'zustand';

interface MouseStore {
    position: [number, number];
    pressure: number;
    update: (pos: [number, number], pressure?: number) => void;
}

export const useMouseStore = create<MouseStore>((set) => ({
    position: [0, 0],
    pressure: 0,
    update: (pos, pressure = 0) => set({ position: pos, pressure })
}));

// 修复背景组件
export function DynamicBackground() {
    const { resolvedTheme } = useTheme();
    const { position: [x, y], pressure } = useMouseStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgUrl = resolvedTheme === 'dark'
        ? 'https://apir.yuncan.xyz/dark.php'
        : 'https://apir.yuncan.xyz/light.php';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let frame: number;
        const particles = Array.from({ length: 200 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: 0,
            vy: 0,
            life: 1
        }));

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                const dx = x - p.x;
                const dy = y - p.y;
                const dist = Math.hypot(dx, dy);
                const force = Math.min(5000 / (dist * dist + 1), 50);

                p.vx += (dx / dist) * force * 0.01 + (Math.random() - 0.5) * 0.2;
                p.vy += (dy / dist) * force * 0.01 + (Math.random() - 0.5) * 0.2;

                p.vx *= 0.95;
                p.vy *= 0.95;

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x += canvas.width;
                if (p.x > canvas.width) p.x -= canvas.width;
                if (p.y < 0) p.y += canvas.height;
                if (p.y > canvas.height) p.y -= canvas.height;

                ctx.beginPath();
                ctx.fillStyle = resolvedTheme === 'dark'
                    ? `hsla(220, 50%, 70%, ${p.life})`
                    : `hsla(40, 80%, 50%, ${p.life})`;
                ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
                ctx.fill();
            });

            frame = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(frame);
    }, [resolvedTheme, x, y]);

    return (
        <div className="fixed inset-0 z-0">
            {/* 添加背景图片层 */}
            <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${bgUrl})`,
                    opacity: 0.15,
                    filter: 'saturate(140%) contrast(105%)'
                }}
            />
            {/* 粒子画布 */}
            <motion.canvas
                ref={canvasRef}
                className="absolute inset-0 opacity-50 mix-blend-soft-light"
                style={{ scale: 1 + pressure * 0.2 }}
            />
        </div>
    );
}

// 修复光标组件
export function MagicCursor() {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);

    // 初始化位置为屏幕中心
    const posX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth/2 : 0);
    const posY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight/2 : 0);
    const vx = useVelocity(posX);
    const vy = useVelocity(posY);

    const scale = useTransform(() => 1 + Math.min(Math.hypot(vx.get(), vy.get()) / 500, 0.6));
    const rotate = useTransform(() => Math.atan2(vy.get(), vx.get()) * 180 / Math.PI);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            posX.set(e.clientX);
            posY.set(e.clientY);
            useMouseStore.getState().update([e.clientX, e.clientY]);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <motion.div
            ref={cursorRef}
            className="pointer-events-none fixed z-50 w-6 h-6 rounded-full
                backdrop-blur-xl border-2 border-opacity-50 transition-transform
                -translate-x-1/2 -translate-y-1/2" // 添加居中偏移
            style={{
                x: posX,
                y: posY,
                scale,
                rotate,
                background: theme === 'dark'
                    ? 'radial-gradient(#a0d8ff55, transparent 70%)'
                    : 'radial-gradient(#ffd70055, transparent 70%)',
                borderColor: theme === 'dark' ? '#a0d8ff' : '#ffd700',
                left: 0,  // 确保定位基准正确
                top: 0
            }}
        />
    );
}

// 全息涟漪效果
export function ClickEffects() {
    const { resolvedTheme } = useTheme();
    const { position: [x, y] } = useMouseStore();
    const circles = useRef<HTMLDivElement[]>([]);

    const createRipple = () => {
        const circle = circles.current.find(c => !c.style.opacity);
        if (!circle) return;

        circle.style.left = `${x - 50}px`;
        circle.style.top = `${y - 50}px`;
        circle.style.opacity = '1';
        circle.style.transform = 'scale(0)';

        const animation = circle.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
        });

        animation.onfinish = () => {
            circle.style.opacity = '0';
        };
    };

    // 修复4：更新点击事件处理
    useEffect(() => {
        const handleClick = () => {
            createRipple();
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-40">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    ref={el => circles.current[i] = el!}
                    className="absolute w-24 h-24 rounded-full border
                        opacity-0 transition-opacity"
                    style={{
                        borderColor: resolvedTheme === 'dark'
                            ? `hsl(220, 80%, ${70 - i*15}%)`
                            : `hsl(40, 100%, ${50 - i*10}%)`,
                        filter: 'blur(10px)',
                        margin: '-24px'
                    }}
                />
            ))}
        </div>
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
                <p className="text-sm font-medium flex items-center"
                   style={{
                       backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)',
                       WebkitBackgroundClip: 'text',
                       backgroundClip: 'text',
                       color: 'transparent'
                   }}>
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