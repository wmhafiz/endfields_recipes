import Image from 'next/image'

interface ImageOrPlaceholderProps {
  imagePath?: string
  alt: string
  width: number
  height: number
  className?: string
}

/**
 * Normalize image path/URL for use in Next.js Image component.
 * Handles both legacy local paths and media URLs.
 */
function normalizeImagePath(imagePath: string): string {
  // If it's already a full URL (starts with http/https), use as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // For local paths, ensure leading slash
  if (imagePath.startsWith('/')) return imagePath
  if (imagePath.startsWith('./')) return imagePath.replace('./', '/')
  return `/${imagePath}`
}

export function ImageOrPlaceholder({
  imagePath,
  alt,
  width,
  height,
  className,
}: ImageOrPlaceholderProps) {
  if (imagePath) {
    const normalizedPath = normalizeImagePath(imagePath)
    const isExternal = normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')

    return (
      <Image
        src={normalizedPath}
        alt={alt}
        width={width}
        height={height}
        className={className}
        {...(isExternal && { unoptimized: true })}
      />
    )
  }

  // Render placeholder box with name
  return (
    <div className={`image-placeholder ${className || ''}`} style={{ width, height }} title={alt}>
      <span className="image-placeholder-text">{alt}</span>
    </div>
  )
}
