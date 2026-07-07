import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Module name shown in the fallback, e.g. "BAIW" */
  moduleName?: string
}

interface State {
  error: Error | null
}

/**
 * Catches render/lifecycle errors so a crash in one workbench module
 * degrades to a recoverable panel instead of a blank screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', this.props.moduleName ?? 'app', error)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            {this.props.moduleName ? `${this.props.moduleName} hit a snag` : 'Something went wrong'}
          </h1>
          <p className="text-base text-slate-500 mb-4 leading-relaxed">
            The rest of the suite is unaffected. You can retry this view or return to the suite home.
          </p>
          <details className="text-left mb-6 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <summary className="text-sm text-slate-500 cursor-pointer select-none">Technical details</summary>
            <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          </details>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RotateCcw size={16} /> Try Again
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Home size={16} /> Suite Home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
