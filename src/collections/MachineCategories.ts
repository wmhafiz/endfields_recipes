import type { CollectionConfig } from 'payload'

export const MachineCategories: CollectionConfig = {
  slug: 'machine-categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sortId'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique category name',
      },
    },
    {
      name: 'sortId',
      type: 'number',
      admin: {
        description: 'Sort order for display (optional)',
      },
    },
  ],
}
