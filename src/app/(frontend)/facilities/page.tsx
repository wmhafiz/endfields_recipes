'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import recipesData from '@/data/recipes.json'
import { FacilityCard } from '../components/FacilityCard'
import type { RecipesData } from '../types/recipes'

const ALL_CATEGORIES = 'All'

export default function FacilitiesPage() {
  const data = recipesData as RecipesData
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES)

  // Derive unique facility categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    for (const facility of data.facilities) {
      if (facility.category) {
        categorySet.add(facility.category)
      }
    }
    return [ALL_CATEGORIES, ...Array.from(categorySet).sort()]
  }, [data.facilities])

  // Filter facilities by category
  const filteredFacilities = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) {
      return data.facilities
    }
    return data.facilities.filter((f) => f.category === selectedCategory)
  }, [data.facilities, selectedCategory])

  // Create lookup maps
  const itemsByName = useMemo(() => {
    return new Map(data.items.map((i) => [i.name, i]))
  }, [data.items])

  // Get recipes for each facility
  const recipesByFacility = useMemo(() => {
    const map = new Map<string, typeof data.recipes>()
    for (const recipe of data.recipes) {
      const existing = map.get(recipe.facility) || []
      existing.push(recipe)
      map.set(recipe.facility, existing)
    }
    return map
  }, [data.recipes])

  return (
    <div className="facilities-container">
      <header className="facilities-header">
        <div className="header-content">
          <Link href="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Items
          </Link>
          <h1 className="title">Facilities</h1>
          <p className="subtitle">
            {filteredFacilities.length} of {data.facilities.length} facilities
          </p>
        </div>

        <div className="controls">
          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="facilities-grid">
        {filteredFacilities.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            recipes={recipesByFacility.get(facility.name) || []}
            itemsByName={itemsByName}
          />
        ))}
      </main>

      {filteredFacilities.length === 0 && (
        <div className="no-results">
          <p>No facilities found in this category.</p>
        </div>
      )}
    </div>
  )
}
