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
})
