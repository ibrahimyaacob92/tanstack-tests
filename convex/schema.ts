import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  snapshots: defineTable({
    storageId: v.id('_storage'),
    url: v.string(),
    selector: v.optional(v.string()),
    createdAt: v.number(),
  }),
})
