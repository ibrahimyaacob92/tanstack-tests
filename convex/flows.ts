import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Node and edge validators (matching schema)
const nodePosition = v.object({
  x: v.number(),
  y: v.number(),
})

const nodeData = v.object({
  label: v.string(),
  color: v.string(),
})

const flowNode = v.object({
  id: v.string(),
  type: v.string(),
  position: nodePosition,
  data: nodeData,
})

const edgeStyle = v.object({
  stroke: v.optional(v.string()),
  strokeDasharray: v.optional(v.string()),
  strokeWidth: v.optional(v.number()),
})

const flowEdge = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),
  animated: v.optional(v.boolean()),
  style: v.optional(edgeStyle),
})

// Create a new flow
export const createFlow = mutation({
  args: {
    name: v.string(),
    nodes: v.array(flowNode),
    edges: v.array(flowEdge),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const flowId = await ctx.db.insert('flows', {
      name: args.name,
      nodes: args.nodes,
      edges: args.edges,
      createdAt: now,
      updatedAt: now,
    })
    return flowId
  },
})

// Get a single flow by ID
export const getFlow = query({
  args: { id: v.id('flows') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// List all flows
export const listFlows = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('flows').order('desc').collect()
  },
})

// Update a flow (nodes and edges)
export const updateFlow = mutation({
  args: {
    id: v.id('flows'),
    nodes: v.array(flowNode),
    edges: v.array(flowEdge),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error('Flow not found')
    }

    await ctx.db.patch(args.id, {
      nodes: args.nodes,
      edges: args.edges,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Rename a flow
export const renameFlow = mutation({
  args: {
    id: v.id('flows'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error('Flow not found')
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Delete a flow
export const deleteFlow = mutation({
  args: { id: v.id('flows') },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error('Flow not found')
    }

    await ctx.db.delete(args.id)
    return { success: true }
  },
})
