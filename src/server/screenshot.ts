import puppeteer from 'puppeteer'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export interface ScreenshotOptions {
  url: string
  selector?: string
}

export interface ScreenshotResult {
  snapshotId: Id<'snapshots'>
  storageId: Id<'_storage'>
  imageUrl: string
}

function getConvexClient() {
  const convexUrl = process.env.VITE_CONVEX_URL
  if (!convexUrl) {
    throw new Error('VITE_CONVEX_URL environment variable is not set')
  }
  return new ConvexHttpClient(convexUrl)
}

export async function captureScreenshot({
  url,
  selector,
}: ScreenshotOptions): Promise<ScreenshotResult> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

    let screenshotBuffer: Uint8Array

    if (selector) {
      const element = await page.$(selector)
      if (!element) {
        throw new Error(`Selector "${selector}" not found on page`)
      }
      screenshotBuffer = await element.screenshot()
    } else {
      screenshotBuffer = await page.screenshot({ fullPage: true })
    }

    await browser.close()

    // Upload to Convex
    const convex = getConvexClient()

    // Step 1: Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.snapshots.generateUploadUrl)

    // Step 2: Upload the screenshot to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: Buffer.from(screenshotBuffer),
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload screenshot to Convex storage')
    }

    const { storageId } = (await uploadResponse.json()) as {
      storageId: Id<'_storage'>
    }

    // Step 3: Save snapshot metadata to Convex database
    const snapshotId = await convex.mutation(api.snapshots.saveSnapshot, {
      storageId,
      url,
      selector,
    })

    // Step 4: Get the image URL
    const snapshot = await convex.query(api.snapshots.getSnapshot, {
      id: snapshotId,
    })

    if (!snapshot || !snapshot.imageUrl) {
      throw new Error('Failed to get snapshot URL')
    }

    return {
      snapshotId,
      storageId,
      imageUrl: snapshot.imageUrl,
    }
  } finally {
    await browser.close()
  }
}
