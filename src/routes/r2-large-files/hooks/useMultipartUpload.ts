import { useState, useCallback, useRef } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { chunkFile, type ChunkInfo } from '../utils/fileChunker'
import { calculateChunkSize, CONCURRENT_UPLOADS, MAX_RETRIES } from '../constants'

export type UploadStatus = 'idle' | 'chunking' | 'uploading' | 'completing' | 'completed' | 'error' | 'cancelled'

export interface UploadProgress {
  percentage: number
  uploadedParts: number
  totalParts: number
  uploadedBytes: number
  totalBytes: number
  speed: number // bytes/sec
  estimatedTimeRemaining: number // seconds
  currentPart?: number
}

export interface UseMultipartUploadReturn {
  startUpload: (file: File) => Promise<void>
  cancelUpload: () => void
  progress: UploadProgress
  status: UploadStatus
  error: string | null
  uploadRecordId: Id<'multipartUploads'> | null
}

export function useMultipartUpload(): UseMultipartUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<UploadProgress>({
    percentage: 0,
    uploadedParts: 0,
    totalParts: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    speed: 0,
    estimatedTimeRemaining: 0,
  })
  const [uploadRecordId, setUploadRecordId] = useState<Id<'multipartUploads'> | null>(null)

  const initiateUpload = useAction(api.largeFiles.initiateMultipartUpload)
  const generateUrls = useAction(api.largeFiles.generatePartUploadUrls)
  const confirmPart = useMutation(api.largeFiles.confirmPartUpload)
  const complete = useAction(api.largeFiles.completeMultipartUpload)
  const abort = useAction(api.largeFiles.abortMultipartUpload)

  const cancelledRef = useRef(false)
  const startTimeRef = useRef<number>(0)

  const uploadPart = async (
    chunk: ChunkInfo,
    uploadUrl: string,
    uploadRecordId: Id<'multipartUploads'>,
    retries = 0
  ): Promise<void> => {
    if (cancelledRef.current) {
      throw new Error('Upload cancelled')
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: chunk.blob,
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`)
      }

      // Extract ETag from response headers (remove quotes)
      const etag = response.headers.get('etag')?.replace(/"/g, '')
      if (!etag) {
        throw new Error('No ETag in response')
      }

      // Confirm upload in database
      await confirmPart({
        uploadRecordId,
        partNumber: chunk.partNumber,
        etag,
      })
    } catch (err) {
      if (retries < MAX_RETRIES) {
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        return uploadPart(chunk, uploadUrl, uploadRecordId, retries + 1)
      }
      throw err
    }
  }

  const startUpload = useCallback(
    async (file: File) => {
      try {
        cancelledRef.current = false
        setError(null)
        setStatus('chunking')
        startTimeRef.current = Date.now()

        // Calculate chunk size and chunk the file
        const chunkSize = calculateChunkSize(file.size)
        const chunks = chunkFile(file, chunkSize)

        setProgress({
          percentage: 0,
          uploadedParts: 0,
          totalParts: chunks.length,
          uploadedBytes: 0,
          totalBytes: file.size,
          speed: 0,
          estimatedTimeRemaining: 0,
        })

        // Initiate multipart upload
        const { uploadRecordId, uploadId, storageKey, totalParts } = await initiateUpload({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          totalSize: file.size,
          chunkSize,
        })

        setUploadRecordId(uploadRecordId)
        setStatus('uploading')

        // Upload parts in batches
        let uploadedCount = 0
        const batchSize = CONCURRENT_UPLOADS

        for (let i = 0; i < chunks.length; i += batchSize) {
          if (cancelledRef.current) {
            await abort({ uploadRecordId })
            setStatus('cancelled')
            return
          }

          const batch = chunks.slice(i, i + batchSize)
          const partNumbers = batch.map((c) => c.partNumber)

          // Get presigned URLs for this batch
          const urls = await generateUrls({
            uploadRecordId,
            partNumbers,
          })

          // Upload parts in parallel
          await Promise.all(
            batch.map(async (chunk) => {
              const urlInfo = urls.find((u) => u.partNumber === chunk.partNumber)
              if (!urlInfo) {
                throw new Error(`No URL for part ${chunk.partNumber}`)
              }

              await uploadPart(chunk, urlInfo.uploadUrl, uploadRecordId)

              // Update progress
              uploadedCount++
              const elapsed = (Date.now() - startTimeRef.current) / 1000
              const speed = chunks
                .slice(0, uploadedCount)
                .reduce((sum, c) => sum + c.size, 0) / elapsed
              const remaining = chunks.slice(uploadedCount).reduce((sum, c) => sum + c.size, 0)
              const estimatedTimeRemaining = speed > 0 ? remaining / speed : 0

              setProgress({
                percentage: (uploadedCount / chunks.length) * 100,
                uploadedParts: uploadedCount,
                totalParts: chunks.length,
                uploadedBytes: chunks.slice(0, uploadedCount).reduce((sum, c) => sum + c.size, 0),
                totalBytes: file.size,
                speed,
                estimatedTimeRemaining,
                currentPart: chunk.partNumber,
              })
            })
          )
        }

        // Complete multipart upload
        setStatus('completing')
        await complete({ uploadRecordId })

        setStatus('completed')
        setProgress((prev) => ({
          ...prev,
          percentage: 100,
          estimatedTimeRemaining: 0,
        }))
      } catch (err) {
        console.error('Upload error:', err)
        setError(err instanceof Error ? err.message : 'Upload failed')
        setStatus('error')
        throw err
      }
    },
    [initiateUpload, generateUrls, confirmPart, complete, abort]
  )

  const cancelUpload = useCallback(async () => {
    cancelledRef.current = true
    if (uploadRecordId) {
      try {
        await abort({ uploadRecordId })
      } catch (err) {
        console.error('Failed to abort upload:', err)
      }
    }
    setStatus('cancelled')
  }, [uploadRecordId, abort])

  return {
    startUpload,
    cancelUpload,
    progress,
    status,
    error,
    uploadRecordId,
  }
}
