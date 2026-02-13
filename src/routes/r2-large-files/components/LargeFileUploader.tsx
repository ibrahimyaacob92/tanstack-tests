import { useState, useCallback } from 'react'
import { Upload, Loader2, AlertCircle, File } from 'lucide-react'
import { MIN_FILE_SIZE, MAX_FILE_SIZE, formatFileSize, calculateChunkSize } from '../constants'

interface LargeFileUploaderProps {
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}

export function LargeFileUploader({ onUpload, uploading }: LargeFileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size < MIN_FILE_SIZE) {
      return `File is too small. Minimum size is ${formatFileSize(MIN_FILE_SIZE)}. Selected file is ${formatFileSize(file.size)}.`
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}. Selected file is ${formatFileSize(file.size)}.`
    }

    return null
  }

  const handleFile = async (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0])
      }
    },
    [onUpload]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const chunkSize = selectedFile ? calculateChunkSize(selectedFile.size) : 0
  const chunkCount = selectedFile ? Math.ceil(selectedFile.size / chunkSize) : 0

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-slate-600 bg-slate-800/30'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-cyan-500/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="large-file-upload"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-cyan-400" />
          )}

          <div>
            <p className="text-lg text-white mb-2">
              {uploading ? 'Uploading file...' : 'Drop your large file here'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              or{' '}
              <label
                htmlFor="large-file-upload"
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer underline"
              >
                browse files
              </label>
            </p>

            <div className="text-xs text-gray-500">
              <p>Supported: Any file type</p>
              <p>Size range: {formatFileSize(MIN_FILE_SIZE)} - {formatFileSize(MAX_FILE_SIZE)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected file info */}
      {selectedFile && !uploading && (
        <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-start gap-3">
            <File className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-white font-medium">{selectedFile.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-400">
                <p>Size: {formatFileSize(selectedFile.size)}</p>
                <p>Chunk size: {formatFileSize(chunkSize)}</p>
                <p>Number of parts: {chunkCount}</p>
                <p>Type: {selectedFile.type || 'Unknown'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleUpload}
            className="mt-4 w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
          >
            Start Upload
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
    </div>
  )
}
