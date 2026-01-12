import type { ColorOption } from './types'

// Node colors
export const nodeColors: ColorOption[] = [
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
]

// Edge colors
export const edgeColors: ColorOption[] = [
  { name: 'Gray', value: '#64748b' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
]

// Max history states for undo/redo
export const MAX_HISTORY = 50
