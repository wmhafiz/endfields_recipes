import type { CollectionConfig } from 'payload'

export const Items: CollectionConfig = {
  slug: 'items',
  admin: {
    useAsTitle: 'itemName',
    defaultColumns: ['itemName', 'itemId', 'slug', 'isRawMaterial'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'itemId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable identifier from db.json (e.g., item_iron_cmpt)',
      },
    },
    {
      name: 'itemName',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the item',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-safe identifier for routing',
      },
    },
    {
      name: 'isRawMaterial',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this item is a raw/base material',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Item image (optional)',
      },
    },
    {
      name: 'localImagePath',
      type: 'text',
      admin: {
        description: 'Original image path from db.json (kept for rollback)',
      },
    },
  ],
}
