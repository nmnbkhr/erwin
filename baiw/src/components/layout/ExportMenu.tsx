import { useState, useRef, useEffect } from 'react'
import { Download } from 'lucide-react'

interface ExportOption {
  label: string
  onClick: () => void
}

interface Props {
  options: ExportOption[]
}

export default function ExportMenu({ options }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (options.length === 1) {
    return (
      <button
        onClick={options[0].onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
      >
        <Download size={14} /> {options[0].label}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
      >
        <Download size={14} /> Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                opt.onClick()
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
