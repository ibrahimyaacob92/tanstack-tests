import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Camera,
  Monitor,
  Square,
  MousePointer,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Image,
  Trash2,
} from 'lucide-react'

export const Route = createFileRoute('/snapshot')({ component: SnapshotDemo })

interface SnapshotResult {
  id: string
  snapshotUrl: string
}

interface DemoCase {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  url: string
  selector?: string
}

const demoCases: DemoCase[] = [
  {
    id: 'full-page',
    title: 'Full Page',
    description: 'Capture the entire page including all scrollable content',
    icon: <Monitor className="w-5 h-5" />,
    url: 'http://localhost:3000',
  },
  {
    id: 'hero-section',
    title: 'Hero Section',
    description: 'Capture only the hero section at the top of the page',
    icon: <Square className="w-5 h-5" />,
    url: 'http://localhost:3000',
    selector: 'section:first-child',
  },
  {
    id: 'experiment-card',
    title: 'Experiment Card',
    description: 'Capture a specific card component from the homepage',
    icon: <MousePointer className="w-5 h-5" />,
    url: 'http://localhost:3000',
    selector: '.space-y-4 > a:first-child',
  },
]

function SnapshotDemo() {
  const [loading, setLoading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, SnapshotResult>>({})
  const [error, setError] = useState<string | null>(null)

  const deleteSnapshot = async (demoCaseId: string, snapshotId: string) => {
    setDeleting(demoCaseId)
    setError(null)

    try {
      const response = await fetch('/api/snapshot/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: snapshotId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete screenshot')
      }

      setResults((prev) => {
        const newResults = { ...prev }
        delete newResults[demoCaseId]
        return newResults
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDeleting(null)
    }
  }

  const captureSnapshot = async (demoCase: DemoCase) => {
    setLoading(demoCase.id)
    setError(null)

    try {
      const response = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: demoCase.url,
          selector: demoCase.selector,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to capture screenshot')
      }

      setResults((prev) => ({
        ...prev,
        [demoCase.id]: data,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiments
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <Camera className="w-10 h-10 text-cyan-400" />
          <h1 className="text-4xl font-bold text-white">Screenshot API</h1>
        </div>

        <p className="text-gray-400 text-lg mb-8 max-w-2xl">
          Capture screenshots of any page or specific DOM elements using
          server-side Puppeteer. Click the buttons below to see it in action.
        </p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            How it works
          </h2>
          <ol className="space-y-3 text-gray-400">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <span>
                Click a button to send a POST request to{' '}
                <code className="px-1.5 py-0.5 bg-slate-700 rounded text-cyan-400 text-sm">
                  /api/snapshot
                </code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <span>
                Server launches headless Chrome via Puppeteer and captures the
                screenshot
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <span>
                Screenshot is uploaded to{' '}
                <code className="px-1.5 py-0.5 bg-slate-700 rounded text-purple-400 text-sm">
                  Convex Storage
                </code>{' '}
                and metadata saved to database
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </span>
              <span>
                API returns a Convex CDN URL to view the screenshot
              </span>
            </li>
          </ol>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-8 text-red-400">
            {error}
          </div>
        )}

        <h2 className="text-xl font-semibold text-white mb-6">Demo Cases</h2>

        <div className="grid gap-6">
          {demoCases.map((demoCase) => {
            const result = results[demoCase.id]
            const isLoading = loading === demoCase.id
            const isDeleting = deleting === demoCase.id

            return (
              <div
                key={demoCase.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg text-cyan-400">
                      {demoCase.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {demoCase.title}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {demoCase.description}
                      </p>
                      {demoCase.selector && (
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                          Selector:{' '}
                          <code className="text-purple-400">
                            {demoCase.selector}
                          </code>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => captureSnapshot(demoCase)}
                    disabled={isLoading}
                    className="shrink-0 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Capture
                      </>
                    )}
                  </button>
                </div>

                {result && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Screenshot captured
                      </span>
                      <div className="flex items-center gap-3">
                        <a
                          href={result.snapshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          Open full size
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => deleteSnapshot(demoCase.id, result.id)}
                          disabled={isDeleting}
                          className="text-sm text-red-400 hover:text-red-300 disabled:text-red-400/50 flex items-center gap-1"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              Reset
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                      <img
                        src={result.snapshotUrl}
                        alt={`Screenshot: ${demoCase.title}`}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-12 bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">API Reference</h2>
          <div className="space-y-4 font-mono text-sm">
            <div>
              <p className="text-gray-400 mb-2">Capture screenshot:</p>
              <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-gray-300">
{`POST /api/snapshot
Content-Type: application/json

{
  "url": "http://localhost:3000",
  "selector": ".my-element"  // optional
}`}
              </pre>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Response:</p>
              <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-gray-300">
{`{
  "id": "k57...",           // Convex snapshot ID
  "storageId": "kg2...",    // Convex storage ID
  "snapshotUrl": "https://..." // Convex CDN URL
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
