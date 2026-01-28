import React from 'react'

import { RecipeBrowser } from './components/RecipeBrowser'
import { getAllData } from './data/payload'
import './styles.css'

export default async function HomePage() {
  const data = await getAllData()
  return <RecipeBrowser data={data} />
}
