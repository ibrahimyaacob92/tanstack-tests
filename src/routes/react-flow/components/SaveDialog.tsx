import { Save, Loader2 } from 'lucide-react'

interface SaveDialogProps {
  flowName: string
  onFlowNameChange: (name: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function SaveDialog({
  flowName,
  onFlowNameChange,
  onSave,
  onCancel,
  isSaving,
}: SaveDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Save Flow</h3>
        <input
          type="text"
          value={flowName}
          onChange={(e) => onFlowNameChange(e.target.value)}
          placeholder="Enter flow name..."
          className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white mb-4 focus:outline-none focus:border-cyan-500"
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!flowName.trim() || isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
