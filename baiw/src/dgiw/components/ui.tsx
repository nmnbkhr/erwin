import type { ReactNode } from 'react'
import { archetypeOf } from '../roles'

/**
 * An owner is one accountable person. Showing the archetype alongside the job
 * title is what makes the RACI operable: "Head of Credit Risk" means nothing to
 * the operating model until you can see it is exercising Data Owner accountability.
 * Supporting parties are named separately — contribution is shared, accountability isn't.
 */
export function Owner({ name, support }: { name: string; support?: string[] }) {
  const archetype = archetypeOf(name)
  return (
    <span className="inline-block align-top">
      <span className="text-slate-600">{name}</span>
      {archetype && archetype !== name && (
        <span className="block text-[11px] text-slate-400 leading-tight">as {archetype}</span>
      )}
      {support && support.length > 0 && (
        <span className="block text-[11px] text-slate-400 leading-tight">supported by {support.join(', ')}</span>
      )}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-800">{children}</h2>
      {hint && <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

export function Stat({ value, label, tone = 'slate' }: { value: string | number; label: string; tone?: 'slate' | 'rose' | 'green' | 'amber' }) {
  const tones = {
    slate: 'text-slate-900',
    rose: 'text-rose-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
  }
  return (
    <Card className="px-4 py-4">
      <p className={`text-2xl font-bold ${tones[tone]}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1 leading-snug">{label}</p>
    </Card>
  )
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            active === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Wide tables must scroll inside their own container, never the page body. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}

export function ExportButton({ onClick, label = 'Export CSV' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
    >
      {label}
    </button>
  )
}

const CRITICALITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-rose-50 text-rose-700 ring-rose-200',
  HIGH: 'bg-amber-50 text-amber-700 ring-amber-200',
  MEDIUM: 'bg-slate-100 text-slate-600 ring-slate-200',
  BLOCKER: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export function SeverityPill({ value }: { value: string }) {
  const style = CRITICALITY_STYLES[value] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 ${style}`}>
      {value}
    </span>
  )
}
