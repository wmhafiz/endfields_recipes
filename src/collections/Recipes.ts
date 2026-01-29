import type { CollectionConfig } from 'payload'

export const Recipes: CollectionConfig = {
  slug: 'recipes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'recipeId', 'type', 'machine', 'rarity'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'recipeId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable identifier from db.json (e.g., battle_cannon_1)',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the recipe',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Recipe description (often empty)',
      },
    },
    {
      name: 'type',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Recipe type (e.g., hub, manual, facility)',
      },
    },
    {
      name: 'machine',
      type: 'relationship',
      relationTo: 'machines',
      required: true,
      admin: {
        description: 'The machine/facility used for this recipe',
      },
    },
    {
      name: 'ingredients',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'item',
          type: 'relationship',
          relationTo: 'items',
          required: true,
        },
        {
          name: 'count',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
      admin: {
        description: 'Input items required for this recipe',
      },
    },
    {
      name: 'outputs',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'item',
          type: 'relationship',
          relationTo: 'items',
          required: true,
        },
        {
          name: 'count',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
      admin: {
        description: 'Output items produced by this recipe',
      },
    },
    {
      name: 'rarity',
      type: 'number',
      admin: {
        description: 'Recipe rarity level',
      },
    },
    {
      name: 'defaultUnlock',
      type: 'number',
      admin: {
        description: 'Default unlock status (0 or 1)',
      },
    },
    {
      name: 'sortId',
      type: 'number',
      index: true,
      admin: {
        description: 'Sort order for display',
      },
    },
    {
      name: 'usesRawMaterial',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether recipe uses raw materials',
      },
    },
  ],
}
