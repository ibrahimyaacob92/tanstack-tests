import { createFileRoute, Link } from '@tanstack/react-router'
import { Camera, FlaskConical, ArrowRight, GitBranch } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

const experiments = [
  {
    id: 'snapshot',
    icon: <Camera className="w-10 h-10 text-cyan-400" />,
    title: 'Screenshot API',
    description:
      'Capture screenshots of pages or specific DOM elements using Puppeteer. Server-side rendering with headless Chrome.',
    library: 'puppeteer',
    href: '/snapshot',
  },
  {
    id: 'react-flow',
    icon: <GitBranch className="w-10 h-10 text-cyan-400" />,
    title: 'React Flow',
    description:
      'Build interactive node-based UIs, diagrams, and workflows. Drag nodes, connect them, and create visual data flows.',
    library: '@xyflow/react',
    href: '/react-flow',
  },
]

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <FlaskConical className="w-16 h-16 text-cyan-400" />
            <h1 className="text-5xl md:text-6xl font-black text-white [letter-spacing:-0.04em]">
              <span className="text-gray-300">TanStack</span>{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Playground
              </span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            A sandbox for testing npm libraries and APIs
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Built with TanStack Start. Experiment with different packages and
            see them in action.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-purple-400" />
          Experiments
        </h2>

        <div className="space-y-4">
          {experiments.map((experiment) => (
            <Link
              key={experiment.id}
              to={experiment.href}
              className="block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group"
            >
              <div className="flex items-start gap-5">
                <div className="shrink-0">{experiment.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {experiment.title}
                    </h3>
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-gray-400 font-mono">
                      {experiment.library}
                    </span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    {experiment.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-gray-500 mt-8 text-sm">
          More experiments coming soon...
        </p>
      </section>
    </div>
  )
}
