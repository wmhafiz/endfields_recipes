export const PLANNER_ITEM_DRAG_MIME = 'application/x-endfields-item-id'

export function getDraggedItemId(dataTransfer: DataTransfer): string | null {
  const fromCustom = dataTransfer.getData(PLANNER_ITEM_DRAG_MIME)
  if (fromCustom) return fromCustom

  const fromText = dataTransfer.getData('text/plain')
  if (fromText) return fromText

  return null
}
