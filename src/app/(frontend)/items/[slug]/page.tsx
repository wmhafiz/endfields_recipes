import { notFound } from 'next/navigation'

import { getAllData } from '../../data/payload'
import { ProductionChain } from '../../components/ProductionChain'
import { ItemDetailSidebar } from '../../components/ItemDetailSidebar'
import type { EnrichedItem } from '../../types/recipes'

interface ItemPageProps {
  params: Promise<{ slug: string }>
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params
  const data = await getAllData()

  // Build lookup maps
  const itemsBySlug = new Map<string, EnrichedItem>()
  const itemsById = new Map<string, EnrichedItem>()
  for (const item of data.items) {
    itemsBySlug.set(item.slug, item)
    itemsById.set(item.itemId, item)
  }

  // Find the item by slug
  const item = itemsBySlug.get(slug)

  if (!item) {
    notFound()
  }

  // Find recipes that produce this item (by itemId)
  const producedByRecipes = data.recipes.filter((r) =>
    r.outputs.some((o) => o.itemId === item.itemId),
  )

  // Find recipes that use this item as input
  const usedInRecipes = data.recipes.filter((r) =>
    r.ingredients.some((i) => i.itemId === item.itemId),
  )

  // Check if this is a raw material
  const isRawMaterial = item.isRawMaterial

  return (
    <div className="item-detail-fullscreen">
      {/* Full-screen production chain with bottom controls */}
      <div className="item-detail-canvas">
        {isRawMaterial ? (
          <div className="raw-material-fullscreen">
            <div className="raw-material-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2>{item.itemName}</h2>
            <p>This is a raw material with no crafting recipe.</p>
          </div>
        ) : (
          <ProductionChain itemSlug={item.slug} data={data} item={item} />
        )}
      </div>

      {/* Right sidebar with Produced By and Used In */}
      <ItemDetailSidebar
        item={item}
        producedByRecipes={producedByRecipes}
        usedInRecipes={usedInRecipes}
        itemsById={itemsById}
      />
    </div>
  )
}
