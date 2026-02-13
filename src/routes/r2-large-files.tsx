import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ArrowLeft, Database } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { LargeFileUploader } from './r2-large-files/components/LargeFileUploader'
import { UploadProgress } from './r2-large-files/components/UploadProgress'
import { UploadList } from './r2-large-files/components/UploadList'
import { useMultipartUpload } from './r2-large-files/hooks/useMultipartUpload'
import { useState } from 'react'

export const Route = createFileRoute('/r2-large-files')({
  component: R2LargeFilesDemo,
})

function R2LargeFilesDemo() {
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const { startUpload, cancelUpload, progress, status, error, uploadRecordId } =
    useMultipartUpload()
  const uploads = useQuery(api.largeFiles.listMultipartUploads, {})

  const handleUpload = async (file: File) => {
    setUploadingFile(file)
    try {
      await startUpload(file)
      // Clear uploading file after completion
      setTimeout(() => setUploadingFile(null), 3000)
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const handleCancel = () => {
    cancelUpload()
    setUploadingFile(null)
  }

  const isUploading =
    status === 'chunking' || status === 'uploading' || status === 'completing'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiments
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <Database className="w-10 h-10 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">R2 Large File Storage</h1>
        </div>

        <p className="text-gray-400 mb-8 text-lg">
          Upload large files (100MB-1GB) using multipart upload with real-time progress
          tracking and chunking visualization.
        </p>

        {/* How It Works Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold mb-2">
                1
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Select Large File</h3>
              <p className="text-xs text-gray-400">Choose a file between 100MB-1GB</p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold mb-2">
                2
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Chunk into Parts</h3>
              <p className="text-xs text-gray-400">File split into 5-10MB chunks</p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold mb-2">
                3
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Upload in Parallel</h3>
              <p className="text-xs text-gray-400">Multiple parts uploaded simultaneously</p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold mb-2">
                4
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Reassemble on R2</h3>
              <p className="text-xs text-gray-400">Parts combined into complete file</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Upload Large File</h2>

          {/* Show uploader when not uploading */}
          {!isUploading && status !== 'completed' && (
            <LargeFileUploader onUpload={handleUpload} uploading={false} />
          )}

          {/* Show progress when uploading or just completed */}
          {uploadingFile && (status !== 'idle' || uploadRecordId) && (
            <div className="mt-4">
              <UploadProgress
                filename={uploadingFile.name}
                progress={progress}
                status={status}
                error={error}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>

        {/* Uploads List */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Your Uploads {uploads && uploads.length > 0 && `(${uploads.length})`}
          </h2>
          <UploadList uploads={uploads} />
        </div>

        {/* Technical Details */}
        <div className="mt-12 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Technical Details</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-purple-400 font-medium mb-2">Multipart Upload</h3>
              <p className="text-gray-300">
                Uses AWS S3-compatible multipart upload API via Cloudflare R2. Files are split
                into parts, uploaded in parallel, and reassembled on the server.
              </p>
            </div>
            <div>
              <h3 className="text-purple-400 font-medium mb-2">Chunk Strategy</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Files &lt; 500MB: 5MB chunks</li>
                <li>Files &gt; 500MB: 10MB chunks</li>
                <li>3 parts uploaded concurrently for optimal speed</li>
                <li>Automatic retry on failure (up to 3 attempts per part)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-purple-400 font-medium mb-2">Progress Tracking</h3>
              <p className="text-gray-300">
                Real-time tracking of upload progress including percentage, bytes uploaded,
                upload speed, and estimated time remaining. Progress persists in Convex database.
              </p>
            </div>
            <div>
              <h3 className="text-purple-400 font-medium mb-2">Benefits</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Faster uploads with parallel part uploads</li>
                <li>Resilient to network interruptions (retry failed parts)</li>
                <li>Real-time progress feedback</li>
                <li>No file size limits (up to R2's 5GB per object limit)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
