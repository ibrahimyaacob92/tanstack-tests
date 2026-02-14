export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/json': ['.json'],
  'text/csv': ['.csv'],
}

export const FILE_TYPE_ICONS: Record<string, string> = {
  image: '🖼️',
  pdf: '📄',
  text: '📝',
  json: '{ }',
  csv: '📊',
  default: '📎',
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return FILE_TYPE_ICONS.image
  if (mimeType === 'application/pdf') return FILE_TYPE_ICONS.pdf
  if (mimeType.startsWith('text/')) return FILE_TYPE_ICONS.text
  if (mimeType === 'application/json') return FILE_TYPE_ICONS.json
  if (mimeType === 'text/csv') return FILE_TYPE_ICONS.csv
  return FILE_TYPE_ICONS.default
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function isFileTypeAllowed(mimeType: string): boolean {
  return Object.keys(ALLOWED_FILE_TYPES).includes(mimeType)
}

export function getAllowedExtensions(): string {
  return Object.values(ALLOWED_FILE_TYPES).flat().join(', ')
}
