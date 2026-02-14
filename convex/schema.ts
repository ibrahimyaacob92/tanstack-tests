import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Node position type
const nodePosition = v.object({
  x: v.number(),
  y: v.number(),
})

// Node data type
const nodeData = v.object({
  label: v.string(),
  color: v.string(),
})

// Node type for React Flow
const flowNode = v.object({
  id: v.string(),
  type: v.string(),
  position: nodePosition,
  data: nodeData,
})

// Edge style type
const edgeStyle = v.object({
  stroke: v.optional(v.string()),
  strokeDasharray: v.optional(v.string()),
  strokeWidth: v.optional(v.number()),
})

// Edge type for React Flow
const flowEdge = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),
  animated: v.optional(v.boolean()),
  style: v.optional(edgeStyle),
})

export default defineSchema({
  snapshots: defineTable({
    storageId: v.id('_storage'),
    url: v.string(),
    selector: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // Flows table for React Flow diagrams
  flows: defineTable({
    name: v.string(),
    nodes: v.array(flowNode),
    edges: v.array(flowEdge),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Files table for R2 storage
  files: defineTable({
    storageKey: v.string(), // R2 storage key
    filename: v.string(), // Display name
    originalFilename: v.string(), // Original upload name
    fileSize: v.number(), // Size in bytes
    mimeType: v.string(), // Content type
    uploadedAt: v.number(), // Timestamp
    description: v.optional(v.string()),
  }),

  // Bunny Files table for ConvexFS storage
  bunnyFiles: defineTable({
    path: v.string(), // ConvexFS path
    blobId: v.string(), // Blob reference ID
    filename: v.string(), // Display name
    fileSize: v.number(), // Size in bytes
    mimeType: v.string(), // Content type
    uploadedAt: v.number(), // Timestamp
    description: v.optional(v.string()),
  }).index('by_path', ['path']),

  // Multipart uploads table for large file storage
  multipartUploads: defineTable({
    uploadId: v.string(), // AWS multipart upload ID
    storageKey: v.string(), // R2 storage location
    filename: v.string(),
    mimeType: v.string(),
    totalSize: v.number(),

    status: v.union(
      v.literal('initiating'),
      v.literal('in_progress'),
      v.literal('completing'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('aborted')
    ),

    parts: v.array(
      v.object({
        partNumber: v.number(), // 1-indexed part number
        etag: v.optional(v.string()), // From S3 response
        size: v.number(),
        status: v.union(
          v.literal('pending'),
          v.literal('uploading'),
          v.literal('completed'),
          v.literal('failed')
        ),
      })
    ),

    uploadedParts: v.number(),
    totalParts: v.number(),
    bytesUploaded: v.number(),

    startedAt: v.number(),
    lastActivityAt: v.number(),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_storage_key', ['storageKey']),
})
