'use client';

import { motion, useTransform, MotionValue, useSpring } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useMouseStore } from '~/components/SiteEssentials';
import { useEffect, useState } from 'react';

export function AdminBackground() {
    const { resolvedTheme } = useTheme();
    const { position, velocity } = useMouseStore();
    // 创建MotionValues用于跟踪鼠标位置
    const [mouseX] = useState(() => new MotionValue(0));
    const [mouseY] = useState(() => new MotionValue(0));
    // 使用指定的背景图片
    const bgUrl = 'https://pic.rmb.bdstatic.com/bjh/ebe942a9de49856f389c65f25a338335.png';
    const [windowSize, setWindowSize] = useState<[number, number]>([1, 1]);

    // 更新鼠标位置的MotionValue
    useEffect(() => {
        mouseX.set(position[0]);
        mouseY.set(position[1]);
    }, [position, mouseX, mouseY]);

    // 窗口大小变化时更新
    useEffect(() => {
        const updateSize = () => {
            setWindowSize([window.innerWidth, window.innerHeight]);
        };
        
        // 初始化
        updateSize();
        
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // 创建平滑的背景偏移量
    const offsetX = useTransform(mouseX, (x) => {
        return (x / windowSize[0] - 0.5) * 10;
    });
    
    const offsetY = useTransform(mouseY, (y) => {
        return (y / windowSize[1] - 0.5) * 10;
    });

    // 平滑的模糊效果
    const blurValue = useTransform(() => Math.min(8 + velocity * 0.3, 12));
    const springBlur = useSpring(blurValue, { damping: 20, stiffness: 200 });
    
    // 平滑的缩放效果
    const scaleValue = useTransform(() => 1 + Math.min(velocity * 0.001, 0.05));
    const springScale = useSpring(scaleValue, { damping: 25, stiffness: 150 });

    // 根据主题设置蒙版颜色
    const overlayBackground = resolvedTheme === 'dark' 
        ? 'rgba(10, 10, 20, 0.65)' 
        : 'rgba(255, 255, 255, 0.4)';

    return (
        <motion.div
            className="fixed inset-0 z-[-1] overflow-hidden"
            style={{
                backgroundImage: `url(${bgUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                opacity: 0.8,
                filter: 'saturate(110%) contrast(105%)',
                x: offsetX,
                y: offsetY,
                scale: springScale,
            }}
        >
            <motion.div
                className="absolute inset-0"
                style={{
                    backdropFilter: `blur(${springBlur}px)`,
                    background: overlayBackground
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        </motion.div>
    );
} 