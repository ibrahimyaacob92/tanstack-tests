import { useState, useCallback } from 'react'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
import {
  MAX_FILE_SIZE,
  isFileTypeAllowed,
  getAllowedExtensions,
} from '../constants'

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}

export function FileUploader({ onUpload, uploading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit. Selected file is ${Math.round(file.size / 1024 / 1024)}MB.`
    }

    // Check file type
    if (!isFileTypeAllowed(file.type)) {
      return `File type "${file.type}" is not supported. Allowed types: ${getAllowedExtensions()}`
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

    try {
      await onUpload(file)
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
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
          accept={Object.keys({
            'image/png': true,
            'image/jpeg': true,
            'image/gif': true,
            'image/webp': true,
            'image/svg+xml': true,
            'application/pdf': true,
            'text/plain': true,
            'text/markdown': true,
            'application/json': true,
            'text/csv': true,
          }).join(',')}
        />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-cyan-400" />
          )}

          <div>
            <p className="text-lg text-white mb-2">
              {uploading ? 'Uploading file...' : 'Drop your file here'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              or{' '}
              <label
                htmlFor="file-upload"
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer underline"
              >
                browse files
              </label>
            </p>

            <div className="text-xs text-gray-500">
              <p>Supported formats: Images, PDF, Text, JSON, CSV</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
    </div>
  )
}
