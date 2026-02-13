export const MIN_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
export const LARGE_FILE_CHUNK_SIZE = 10 * 1024 * 1024 // 10MB for >500MB files
export const CONCURRENT_UPLOADS = 3 // Upload 3 parts at once
export const MAX_RETRIES = 3

export const calculateChunkSize = (fileSize: number): number => {
  if (fileSize > 500 * 1024 * 1024) {
    return LARGE_FILE_CHUNK_SIZE
  }
  return DEFAULT_CHUNK_SIZE
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}
