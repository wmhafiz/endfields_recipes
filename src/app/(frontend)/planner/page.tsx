import React from 'react'

import { getAllData } from '../data/payload'
import { ProductionPlanner } from '../components/ProductionPlanner/ProductionPlanner'

export default async function PlannerPage() {
  const data = await getAllData()
  return <ProductionPlanner data={data} />
}
