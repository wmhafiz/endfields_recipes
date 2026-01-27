import React from 'react'

import { ItemsDisplay } from './components/ItemsDisplay'
import recipesData from '@/data/recipes.json'
import './styles.css'

export default function HomePage() {
  return <ItemsDisplay data={recipesData} />
}
