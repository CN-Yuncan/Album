// app/providers/button-store-providers.tsx
'use client';

import { create } from 'zustand'
import { createContext, useContext, useRef } from 'react'

// 1. 创建独立的状态类型
type ButtonState = {
  activeType: 'default' | 'important'
  setActiveType: (type: 'default' | 'important') => void
}

// 2. 创建Zustand store
const createButtonStore = () =>
    create<ButtonState>((set) => ({
      activeType: 'default',
      setActiveType: (type) => set({ activeType: type }),
    }))

// 3. 创建React Context
const ButtonStoreContext = createContext<ReturnType<typeof createButtonStore> | null>(null)

// 4. 提供上下文组件
export function ButtonStoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createButtonStore>>()
  if (!storeRef.current) {
    storeRef.current = createButtonStore()
  }
  return (
      <ButtonStoreContext.Provider value={storeRef.current}>
        {children}
      </ButtonStoreContext.Provider>
  )
}

// 5. 自定义hook（修复命名冲突）
export const useButtonStore = <T,>(selector: (state: ButtonState) => T) => {
  const store = useContext(ButtonStoreContext)
  if (!store) throw new Error('Missing ButtonStoreProvider')
  return store(selector)
}