import React, { Suspense } from 'react'

import { RecipeBrowser } from './components/RecipeBrowser'
import { getAllData } from './data/payload'
import './styles.css'

export default async function HomePage() {
  const data = await getAllData()
  return (
    <Suspense fallback={<div className="items-container"><p>Loading...</p></div>}>
      <RecipeBrowser data={data} />
    </Suspense>
  )
}
