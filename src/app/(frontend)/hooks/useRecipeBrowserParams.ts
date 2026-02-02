'use client'

import { parseAsString, parseAsStringLiteral, createParser, useQueryStates } from 'nuqs'
import type { RecipeSortField, SortDirection, ViewMode } from '../types/recipes'

// Define valid options for literal parsers
const typeOptions = ['all', 'machine', 'manual', 'hub'] as const
const rawMaterialOptions = ['all', 'yes', 'no'] as const
const sortFieldOptions = ['default', 'name', 'craftTime', 'type', 'category'] as const
const sortDirectionOptions = ['asc', 'desc'] as const
const viewModeOptions = ['grid', 'list'] as const

// Custom parser for rarity that accepts number or 'all'
const parseAsRarity = createParser({
  parse: (value) => {
    if (value === 'all' || value === '') return 'all'
    const num = parseInt(value, 10)
    return isNaN(num) ? 'all' : num.toString()
  },
  serialize: (value) => {
    return value === 'all' ? '' : value
  },
})

/**
 * URL parameter parsers for the recipe browser
 * These define how each filter/sort/search parameter is serialized to/from the URL
 */
export const recipeBrowserParsers = {
  // Search query
  q: parseAsString.withDefault(''),

  // Recipe type filter
  type: parseAsStringLiteral(typeOptions).withDefault('machine'),

  // Category filter (free-form string since categories are dynamic)
  cat: parseAsString.withDefault('Consumable'),

  // Machine filter (free-form string since machines are dynamic)
  machine: parseAsString.withDefault('all'),

  // Rarity filter (string: 'all' or a number like '4')
  rarity: parseAsRarity.withDefault('all'),

  // Uses raw material filter
  raw: parseAsStringLiteral(rawMaterialOptions).withDefault('all'),

  // Sort field
  sort: parseAsStringLiteral(sortFieldOptions).withDefault('name'),

  // Sort direction
  dir: parseAsStringLiteral(sortDirectionOptions).withDefault('asc'),

  // View mode
  view: parseAsStringLiteral(viewModeOptions).withDefault('grid'),
}

// Type for the parsed URL state
export interface RecipeBrowserUrlState {
  q: string
  type: (typeof typeOptions)[number]
  cat: string
  machine: string
  rarity: string
  raw: (typeof rawMaterialOptions)[number]
  sort: RecipeSortField
  dir: SortDirection
  view: ViewMode
}

// Default values (used for clearing filters)
export const recipeBrowserDefaults: RecipeBrowserUrlState = {
  q: '',
  type: 'machine',
  cat: 'Consumable',
  machine: 'all',
  rarity: 'all',
  raw: 'all',
  sort: 'name',
  dir: 'asc',
  view: 'grid',
}

/**
 * Hook to manage recipe browser URL state
 * Returns [state, setState] tuple similar to useState
 */
export function useRecipeBrowserParams() {
  return useQueryStates(recipeBrowserParsers, {
    history: 'replace', // Don't clutter browser history with every filter change
    shallow: false, // Allow Next.js to handle the navigation
  })
}
