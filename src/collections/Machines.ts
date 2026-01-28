import type { CollectionConfig } from 'payload'

export const Machines: CollectionConfig = {
  slug: 'machines',
  admin: {
    useAsTitle: 'machineName',
    defaultColumns: ['machineName', 'machineId'],
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Machine/facility image (optional)',
      },
    },
    {
      name: 'machineImagePath',
      type: 'text',
      admin: {
        description: 'Original image path from db.json (kept for rollback)',
      },
    },
  ],
}
