import { describe, expect, it } from 'vitest'

import { computePlan } from '@/app/(frontend)/components/ProductionPlanner/computePlan'
import type { EnrichedDbData } from '@/app/(frontend)/types/recipes'

describe('computePlan', () => {
  it('propagates requirements across dependencies', () => {
    const data: EnrichedDbData = {
      items: [
        { itemId: 'a', itemName: 'A', slug: 'a', isRawMaterial: false },
        { itemId: 'b', itemName: 'B', slug: 'b', isRawMaterial: false },
        { itemId: 'c', itemName: 'C', slug: 'c', isRawMaterial: true },
      ],
      recipes: [
        {
          id: 'r_b',
          name: 'Make B',
          description: '',
          type: 'machine',
          machineId: 'm1',
          machineName: 'Assembler',
          machineCraftTime: 60_000,
          ingredients: [{ itemId: 'c', itemName: 'C', slug: 'c', count: 2 }],
          outputs: [{ itemId: 'b', itemName: 'B', slug: 'b', count: 1 }],
          rarity: '0',
          defaultUnlock: '0',
          sortId: '1',
          usesRawMaterial: true,
        },
        {
          id: 'r_a',
          name: 'Make A',
          description: '',
          type: 'machine',
          machineId: 'm2',
          machineName: 'Assembler',
          machineCraftTime: 30_000,
          ingredients: [{ itemId: 'b', itemName: 'B', slug: 'b', count: 3 }],
          outputs: [{ itemId: 'a', itemName: 'A', slug: 'a', count: 1 }],
          rarity: '0',
          defaultUnlock: '0',
          sortId: '2',
          usesRawMaterial: false,
        },
      ],
    }

    const plan = computePlan({
      data,
      targets: [{ itemId: 'a', recipeId: 'r_a', qtyPerMin: 2 }],
      settings: { ratioMode: 'fractional', maxDepth: 10, layout: 'horizontal' },
    })

    expect(plan.items.a.neededPerMin).toBeCloseTo(2, 6)
    expect(plan.items.b.neededPerMin).toBeCloseTo(6, 6) // 2 crafts/min * 3 B
    expect(plan.items.c.neededPerMin).toBeCloseTo(12, 6) // 6 crafts/min * 2 C

    expect(plan.steps.r_a.machinesExact).toBeCloseTo(1, 6) // 2 crafts/min @ 30s
    expect(plan.steps.r_b.machinesExact).toBeCloseTo(6, 6) // 6 crafts/min @ 60s

    expect(plan.items.a.yieldPerMin).toBeCloseTo(2, 6)
    expect(plan.items.b.yieldPerMin).toBeCloseTo(6, 6)
    expect(plan.items.a.isBottleneck).toBe(false)
  })

  it('scales to whole-number machines when possible', () => {
    const data: EnrichedDbData = {
      items: [
        { itemId: 'a', itemName: 'A', slug: 'a', isRawMaterial: false },
        { itemId: 'c', itemName: 'C', slug: 'c', isRawMaterial: true },
      ],
      recipes: [
        {
          id: 'r_a',
          name: 'Make A',
          description: '',
          type: 'machine',
          machineId: 'm2',
          machineName: 'Assembler',
          machineCraftTime: 45_000,
          ingredients: [{ itemId: 'c', itemName: 'C', slug: 'c', count: 1 }],
          outputs: [{ itemId: 'a', itemName: 'A', slug: 'a', count: 1 }],
          rarity: '0',
          defaultUnlock: '0',
          sortId: '1',
          usesRawMaterial: true,
        },
      ],
    }

    const plan = computePlan({
      data,
      targets: [{ itemId: 'a', recipeId: 'r_a', qtyPerMin: 2 }],
      settings: { ratioMode: 'whole', maxDepth: 10, layout: 'horizontal' },
    })

    // machinesExact = 2 * 45000/60000 = 1.5 -> scaleFactor 2 -> machines = 3
    expect(plan.stats.scaleFactor).toBe(2)
    expect(plan.items.a.neededPerMin).toBeCloseTo(4, 6) // scaled
    expect(plan.steps.r_a.machines).toBe(3)
  })

  it('falls back to per-step rounding when no scale factor is found', () => {
    const data: EnrichedDbData = {
      items: [
        { itemId: 'a', itemName: 'A', slug: 'a', isRawMaterial: false },
        { itemId: 'c', itemName: 'C', slug: 'c', isRawMaterial: true },
      ],
      recipes: [
        {
          id: 'r_a',
          name: 'Make A',
          description: '',
          type: 'machine',
          machineId: 'm2',
          machineName: 'Assembler',
          machineCraftTime: 60_000,
          ingredients: [{ itemId: 'c', itemName: 'C', slug: 'c', count: 1 }],
          outputs: [{ itemId: 'a', itemName: 'A', slug: 'a', count: 1 }],
          rarity: '0',
          defaultUnlock: '0',
          sortId: '1',
          usesRawMaterial: true,
        },
      ],
    }

    const plan = computePlan({
      data,
      targets: [{ itemId: 'a', recipeId: 'r_a', qtyPerMin: 0.07 }],
      settings: { ratioMode: 'whole', maxDepth: 10, layout: 'horizontal' },
    })

    // machinesExact = 0.07, needs scaleFactor 100 but MAX_SCALE_FACTOR is 20 -> fallback
    expect(plan.stats.scaleFactor).toBe(1)
    expect(plan.steps.r_a.machines).toBe(1)
    expect(plan.items.a.neededPerMin).toBeCloseTo(0.07, 6)
    expect(plan.items.a.isBottleneck).toBe(false)
  })
})
