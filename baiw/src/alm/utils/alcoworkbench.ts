import type { WorkbenchData } from '../../components/workbench/types'

export async function loadAlcoWorkbench(): Promise<WorkbenchData> {
  const data = await import('../data/alcoworkbench.json')
  return data.default as unknown as WorkbenchData
}
