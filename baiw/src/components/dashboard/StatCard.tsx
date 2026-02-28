import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
}

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
