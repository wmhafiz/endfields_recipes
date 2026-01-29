import type { CollectionConfig } from 'payload'

export const Items: CollectionConfig = {
  slug: 'items',
  admin: {
    useAsTitle: 'itemName',
    defaultColumns: ['itemName', 'itemId', 'slug', 'category', 'rarity', 'isRawMaterial'],
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
      name: 'category',
      type: 'relationship',
      relationTo: 'item-categories',
      admin: {
        description: 'Item category (optional)',
      },
    },
    {
      name: 'rarity',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Item rarity level',
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
  ],
}
