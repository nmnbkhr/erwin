import { useEffect, useState } from 'react'
import WorkbenchShell, { PageSkeleton } from '../../components/workbench/WorkbenchShell'
import { loadAlcoWorkbench } from '../utils/alcoworkbench'
import type { WorkbenchData } from '../../components/workbench/types'

export default function AlcoWorkbench() {
  const [data, setData] = useState<WorkbenchData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlcoWorkbench().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return <PageSkeleton />
  }

  return <WorkbenchShell data={data} exportFileName="baiw-alm-alco-workbench" />
}
