import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AlbumType, ImageType, Config, CopyrightType } from '~/types'

export type ButtonState = {
  albumAdd: boolean
  albumEdit: boolean
  album: AlbumType
  copyrightAdd: boolean
  copyrightEdit: boolean
  copyright: CopyrightType
  image: ImageType
  imageEdit: boolean
  imageViewData: ImageType
  imageView: boolean
  s3Edit: boolean
  s3Data: Config[]
  r2Edit: boolean
  r2Data: Config[]
  aListEdit: boolean
  aListData: Config[]
  MasonryView: boolean
  MasonryViewData: ImageType
  MasonryViewDataList: ImageType[]
  imageBatchDelete: boolean
  searchOpen: boolean
  loginHelp: boolean
  command: boolean
  cosEdit: boolean
  cosData: Config[]
  batchImport: boolean
  importSource: 'cos' | 'alist' | null
  importDialog: boolean
  importProgress: number
  importTotal: number
  importCurrent: number
}

export type ButtonActions = {
  setAlbumAdd: (albumAdd: boolean) => void
  setAlbumEdit: (albumEdit: boolean) => void
  setAlbumEditData: (album: AlbumType) => void
  setCopyrightAdd: (copyrightAdd: boolean) => void
  setCopyrightEdit: (copyrightEdit: boolean) => void
  setCopyrightEditData: (copyright: CopyrightType) => void
  setImageEdit: (imageEdit: boolean) => void
  setImageEditData: (image: ImageType) => void
  setImageView: (imageView: boolean) => void
  setImageViewData: (imageViewData: ImageType) => void
  setS3Edit: (s3Edit: boolean) => void
  setS3EditData: (s3Data: Config[]) => void
  setR2Edit: (r2Edit: boolean) => void
  setR2EditData: (r2Data: Config[]) => void
  setAListEdit: (aListEdit: boolean) => void
  setAListEditData: (aListData: Config[]) => void
  setMasonryView: (masonryView: boolean) => void
  setMasonryViewData: (masonryViewData: ImageType) => void
  setMasonryViewDataList: (masonryViewDataList: ImageType[]) => void
  setImageBatchDelete: (imageBatchDelete: boolean) => void
  setSearchOpen: (searchOpen: boolean) => void
  setLoginHelp: (loginHelp: boolean) => void
  setCommand: (command: boolean) => void
  setCosEdit: (cosEdit: boolean) => void
  setCosEditData: (cosData: Config[]) => void
  setBatchImport: (batchImport: boolean) => void
  setImportSource: (importSource: 'cos' | 'alist' | null) => void
  setImportDialog: (importDialog: boolean) => void
  setImportProgress: (importProgress: number) => void
  setImportTotal: (importTotal: number) => void
  setImportCurrent: (importCurrent: number) => void
}

export type ButtonStore = ButtonState & ButtonActions

const initialState: ButtonState = {
  albumAdd: false,
  albumEdit: false,
  album: {} as AlbumType,
  copyrightAdd: false,
  copyrightEdit: false,
  copyright: {} as CopyrightType,
  imageEdit: false,
  image: {} as ImageType,
  imageView: false,
  imageViewData: {} as ImageType,
  s3Edit: false,
  s3Data: [] as Config[],
  r2Edit: false,
  r2Data: [] as Config[],
  aListEdit: false,
  aListData: [] as Config[],
  MasonryView: false,
  MasonryViewData: {} as ImageType,
  MasonryViewDataList: [] as ImageType[],
  imageBatchDelete: false,
  searchOpen: false,
  loginHelp: false,
  command: false,
  cosEdit: false,
  cosData: [] as Config[],
  batchImport: false,
  importSource: null,
  importDialog: false,
  importProgress: 0,
  importTotal: 0,
  importCurrent: 0,
}

export const useButtonStore = create<ButtonState & ButtonActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAlbumAdd: (albumAdd) => set({ albumAdd }),
      setAlbumEdit: (albumEdit) => set({ albumEdit }),
      setAlbumEditData: (album) => set({ album }),
      setCopyrightAdd: (copyrightAdd) => set({ copyrightAdd }),
      setCopyrightEdit: (copyrightEdit) => set({ copyrightEdit }),
      setCopyrightEditData: (copyright) => set({ copyright }),
      setImageEdit: (imageEdit) => set({ imageEdit }),
      setImageEditData: (image) => set({ image }),
      setImageView: (imageView) => set({ imageView }),
      setImageViewData: (imageViewData) => set({ imageViewData }),
      setS3Edit: (s3Edit) => set({ s3Edit }),
      setS3EditData: (s3Data) => set({ s3Data }),
      setR2Edit: (r2Edit) => set({ r2Edit }),
      setR2EditData: (r2Data) => set({ r2Data }),
      setAListEdit: (aListEdit) => set({ aListEdit }),
      setAListEditData: (aListData) => set({ aListData }),
      setMasonryView: (masonryView) => set({ MasonryView: masonryView }),
      setMasonryViewData: (masonryViewData) => set({ MasonryViewData: masonryViewData }),
      setMasonryViewDataList: (masonryViewDataList) => set({ MasonryViewDataList: masonryViewDataList }),
      setImageBatchDelete: (imageBatchDelete) => set({ imageBatchDelete }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setLoginHelp: (loginHelp) => set({ loginHelp }),
      setCommand: (command) => set({ command }),
      setCosEdit: (cosEdit) => set({ cosEdit }),
      setCosEditData: (cosData) => set({ cosData }),
      setBatchImport: (batchImport) => set({ batchImport }),
      setImportSource: (importSource) => set({ importSource }),
      setImportDialog: (importDialog) => set({ importDialog }),
      setImportProgress: (importProgress) => set({ importProgress }),
      setImportTotal: (importTotal) => set({ importTotal }),
      setImportCurrent: (importCurrent) => set({ importCurrent }),
    }),
    {
      name: 'button-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          return JSON.parse(str)
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)