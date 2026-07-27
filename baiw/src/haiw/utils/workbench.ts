import type { WorkbenchData } from '../../components/workbench/types'

export async function loadHealthWorkbench(): Promise<WorkbenchData> {
  const data = await import('../data/workbench.json')
  return data.default as unknown as WorkbenchData
}
