import { Landmark } from 'lucide-react'

const metrics = [
  { label: 'Total Assets', value: 'PKR 35T' },
  { label: 'Banks', value: '33' },
  { label: 'Branches', value: '16,000+' },
  { label: 'SBP Policy Rate', value: '17.5%' },
  { label: 'CASA Ratio', value: '47%' },
  { label: 'NPL Ratio', value: '7.5%' },
]

export default function PakistanCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Landmark size={20} className="text-emerald-700" />
        <h3 className="text-base font-semibold text-slate-700">Pakistan Banking Metrics</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-lg font-bold text-emerald-800">{m.value}</p>
            <p className="text-xs text-emerald-600">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
