export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface CsvOptions {
  /**
   * Prepend a UTF-8 BOM. Without it, Excel on Windows reads a UTF-8 CSV as
   * Windows-1252 and mangles every non-ASCII character — an owner name or a CDE
   * definition comes back with mojibake in the client's copy.
   *
   * Deliberately NOT offered: a `sep=,` first line. It is Excel-only, it is not
   * valid CSV, and it shows up as a literal data row in pandas, Google Sheets and
   * LibreOffice. The locales it helps are the ones using a comma decimal
   * separator, which Pakistan does not.
   */
  bom?: boolean
  /** Row terminator. CRLF is what RFC 4180 specifies and what Excel expects. */
  eol?: 'lf' | 'crlf'
}

/**
 * Defaults reproduce the original output byte for byte, because BAIW, TAIW and
 * HAIW all call this and none of them asked for a BOM.
 */
export function downloadCSV(
  rows: Record<string, unknown>[],
  filename: string,
  opts: CsvOptions = {}
) {
  if (rows.length === 0) return
  const { bom = false, eol = 'lf' } = opts
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join(eol === 'crlf' ? '\r\n' : '\n')
  // '\uFEFF' spelled as an escape on purpose: a literal BOM character here is
  // invisible in every editor and one careless save away from being stripped.
  const blob = new Blob([bom ? '\uFEFF' + csv : csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadPDF(elementId: string, filename: string, title?: string) {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  if (title) {
    pdf.setFontSize(16)
    pdf.text(title, 14, 20)
    pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, Math.min(pdfHeight, 250))
  } else {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 287))
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
