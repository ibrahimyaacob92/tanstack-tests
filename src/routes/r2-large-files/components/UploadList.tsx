import { useState } from 'react'
import { Download, Trash2, FolderOpen, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useMutation, useQuery, useAction } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { formatFileSize } from '../constants'

interface UploadListProps {
  uploads:
    | Array<{
        _id: Id<'multipartUploads'>
        filename: string
        totalSize: number
        status: string
        progress: number
        uploadedParts: number
        totalParts: number
        startedAt: number
        completedAt?: number
      }>
    | undefined
}

export function UploadList({ uploads }: UploadListProps) {
  const [deletingId, setDeletingId] = useState<Id<'multipartUploads'> | null>(null)
  const [downloadingId, setDownloadingId] = useState<Id<'multipartUploads'> | null>(null)

  const deleteFile = useAction(api.largeFiles.deleteMultipartFile)
  const getCompletedFile = useQuery(
    downloadingId ? api.largeFiles.getCompletedFile : 'skip',
    downloadingId ? { uploadRecordId: downloadingId } : 'skip'
  )

  const handleDelete = async (id: Id<'multipartUploads'>) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteFile({ uploadRecordId: id })
    } catch (err) {
      console.error('Failed to delete file:', err)
      alert('Failed to delete file')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (id: Id<'multipartUploads'>) => {
    setDownloadingId(id)
  }

  // Auto-download when URL is available
  if (getCompletedFile?.url && downloadingId) {
    window.open(getCompletedFile.url, '_blank')
    setDownloadingId(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'in_progress':
      case 'uploading':
      case 'completing':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      case 'failed':
      case 'aborted':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'Uploading'
      case 'completing':
        return 'Finalizing'
      case 'failed':
        return 'Failed'
      case 'aborted':
        return 'Cancelled'
      default:
        return status
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!uploads) {
    // Loading state
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 animate-pulse"
          >
            <div className="h-6 bg-slate-700 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (uploads.length === 0) {
    // Empty state
    return (
      <div className="bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-xl p-12 text-center">
        <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No uploads yet</h3>
        <p className="text-gray-400">
          Upload your first large file to get started with multipart upload
        </p>
      </div>
    )
  }

  // Separate uploads by status
  const inProgress = uploads.filter((u) =>
    ['in_progress', 'uploading', 'completing', 'initiating'].includes(u.status)
  )
  const completed = uploads.filter((u) => u.status === 'completed')
  const failed = uploads.filter((u) => ['failed', 'aborted'].includes(u.status))

  return (
    <div className="space-y-6">
      {/* In Progress Uploads */}
      {inProgress.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Active Uploads ({inProgress.length})
          </h3>
          <div className="space-y-3">
            {inProgress.map((upload) => (
              <div
                key={upload._id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(upload.status)}
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{upload.filename}</h4>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(upload.totalSize)} • {getStatusText(upload.status)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{upload.progress.toFixed(1)}%</span>
                  <span>
                    {upload.uploadedParts}/{upload.totalParts} parts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Uploads */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Completed ({completed.length})
          </h3>
          <div className="space-y-3">
            {completed.map((upload) => (
              <div
                key={upload._id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(upload.status)}
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{upload.filename}</h4>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(upload.totalSize)} •{' '}
                        {upload.completedAt ? formatDate(upload.completedAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(upload._id)}
                      disabled={downloadingId === upload._id}
                      className="p-2 text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
                      title="Download"
                    >
                      {downloadingId === upload._id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(upload._id)}
                      disabled={deletingId === upload._id}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === upload._id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Uploads */}
      {failed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Failed ({failed.length})</h3>
          <div className="space-y-3">
            {failed.map((upload) => (
              <div
                key={upload._id}
                className="bg-slate-800/50 border border-red-500/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(upload.status)}
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{upload.filename}</h4>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(upload.totalSize)} • {getStatusText(upload.status)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(upload._id)}
                    disabled={deletingId === upload._id}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === upload._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
