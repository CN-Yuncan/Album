export type Config = {
  id: string
  config_key: string
  config_value: string
  created_at: Date
  updated_at: Date
}

export type ImageType = {
  id: string
  userId: string
  key: string
  url: string
  source: string
  title?: string
  preview_url?: string
  video_url?: string
  exif?: any
  labels?: string[]
  width?: number
  height?: number
  detail?: string
  lat?: string
  lon?: string
  type?: string
  show?: number
  sort?: number
  del?: number
  show_on_mainpage?: boolean
  createdAt: Date
  updatedAt: Date
}

export type AlbumType = {
  id: string
  userId: string
  name: string
  description?: string
  cover?: string
  image_sorting?: string
  createdAt: Date
  updatedAt: Date
}

export type CopyrightType = {
  id: string
  userId: string
  name: string
  description?: string
  url?: string
  createdAt: Date
  updatedAt: Date
} 