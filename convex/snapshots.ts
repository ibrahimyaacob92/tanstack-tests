import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const saveSnapshot = mutation({
  args: {
    storageId: v.id('_storage'),
    url: v.string(),
    selector: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const snapshotId = await ctx.db.insert('snapshots', {
      storageId: args.storageId,
      url: args.url,
      selector: args.selector,
      createdAt: Date.now(),
    })
    return snapshotId
  },
})

export const getSnapshot = query({
  args: { id: v.id('snapshots') },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.id)
    if (!snapshot) return null

    const imageUrl = await ctx.storage.getUrl(snapshot.storageId)
    return {
      ...snapshot,
      imageUrl,
    }
  },
})

export const getSnapshotByStorageId = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .filter((q) => q.eq(q.field('storageId'), args.storageId))
      .first()

    if (!snapshot) return null

    const imageUrl = await ctx.storage.getUrl(snapshot.storageId)
    return {
      ...snapshot,
      imageUrl,
    }
  },
})

export const listSnapshots = query({
  args: {},
  handler: async (ctx) => {
    const snapshots = await ctx.db.query('snapshots').order('desc').collect()

    return Promise.all(
      snapshots.map(async (snapshot) => ({
        ...snapshot,
        imageUrl: await ctx.storage.getUrl(snapshot.storageId),
      }))
    )
  },
})

export const deleteSnapshot = mutation({
  args: { id: v.id('snapshots') },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.id)
    if (!snapshot) {
      throw new Error('Snapshot not found')
    }

    // Delete from storage
    await ctx.storage.delete(snapshot.storageId)

    // Delete from database
    await ctx.db.delete(args.id)

    return { success: true }
  },
})
