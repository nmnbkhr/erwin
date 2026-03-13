import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useNavigate } from 'react-router-dom'
import type { Capability } from '../../types'

const THEME_COLORS: Record<string, string> = {
  'Marketing and Customer Experience': '#3B82F6',
  'Finance & Peformance Management': '#F59E0B',
  'Risk Management & Regulation': '#EF4444',
}

interface Props {
  capabilities: Capability[]
}

export default function CapabilityBar({ capabilities }: Props) {
  const navigate = useNavigate()
  const themes = capabilities.reduce<Record<string, number>>((acc, c) => {
    acc[c.themeName] = (acc[c.themeName] || 0) + 1
    return acc
  }, {})

  const data = Object.entries(themes).map(([name, count]) => ({ name, count }))

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">Capabilities by Theme</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            onClick={(entry) => navigate(`/capabilities?theme=${encodeURIComponent(String(entry.name))}`)}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={THEME_COLORS[entry.name] || '#64748B'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
