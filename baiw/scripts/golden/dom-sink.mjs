/**
 * The minimum DOM `utils/export.ts::downloadCSV` needs to run for real.
 *
 * DGIW's CSV deliverables go through `report/csv.ts::downloadCsv` →
 * `utils/export.ts::downloadCSV`, which creates an object URL, builds an anchor
 * and clicks it. None of that exists in Node.
 *
 * The alternative — reimplementing the CSV assembly in the harness — would mean
 * the baseline described the harness's idea of a CSV rather than the app's. The
 * BOM, the CRLF terminator and the quote-every-field rule all live inside
 * `downloadCSV`, and those are exactly the bytes worth asserting. So the real
 * function runs and only the browser plumbing underneath it is faked.
 *
 * Install once per process, before any module that might call it is loaded.
 */

/** Filled by downloadCSV via the fake anchor's click(). Drained by the driver. */
export const DOM_SINK = []

export function installDomSink() {
  const blobs = new Map()
  let n = 0

  URL.createObjectURL = (blob) => {
    const url = `blob:golden-${++n}`
    blobs.set(url, blob)
    return url
  }
  URL.revokeObjectURL = (url) => {
    blobs.delete(url)
  }

  globalThis.document = {
    createElement() {
      // Deliberately not a real anchor: click() is where the payload is taken,
      // because that is the last moment downloadCSV has both the blob and the
      // filename in hand.
      const a = {
        href: '',
        download: '',
        click() {
          DOM_SINK.push({ filename: a.download, blob: blobs.get(a.href) })
        },
      }
      return a
    },
    body: { appendChild() {}, removeChild() {} },
  }
}
