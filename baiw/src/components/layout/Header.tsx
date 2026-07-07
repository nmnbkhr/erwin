import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'

interface Props {
  onOpenSearch: () => void
}

export default function Header({ onOpenSearch }: Props) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
      <span className="text-lg font-semibold text-slate-800">
        Banking Analytics Intelligence Workbench
      </span>
      <div className="flex items-center gap-2 ml-4">
        <span className="bg-purple-600 text-white px-2.5 py-1 rounded-md text-sm font-medium">BAIW</span>
        <Link to="/taiw" className="bg-gray-700 text-gray-200 hover:bg-teal-600 hover:text-white px-2.5 py-1 rounded-md text-sm transition-colors">
          TAIW &rarr;
        </Link>
      </div>
      <button
        onClick={onOpenSearch}
        className="flex-1 max-w-md mx-auto flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition-colors"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Search entities, capabilities...</span>
        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-white text-slate-400 rounded border border-slate-200">
          Ctrl+K
        </kbd>
      </button>
    </header>
  )
}
