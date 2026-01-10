import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { captureScreenshot } from '../../server/screenshot'

export const Route = createFileRoute('/api/snapshot')({
  server: {
    handlers: {
      GET: () =>
        json({
          message: 'Use POST to capture a screenshot',
          usage: {
            method: 'POST',
            body: { url: 'string', selector: 'string (optional)' },
          },
        }),

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { url, selector } = body as {
            url?: string
            selector?: string
          }

          if (!url) {
            return json({ error: 'URL is required' }, { status: 400 })
          }

          const result = await captureScreenshot({ url, selector })

          return json({
            id: result.snapshotId,
            storageId: result.storageId,
            snapshotUrl: result.imageUrl,
          })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
