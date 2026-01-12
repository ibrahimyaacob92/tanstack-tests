import {
  Plus,
  Trash2,
  RotateCcw,
  MousePointer,
  Save,
  FolderOpen,
  Loader2,
  Undo2,
  Redo2,
  Circle,
  FileText,
} from 'lucide-react'
import { nodeColors } from '../constants'

interface FlowToolbarProps {
  nodeName: string
  onNodeNameChange: (name: string) => void
  selectedColor: string
  onColorChange: (color: string) => void
  onAddNode: () => void
  onDeleteSelected: () => void
  onClearSelection: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onSave: () => void
  onLoad: () => void
  onReset: () => void
  isSaving: boolean
  hasSelection: boolean
  nodesCount: number
  edgesCount: number
  selectedNodesCount: number
  selectedEdgesCount: number
  currentFlowName: string | null
  hasCurrentFlow: boolean
}

export function FlowToolbar({
  nodeName,
  onNodeNameChange,
  selectedColor,
  onColorChange,
  onAddNode,
  onDeleteSelected,
  onClearSelection,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onLoad,
  onReset,
  isSaving,
  hasSelection,
  nodesCount,
  edgesCount,
  selectedNodesCount,
  selectedEdgesCount,
  currentFlowName,
  hasCurrentFlow,
}: FlowToolbarProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Add Node Section */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nodeName}
            onChange={(e) => onNodeNameChange(e.target.value)}
            placeholder="Node name..."
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm w-32 focus:outline-none focus:border-cyan-500"
            onKeyDown={(e) => e.key === 'Enter' && onAddNode()}
          />
          <div className="flex gap-1">
            {nodeColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className={`w-6 h-6 rounded-full transition-all ${
                  selectedColor === color.value
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                    : ''
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <button
            onClick={onAddNode}
            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>
        </div>

        <div className="w-px h-8 bg-slate-600" />

        {/* Selection Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={onClearSelection}
            disabled={!hasSelection}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <MousePointer className="w-4 h-4" />
            Deselect
          </button>
        </div>

        <div className="w-px h-8 bg-slate-600" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-8 bg-slate-600" />

        {/* Save/Load */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {hasCurrentFlow ? 'Save' : 'Save As'}
          </button>
          <button
            onClick={onLoad}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <FolderOpen className="w-4 h-4" />
            Load
          </button>
        </div>

        <div className="w-px h-8 bg-slate-600" />

        {/* Reset */}
        <button
          onClick={onReset}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Selection Info */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        {currentFlowName && (
          <>
            <span className="flex items-center gap-1 text-green-400">
              <FileText className="w-3 h-3" />
              {currentFlowName}
            </span>
            <span>|</span>
          </>
        )}
        <span className="flex items-center gap-1">
          <Circle className="w-3 h-3 fill-cyan-400 text-cyan-400" />
          {nodesCount} nodes
        </span>
        <span>|</span>
        <span>{edgesCount} edges</span>
        {hasSelection && (
          <>
            <span>|</span>
            <span className="text-cyan-400">
              Selected: {selectedNodesCount} nodes, {selectedEdgesCount} edges
            </span>
          </>
        )}
      </div>
    </div>
  )
}
