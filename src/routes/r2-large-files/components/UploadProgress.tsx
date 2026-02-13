import { XCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { UploadProgress as UploadProgressType, UploadStatus } from '../hooks/useMultipartUpload'
import { formatFileSize, formatDuration } from '../constants'

interface UploadProgressProps {
  filename: string
  progress: UploadProgressType
  status: UploadStatus
  error: string | null
  onCancel: () => void
}

export function UploadProgress({
  filename,
  progress,
  status,
  error,
  onCancel,
}: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'chunking':
      case 'uploading':
      case 'completing':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'error':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'chunking':
        return 'Preparing file...'
      case 'uploading':
        return `Uploading part ${progress.currentPart || progress.uploadedParts}/${progress.totalParts}`
      case 'completing':
        return 'Finalizing upload...'
      case 'completed':
        return 'Upload completed!'
      case 'error':
        return 'Upload failed'
      case 'cancelled':
        return 'Upload cancelled'
      default:
        return ''
    }
  }

  const showProgress = status === 'uploading' || status === 'chunking'
  const canCancel = status === 'uploading' || status === 'chunking'

  return (
    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{filename}</h3>
            <p className="text-sm text-gray-400">{getStatusText()}</p>
          </div>
        </div>
        {canCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Cancel upload"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="mb-3">
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>{progress.percentage.toFixed(1)}%</span>
            <span>
              {progress.uploadedParts}/{progress.totalParts} parts
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      {status === 'uploading' && (
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-gray-500">Uploaded</p>
            <p className="text-white font-medium">
              {formatFileSize(progress.uploadedBytes)} / {formatFileSize(progress.totalBytes)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Speed</p>
            <p className="text-white font-medium">{formatFileSize(progress.speed)}/s</p>
          </div>
          <div>
            <p className="text-gray-500">Time remaining</p>
            <p className="text-white font-medium">
              {formatDuration(progress.estimatedTimeRemaining)}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Completion message */}
      {status === 'completed' && (
        <div className="mt-3 p-2 bg-green-900/20 border border-green-500/50 rounded text-sm text-green-200">
          File uploaded successfully! ({formatFileSize(progress.totalBytes)})
        </div>
      )}
    </div>
  )
}
