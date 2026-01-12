import { X, Loader2, FolderOpen, FileText, Trash2 } from 'lucide-react'
import type { Id } from '../../../../convex/_generated/dataModel'

// Use a generic type to match the Convex flow structure
interface LoadDialogProps<T extends { _id: Id<'flows'>; name: string; nodes: unknown[]; edges: unknown[] }> {
  savedFlows: T[] | undefined
  currentFlowId: Id<'flows'> | null
  onLoadFlow: (flow: T) => void
  onDeleteFlow: (flowId: Id<'flows'>) => void
  onClose: () => void
}

export function LoadDialog<T extends { _id: Id<'flows'>; name: string; nodes: unknown[]; edges: unknown[] }>({
  savedFlows,
  currentFlowId,
  onLoadFlow,
  onDeleteFlow,
  onClose,
}: LoadDialogProps<T>) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Load Flow</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {!savedFlows ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : savedFlows.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No saved flows yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {savedFlows.map((flow) => (
              <div
                key={flow._id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  currentFlowId === flow._id
                    ? 'bg-cyan-500/10 border-cyan-500/50'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                }`}
              >
                <button
                  onClick={() => onLoadFlow(flow)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">{flow.name}</p>
                      <p className="text-xs text-gray-400">
                        {flow.nodes.length} nodes · {flow.edges.length} edges
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteFlow(flow._id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete flow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
