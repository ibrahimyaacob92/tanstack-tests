import type { Node, Edge } from '@xyflow/react'

// History state for undo/redo
export interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

// Custom node data type
export interface CustomNodeData {
  label: string
  color: string
  onLabelChange: (id: string, label: string) => void
  onColorChange: (id: string, color: string) => void
}

// Color option type
export interface ColorOption {
  name: string
  value: string
}
