import { Download, Trash2, Loader2 } from 'lucide-react'
import { getFileIcon, formatFileSize } from '../constants'
import type { Id } from '../../../../convex/_generated/dataModel'

interface FileCardProps {
  file: {
    _id: Id<'files'>
    filename: string
    fileSize: number
    mimeType: string
    uploadedAt: number
    url: string
  }
  onDelete: (id: Id<'files'>) => Promise<void>
  deleting: boolean
}

export function FileCard({ file, onDelete, deleting }: FileCardProps) {
  const isImage = file.mimeType.startsWith('image/')
  const uploadDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleDownload = () => {
    window.open(file.url, '_blank')
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      await onDelete(file._id)
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all group">
      {/* File Preview/Icon */}
      <div className="aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={file.url}
            alt={file.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl">{getFileIcon(file.mimeType)}</div>
        )}
      </div>

      {/* File Info */}
      <div className="p-4">
        <h3 className="text-white font-medium truncate mb-1" title={file.filename}>
          {file.filename}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>{formatFileSize(file.fileSize)}</span>
          <span>{uploadDate}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            disabled={deleting}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg flex items-center justify-center transition-colors"
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
