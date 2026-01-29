'use client'

import React, { useMemo, useState } from 'react'

import type { EnrichedDbData, EnrichedItem } from '../../types/recipes'
import { ImageOrPlaceholder } from '../ImageOrPlaceholder'
import { PLANNER_ITEM_DRAG_MIME } from './dnd'

type ItemSortField = 'name' | 'category' | 'rarity' | 'sortId'
type ItemTypeFilter = 'all' | 'raw' | 'crafted'

interface ItemSidebarProps {
  data: EnrichedDbData
  inspectedItemId: string | null
  onInspectItemId: (itemId: string) => void
}

export function ItemSidebar({ data, inspectedItemId, onInspectItemId }: ItemSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>('all')
  const [rarityFilter, setRarityFilter] = useState<string>('')
  const [sortField, setSortField] = useState<ItemSortField>('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Extract unique categories from items
  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const item of data.items) {
      if (item.category) cats.add(item.category)
    }
    return Array.from(cats).sort()
  }, [data.items])

  // Extract unique rarities from items
  const rarities = useMemo(() => {
    const rars = new Set<number>()
    for (const item of data.items) {
      if (item.rarity !== undefined) rars.add(item.rarity)
    }
    return Array.from(rars).sort((a, b) => a - b)
  }, [data.items])

  const filteredAndSortedItems = useMemo(() => {
    let items = data.items

    // Text search
    const q = itemSearch.trim().toLowerCase()
    if (q) {
      items = items.filter((item: EnrichedItem) => {
        return (
          item.itemName.toLowerCase().includes(q) ||
          item.itemId.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q)
        )
      })
    }

    // Category filter
    if (categoryFilter) {
      items = items.filter((item) => item.category === categoryFilter)
    }

    // Type filter (raw/crafted)
    if (typeFilter === 'raw') {
      items = items.filter((item) => item.isRawMaterial)
    } else if (typeFilter === 'crafted') {
      items = items.filter((item) => !item.isRawMaterial)
    }

    // Rarity filter
    if (rarityFilter !== '') {
      const rarityNum = Number(rarityFilter)
      items = items.filter((item) => item.rarity === rarityNum)
    }

    // Sort
    const sorted = [...items].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.itemName.localeCompare(b.itemName)
          break
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '')
          if (cmp === 0) cmp = a.itemName.localeCompare(b.itemName)
          break
        case 'rarity':
          cmp = (a.rarity ?? 0) - (b.rarity ?? 0)
          if (cmp === 0) cmp = a.itemName.localeCompare(b.itemName)
          break
        case 'sortId':
          cmp = (a.sortId ?? 0) - (b.sortId ?? 0)
          if (cmp === 0) cmp = a.itemName.localeCompare(b.itemName)
          break
      }
      return sortAsc ? cmp : -cmp
    })

    return sorted
  }, [data.items, itemSearch, categoryFilter, typeFilter, rarityFilter, sortField, sortAsc])

  if (isCollapsed) {
    return (
      <div className="planner-sidebar-collapsed">
        <button
          type="button"
          className="planner-sidebar-collapsed-btn"
          aria-label="Expand item sidebar"
          onClick={() => setIsCollapsed(false)}
          title="Items"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
      </div>
    )
  }

  const handleSortChange = (field: ItemSortField) => {
    if (sortField === field) {
      setSortAsc((v) => !v)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  return (
    <aside className="planner-sidebar">
      <div className="planner-sidebar-header">
        <div className="planner-sidebar-header-title">Items</div>
        <button
          type="button"
          className="planner-icon-btn"
          aria-label="Collapse item sidebar"
          onClick={() => setIsCollapsed(true)}
        >
          «
        </button>
      </div>

      <div className="planner-sidebar-controls">
        <input
          type="text"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder="Search items..."
          className="planner-input"
          aria-label="Search items"
        />

        <div className="planner-sidebar-filters">
          <select
            className="planner-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="planner-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ItemTypeFilter)}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="raw">Raw materials</option>
            <option value="crafted">Crafted items</option>
          </select>

          <select
            className="planner-filter-select"
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            aria-label="Filter by rarity"
          >
            <option value="">All rarities</option>
            {rarities.map((r) => (
              <option key={r} value={r}>
                Rarity {r}
              </option>
            ))}
          </select>
        </div>

        <div className="planner-sidebar-sort">
          <span className="planner-sort-label">Sort:</span>
          <button
            type="button"
            className={`planner-sort-btn ${sortField === 'name' ? 'active' : ''}`}
            onClick={() => handleSortChange('name')}
            aria-label="Sort by name"
          >
            Name {sortField === 'name' && (sortAsc ? '↑' : '↓')}
          </button>
          <button
            type="button"
            className={`planner-sort-btn ${sortField === 'category' ? 'active' : ''}`}
            onClick={() => handleSortChange('category')}
            aria-label="Sort by category"
          >
            Cat {sortField === 'category' && (sortAsc ? '↑' : '↓')}
          </button>
          <button
            type="button"
            className={`planner-sort-btn ${sortField === 'rarity' ? 'active' : ''}`}
            onClick={() => handleSortChange('rarity')}
            aria-label="Sort by rarity"
          >
            Rarity {sortField === 'rarity' && (sortAsc ? '↑' : '↓')}
          </button>
        </div>

        <div className="planner-sidebar-count">
          {filteredAndSortedItems.length} / {data.items.length} items
        </div>
      </div>

      <div className="planner-sidebar-list" role="list">
        {filteredAndSortedItems.map((item) => {
          const isSelected = item.itemId === inspectedItemId
          return (
            <button
              key={item.itemId}
              type="button"
              role="listitem"
              className={`planner-item-row ${isSelected ? 'selected' : ''}`}
              onClick={() => onInspectItemId(item.itemId)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(PLANNER_ITEM_DRAG_MIME, item.itemId)
                e.dataTransfer.setData('text/plain', item.itemId)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              aria-label={`Inspect ${item.itemName}`}
            >
              <div className="planner-item-row-image">
                <ImageOrPlaceholder
                  imagePath={item.imageUrl}
                  alt={item.itemName}
                  width={28}
                  height={28}
                  className="planner-item-row-img"
                />
              </div>
              <div className="planner-item-row-text">
                <div className="planner-item-row-name">{item.itemName}</div>
              </div>
            </button>
          )
        })}

        {filteredAndSortedItems.length === 0 && (
          <div className="planner-empty-hint">No items match your filters.</div>
        )}
      </div>
    </aside>
  )
}
