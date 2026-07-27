import type { WorkbenchData } from '../../components/workbench/types'

export async function loadTradeWorkbench(): Promise<WorkbenchData> {
  const data = await import('../data/workbench.json')
  return data.default as unknown as WorkbenchData
}
