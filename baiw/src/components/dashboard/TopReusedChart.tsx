import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { loadReuseScores } from '../../utils/dataLoader'

export default function TopReusedChart() {
  const [data, setData] = useState<{ name: string; reuseCount: number }[]>([])

  useEffect(() => {
    loadReuseScores().then((scores) => {
      const top10 = [...scores]
        .sort((a, b) => b.reuseCount - a.reuseCount)
        .slice(0, 10)
        .map((s) => ({ name: s.entityName, reuseCount: s.reuseCount }))
      setData(top10)
    })
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">Top 10 Most Reused Entities</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fontFamily: 'monospace' }}
          />
          <Tooltip />
          <Bar dataKey="reuseCount" fill="#2563EB" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
