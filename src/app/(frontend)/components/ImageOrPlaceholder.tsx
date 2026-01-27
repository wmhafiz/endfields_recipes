import Image from 'next/image'

interface ImageOrPlaceholderProps {
  imagePath?: string
  alt: string
  width: number
  height: number
  className?: string
}

function getImagePath(localPath: string): string {
  if (localPath.startsWith('/')) return localPath
  if (localPath.startsWith('./')) return localPath.replace('./', '/')
  return `/${localPath}`
}

export function ImageOrPlaceholder({
  imagePath,
  alt,
  width,
  height,
  className,
}: ImageOrPlaceholderProps) {
  if (imagePath) {
    return (
      <Image
        src={getImagePath(imagePath)}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    )
  }

  // Render placeholder box with name
  return (
    <div
      className={`image-placeholder ${className || ''}`}
      style={{ width, height }}
      title={alt}
    >
      <span className="image-placeholder-text">{alt}</span>
    </div>
  )
}
