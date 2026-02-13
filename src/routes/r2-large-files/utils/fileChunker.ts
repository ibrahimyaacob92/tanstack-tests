export interface ChunkInfo {
  partNumber: number
  start: number
  end: number
  size: number
  blob: Blob
}

export function chunkFile(file: File, chunkSize: number): ChunkInfo[] {
  const chunks: ChunkInfo[] = []
  let start = 0
  let partNumber = 1

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    chunks.push({
      partNumber,
      start,
      end,
      size: end - start,
      blob: file.slice(start, end),
    })
    start = end
    partNumber++
  }

  return chunks
}
