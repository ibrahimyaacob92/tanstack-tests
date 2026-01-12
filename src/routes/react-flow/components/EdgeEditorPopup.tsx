import type { Edge } from '@xyflow/react'
import { X } from 'lucide-react'
import { edgeColors } from '../constants'

interface EdgeEditorPopupProps {
  selectedEdgeId: string
  edges: Edge[]
  position: { x: number; y: number }
  onClose: () => void
  onColorChange: (edgeId: string, color: string) => void
  onToggleDashed: (edgeId: string) => void
  onToggleAnimation: (edgeId: string) => void
}

export function EdgeEditorPopup({
  selectedEdgeId,
  edges,
  position,
  onClose,
  onColorChange,
  onToggleDashed,
  onToggleAnimation,
}: EdgeEditorPopupProps) {
  const currentEdge = edges.find((e) => e.id === selectedEdgeId)

  return (
    <div
      className="fixed bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-xl z-50"
      style={{
        left: Math.min(position.x, window.innerWidth - 220),
        top: Math.min(position.y, window.innerHeight - 200),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">Edit Edge</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Color picker */}
      <div className="mb-3">
        <span className="text-xs text-gray-400 block mb-2">Color</span>
        <div className="flex gap-1">
          {edgeColors.map((color) => {
            const isSelected = currentEdge?.style?.stroke === color.value
            return (
              <button
                key={color.value}
                onClick={() => onColorChange(selectedEdgeId, color.value)}
                className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800'
                    : ''
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            )
          })}
        </div>
      </div>

      {/* Style toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => onToggleDashed(selectedEdgeId)}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            currentEdge?.style?.strokeDasharray
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Dashed
        </button>
        <button
          onClick={() => onToggleAnimation(selectedEdgeId)}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            currentEdge?.animated
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Animated
        </button>
      </div>
    </div>
  )
}
