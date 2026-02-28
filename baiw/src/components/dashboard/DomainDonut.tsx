import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'
import type { Domain } from '../../types'

const COLORS = [
  '#2563EB', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#EF4444', '#F59E0B', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#84CC16',
  '#F97316', '#A855F7', '#E11D48', '#64748B',
]

interface Props {
  domains: Domain[]
}

export default function DomainDonut({ domains }: Props) {
  const navigate = useNavigate()
  const sorted = [...domains].sort((a, b) => b.entityCount - a.entityCount)
  const top8 = sorted.slice(0, 8)
  const otherCount = sorted.slice(8).reduce((sum, d) => sum + d.entityCount, 0)
  const chartData = [
    ...top8.map((d) => ({ name: d.name, value: d.entityCount })),
    { name: 'Other', value: otherCount },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">Entities by Domain</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            onClick={(entry) => {
              if (entry.name !== 'Other') {
                navigate(`/model?domain=${encodeURIComponent(entry.name)}`)
              }
            }}
            className="cursor-pointer"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
