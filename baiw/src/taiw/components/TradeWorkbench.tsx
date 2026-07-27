import { useEffect, useState } from 'react'
import WorkbenchShell, { PageSkeleton } from '../../components/workbench/WorkbenchShell'
import { loadTradeWorkbench } from '../utils/workbench'
import type { WorkbenchData } from '../../components/workbench/types'

export default function TradeWorkbench() {
  const [data, setData] = useState<WorkbenchData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTradeWorkbench().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return <PageSkeleton />
  }

  return <WorkbenchShell data={data} exportFileName="baiw-taiw-trade-workbench" />
}
