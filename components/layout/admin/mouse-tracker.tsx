'use client';

import { useEffect, useRef } from 'react';
import { useMouseStore } from '~/components/SiteEssentials';

export function MouseTracker() {
    const update = useMouseStore(state => state.update);
    const lastPosRef = useRef<[number, number]>([0, 0]);
    const lastTimeRef = useRef<number>(Date.now());
    const velocityRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            lastPosRef.current = [e.clientX, e.clientY];
        };
        
        const updateAnimation = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTimeRef.current;
            
            if (deltaTime > 0) {
                const [currentX, currentY] = lastPosRef.current;
                const previousPos = useMouseStore.getState().position;
                const dx = currentX - previousPos[0];
                const dy = currentY - previousPos[1];
                
                // 只有当鼠标移动时才计算速度
                if (dx !== 0 || dy !== 0) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const currentVelocity = distance / Math.max(deltaTime, 16); // 确保不会除以很小的数
                    
                    // 平滑速度变化
                    velocityRef.current = velocityRef.current * 0.8 + currentVelocity * 0.2;
                    
                    // 更新MouseStore
                    update([currentX, currentY], velocityRef.current);
                } else {
                    // 鼠标静止时，速度逐渐衰减
                    if (velocityRef.current > 0.01) {
                        velocityRef.current *= 0.95;
                        update(previousPos, velocityRef.current);
                    }
                }
                
                lastTimeRef.current = currentTime;
            }
            
            // 使用requestAnimationFrame以匹配显示刷新率
            rafRef.current = requestAnimationFrame(updateAnimation);
        };
        
        // 添加鼠标移动事件监听器
        window.addEventListener('mousemove', handleMouseMove);
        
        // 开始动画帧
        rafRef.current = requestAnimationFrame(updateAnimation);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [update]);
    
    return null; // 这个组件不渲染任何内容
} 