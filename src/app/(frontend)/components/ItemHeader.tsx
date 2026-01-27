import Image from 'next/image'
import Link from 'next/link'

interface ItemHeaderProps {
  id: string
  name: string
  imagePath: string
}

function getImagePath(localPath: string): string {
  if (localPath.startsWith('/')) return localPath
  if (localPath.startsWith('./')) return localPath.replace('./', '/')
  return `/${localPath}`
}

export function ItemHeader({ name, imagePath }: ItemHeaderProps) {
  return (
    <header className="item-detail-header">
      <Link href="/" className="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Items
      </Link>

      <div className="item-detail-title">
        <div className="item-detail-image">
          <Image
            src={getImagePath(imagePath)}
            alt={name}
            width={80}
            height={80}
            className="item-image"
          />
        </div>
        <h1 className="item-detail-name">{name}</h1>
      </div>
    </header>
  )
}
