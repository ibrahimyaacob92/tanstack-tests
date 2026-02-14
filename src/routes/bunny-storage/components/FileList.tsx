import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { FileCard } from './FileCard'
import type { Id } from '../../../../convex/_generated/dataModel'

interface FileListProps {
  files:
    | Array<{
        _id: Id<'bunnyFiles'>
        filename: string
        fileSize: number
        mimeType: string
        uploadedAt: number
        url: string | null
      }>
    | undefined
  onDelete: (id: Id<'bunnyFiles'>) => Promise<void>
}

export function FileList({ files, onDelete }: FileListProps) {
  const [deletingId, setDeletingId] = useState<Id<'bunnyFiles'> | null>(null)

  const handleDelete = async (id: Id<'bunnyFiles'>) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (!files) {
    // Loading state
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden animate-pulse"
          >
            <div className="aspect-video bg-slate-900" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="flex-1 h-9 bg-slate-700 rounded" />
                <div className="w-9 h-9 bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    // Empty state
    return (
      <div className="bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-xl p-12 text-center">
        <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No files yet</h3>
        <p className="text-gray-400">
          Upload your first file to get started with Bunny.net storage
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {files.map((file) => (
        <FileCard
          key={file._id}
          file={file}
          onDelete={handleDelete}
          deleting={deletingId === file._id}
        />
      ))}
    </div>
  )
}
