'use client'

import { useRouter } from 'next/navigation'
import { ImageOrPlaceholder } from './ImageOrPlaceholder'

interface ItemHeaderProps {
  id: string
  name: string
  imagePath?: string
}

export function ItemHeader({ name, imagePath }: ItemHeaderProps) {
  const router = useRouter()

  return (
    <header className="item-detail-header">
      <button onClick={() => router.back()} className="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Items
      </button>

      <div className="item-detail-title">
        <div className="item-detail-image">
          <ImageOrPlaceholder
            imagePath={imagePath}
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
