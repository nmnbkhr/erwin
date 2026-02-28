import { type ReactNode, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import CommandPalette from './CommandPalette'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function Layout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />
      <Sidebar />
      <div className="ml-[260px] transition-all duration-300">
        <Header onOpenSearch={() => setSearchOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
