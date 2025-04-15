import type { ImageType } from '~/types'

interface ImageCardProps {
  image: ImageType
}

export default function ImageCard({ image }: ImageCardProps) {
  return (
    <div className="image-container group">
      <img
        src={image.url}
        alt={image.title}
        className="w-full h-full object-cover image-hover-effect"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="text-lg font-semibold">{image.title}</h3>
          {image.detail && (
            <p className="text-sm mt-1">{image.detail}</p>
          )}
        </div>
      </div>
    </div>
  )
} 