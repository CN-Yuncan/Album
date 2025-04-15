// app/providers/button-store-providers.tsx
'use client'

import { ReactNode, createContext, useRef, useContext } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { useButtonStore } from '~/stores/button-stores'
import type { ButtonStore } from '~/stores/button-stores'

export const ButtonStoreContext = createContext<StoreApi<ButtonStore> | null>(null)

export interface ButtonStoreProviderProps {
    children: ReactNode
}

export function ButtonStoreProvider({ children }: { children: ReactNode }) {
    const storeRef = useRef<ButtonStore>()
    
    if (!storeRef.current) {
        storeRef.current = useButtonStore(state => state)
    }

    return children
}

export const useButtonStoreContext = <T,>(
    selector: (store: ButtonStore) => T,
): T => {
    const buttonStoreContext = useContext(ButtonStoreContext)

    if (!buttonStoreContext) {
        throw new Error(`useButtonStoreContext must be use within ButtonStoreProvider`)
    }

    return useStore(buttonStoreContext, selector)
}
