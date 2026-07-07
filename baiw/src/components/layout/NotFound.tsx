import { Link } from 'react-router-dom'
import { Compass, Home, LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-purple-50 flex items-center justify-center">
          <Compass size={28} className="text-purple-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Page not found</h1>
        <p className="text-base text-slate-500 mb-6 leading-relaxed">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Home size={16} /> Suite Home
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            <LayoutDashboard size={16} /> BAIW Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
