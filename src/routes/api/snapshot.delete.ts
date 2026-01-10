import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

function getConvexClient() {
  const convexUrl = process.env.VITE_CONVEX_URL
  if (!convexUrl) {
    throw new Error('VITE_CONVEX_URL environment variable is not set')
  }
  return new ConvexHttpClient(convexUrl)
}

export const Route = createFileRoute('/api/snapshot/delete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { id } = body as { id?: string }

          if (!id) {
            return json({ error: 'Snapshot ID is required' }, { status: 400 })
          }

          const convex = getConvexClient()
          await convex.mutation(api.snapshots.deleteSnapshot, {
            id: id as Id<'snapshots'>,
          })

          return json({ success: true })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
