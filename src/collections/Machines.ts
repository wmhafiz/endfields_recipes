import type { CollectionConfig } from 'payload'

export const Machines: CollectionConfig = {
  slug: 'machines',
  admin: {
    useAsTitle: 'machineName',
    defaultColumns: ['machineName', 'machineId', 'category', 'craftTime', 'rarity'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'machineId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable identifier (e.g., hub, fitting_unit, or "manual" for handcrafting)',
      },
    },
    {
      name: 'machineName',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the machine',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'machine-categories',
      admin: {
        description: 'Machine category (optional)',
      },
    },
    {
      name: 'rarity',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Machine rarity level',
      },
    },
    {
      name: 'sortId',
      type: 'number',
      index: true,
      admin: {
        description: 'Sort order for display (optional)',
      },
    },
    {
      name: 'craftTime',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Craft time in milliseconds',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Machine/facility image (optional)',
      },
    },
  ],
}
