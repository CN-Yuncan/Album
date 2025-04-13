// components/SiteEssentials.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { create } from 'zustand';
import { useWebGLFluid, useGPUParticleSystem } from '@/lib/webgl-engine';

// 全局状态存储（MCP协议共享）
interface SystemState {
    mouse: [number, number];
    velocity: number;
    backgroundMatrix: number[];
    updateSystem: (state: Partial<SystemState>) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
    mouse: [0, 0],
    velocity: 0,
    backgroundMatrix: [],
    updateSystem: (state) => set(state)
}));

// DynamicBackground 组件
export function DynamicBackground() {
    const { resolvedTheme } = useTheme();
    const { mouse, velocity, backgroundMatrix } = useSystemStore();
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);

    // WebGL初始化
    useEffect(() => {
        const canvas = bgCanvasRef.current!;
        const gl = canvas.getContext('webgl2', { alpha: true })!;

        // 初始化背景渲染管线
        const initBackgroundPipeline = async () => {
            const { initBaseLayer, renderBackground } = await import('@/lib/webgl-background');
            const pipeline = await initBaseLayer(gl, {
                theme: resolvedTheme,
                dynamicTexture: resolvedTheme === 'dark'
                    ? '/textures/nebula.webp'
                    : '/textures/clouds.webp'
            });

            // MCP矩阵更新回调
            const updateMatrix = (matrix: number[]) => {
                pipeline.updateUniforms('u_bgMatrix', matrix);
                useSystemStore.getState().updateSystem({ backgroundMatrix: matrix });
            };

            // 主渲染循环
            const render = () => {
                renderBackground(pipeline, {
                    mousePosition: mouse,
                    velocity: velocity * 0.005,
                    time: performance.now() / 1000
                });
                requestAnimationFrame(render);
            };
            render();
        };

        initBackgroundPipeline();
    }, [resolvedTheme]);

    return (
        <canvas
            ref={bgCanvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
                filter: `blur(${Math.min(12 + velocity * 0.2, 24)}px)`,
                transform: `scale(${1 + velocity * 0.0005})`
            }}
        />
    );
}

// MagicCursor 组件（WebGL量子光标）
export function MagicCursor() {
    const cursorRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();
    const { mouse, velocity, backgroundMatrix } = useSystemStore();
    const { initFluidEngine } = useWebGLFluid();

    // 流体引擎初始化
    useEffect(() => {
        const canvas = cursorRef.current!;
        const gl = canvas.getContext('webgl2', { alpha: true })!;

        const { init, update } = initFluidEngine(gl, {
            pressure: 0.28,
            colorScheme: theme === 'dark'
                ? [[0.9, 0.92, 1.0], [0.7, 0.8, 1.0]]
                : [[0.1, 0.15, 0.3], [0.2, 0.25, 0.4]]
        });

        // 同步背景矩阵
        init(backgroundMatrix);

        // 运动更新
        const updateCursor = () => {
            update(mouse, velocity);
            requestAnimationFrame(updateCursor);
        };
        updateCursor();
    }, [theme, backgroundMatrix]);

    return (
        <canvas
            ref={cursorRef}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{
                mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
                filter: `url(#quantum-distortion)`
            }}
        />
    );
}

// ClickEffects 组件（时空涟漪）
export function ClickEffects() {
    const { resolvedTheme } = useTheme();
    const [ripples, setRipples] = useState<Array<RippleProfile>>([]);
    const { initParticles, updateParticles } = useGPUParticleSystem();

    // 粒子系统初始化
    useEffect(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2', { alpha: true })!;

        initParticles(gl, {
            capacity: 1e4,
            texture: resolvedTheme === 'dark'
                ? '/textures/sparkle.webp'
                : '/textures/waterdrop.webp'
        });
    }, [resolvedTheme]);

    // 点击事件处理
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newRipple = createRippleProfile(e);
            setRipples(prev => [...prev, newRipple]);

            // MCP协议传播
            useSystemStore.getState().updateSystem({
                velocity: Math.min(e.movementX + e.movementY, 100)
            });
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // 涟漪动画
    useAnimationFrame(() => {
        setRipples(current => current.map(ripple => {
            const updated = updateRipple(ripple);
            updateParticles(updated.particles);
            return updated;
        }).filter(r => r.phase < 1));
    });

    return null;
}

// 辅助函数
const createRippleProfile = (e: MouseEvent): RippleProfile => ({
    position: [e.clientX, e.clientY],
    phase: 0,
    particles: generateWaveform(e),
    color: chroma.scale(['#6366f1', '#a855f7']).mode('lch').gl()
});

const updateRipple = (ripple: RippleProfile) => ({
    ...ripple,
    phase: ripple.phase + 0.02,
    particles: applyWaveCollapse(ripple.particles)
});

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