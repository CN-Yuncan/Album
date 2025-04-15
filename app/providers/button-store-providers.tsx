// app/providers/button-store-providers.tsx
'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Config } from '~/types'

import { type ButtonStore, createButtonStore, initButtonStore } from '~/stores/button-stores'

export const ButtonStoreContext = createContext<StoreApi<ButtonStore> | null>(
    null,
)

export interface ButtonStoreProviderProps {
    children: ReactNode
}

export const ButtonStoreProvider = ({
                                        children,
                                    }: ButtonStoreProviderProps) => {
    const storeRef = useRef<StoreApi<ButtonStore>>()
    if (!storeRef.current) {
        storeRef.current = createButtonStore(initButtonStore())
    }

    return (
        <ButtonStoreContext.Provider value={storeRef.current}>
            {children}
        </ButtonStoreContext.Provider>
    )
}

interface ButtonStore {
  s3Edit: boolean
  setS3Edit: (s3Edit: boolean) => void
  s3Data: Config[]
  setS3EditData: (s3Data: Config[]) => void
  r2Edit: boolean
  setR2Edit: (r2Edit: boolean) => void
  r2Data: Config[]
  setR2EditData: (r2Data: Config[]) => void
  cosEdit: boolean
  setCosEdit: (cosEdit: boolean) => void
  cosData: Config[]
  setCosEditData: (cosData: Config[]) => void
  alistEdit: boolean
  setAlistEdit: (alistEdit: boolean) => void
  alistData: Config[]
  setAlistEditData: (alistData: Config[]) => void
}

export const useButtonStore = create<ButtonStore>()(
  persist(
    (set) => ({
      s3Edit: false,
      setS3Edit: (s3Edit) => set({ s3Edit }),
      s3Data: [],
      setS3EditData: (s3Data) => set({ s3Data }),
      r2Edit: false,
      setR2Edit: (r2Edit) => set({ r2Edit }),
      r2Data: [],
      setR2EditData: (r2Data) => set({ r2Data }),
      cosEdit: false,
      setCosEdit: (cosEdit) => set({ cosEdit }),
      cosData: [],
      setCosEditData: (cosData) => set({ cosData }),
      alistEdit: false,
      setAlistEdit: (alistEdit) => set({ alistEdit }),
      alistData: [],
      setAlistEditData: (alistData) => set({ alistData }),
    }),
    {
      name: 'pic-impact-button-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
