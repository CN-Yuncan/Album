import { create } from 'zustand'

export interface ButtonState {
    isDisabled: boolean
    isLoading: boolean
}

export interface ButtonActions {
    setDisabled: (isDisabled: boolean) => void
    setLoading: (isLoading: boolean) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const useButtonStore = create<ButtonStore>((set) => ({
    isDisabled: false,
    isLoading: false,
    setDisabled: (isDisabled) => set({ isDisabled }),
    setLoading: (isLoading) => set({ isLoading }),
})) 