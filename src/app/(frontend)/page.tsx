import React from 'react'

import { RecipeBrowser } from './components/RecipeBrowser'
import dbData from '@/data/db.json'
import type { EnrichedDbData } from './types/recipes'
import './styles.css'

export default function HomePage() {
  return <RecipeBrowser data={dbData as EnrichedDbData} />
}
