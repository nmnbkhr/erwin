import { useEffect, useState } from 'react'
import WorkbenchShell, { PageSkeleton } from '../../components/workbench/WorkbenchShell'
import { loadHealthWorkbench } from '../utils/workbench'
import type { WorkbenchData } from '../../components/workbench/types'

export default function HealthWorkbench() {
  const [data, setData] = useState<WorkbenchData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHealthWorkbench().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return <PageSkeleton />
  }

  return <WorkbenchShell data={data} exportFileName="baiw-haiw-health-workbench" />
}
