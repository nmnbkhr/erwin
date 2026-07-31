/**
 * Shared report spine.
 *
 * Extracted from what the three existing generators (utils/reportGenerator.ts,
 * taiw/utils/tradeReportGenerator.ts, haiw/utils/healthReportGenerator.ts) each
 * re-derive by hand. Those three are NOT migrated onto this — they keep working
 * untouched, because this repo has no tests and silently breaking BAIW's
 * flagship deliverable is the failure mode to avoid.
 *
 * What is deliberately here rather than in a generator:
 *
 *  - Page geometry. MARGIN is one constant, used by hand-placed text AND passed
 *    to autoTable, which otherwise defaults to 14mm and disagrees with the 15mm
 *    every other element uses.
 *  - Text that always wraps. `splitTextToSize` is applied unconditionally; of the
 *    three existing generators only HAIW passes maxWidth, so BAIW and TAIW run
 *    long strings off the page edge. DGIW content is arbitrary-length free text.
 *  - Real pagination. Every write advances a cursor and breaks the page before it
 *    reaches the footer band.
 *  - A footer pass that runs LAST, over doc.getNumberOfPages(). The existing
 *    generators hardcode `const totalPages = 18`, which is right today only
 *    because the deep-dive loop happens to emit eight pages, and which is wrong
 *    the moment autoTable inserts an overflow page.
 *  - The `lastAutoTable.finalY` cast, in exactly one place.
 *
 * What is deliberately NOT here: radar charts, maturity-level vocabularies,
 * benchmark handling and narrative structure. Those are per-module editorial
 * decisions, and absorbing them is what turns a spine into a fourth clone.
 *
 * Nothing in this file saves. `build()` returns the jsPDF instance; only the
 * caller decides whether that becomes a download, an assertion in a test, or a
 * blob URL. `saveReport()` is the separate, explicit step.
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { RGB, ReportMeta, SectionSpec, TableSpec, TextOptions } from './types'
import { formatCoverDate } from './naming'

/* ------------------------------------------------------------------ */
/*  Geometry and palette                                               */
/* ------------------------------------------------------------------ */

/** The one margin. Hand-placed text and autoTable both use it. */
export const MARGIN = 15

/** First baseline of body content on a page carrying header chrome. */
const CONTENT_TOP = 24
/**
 * No content is written below `pageHeight - FOOTER_RESERVE`.
 *
 * Exported because per-module drawing that goes through the `doc` escape hatch —
 * the three radar charts — has to know where the footer band starts, and the
 * alternative is the same 20 hardcoded in three files with nothing tying it to
 * the band it is avoiding.
 */
export const FOOTER_RESERVE = 20
const HEADER_RULE_Y = 12
const HEADER_TEXT_Y = 10
const FOOTER_RULE_UP = 12
const FOOTER_TEXT_UP = 8
const COVER_BANNER_H = 100

export const SIZE = {
  coverOrg: 28,
  coverTitle: 16,
  coverMeta: 10,
  pageTitle: 18,
  heading: 13,
  body: 9,
  small: 8,
  caption: 7,
} as const

const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]
export const SLATE: RGB = [100, 116, 139]

const LAYER_LABEL: Record<ReportMeta['layer'], string> = {
  core: 'Core chassis — sector-neutral',
  banking: 'Banking overlay',
  all: 'Core chassis + banking overlay',
}

/*
 * Three strings used to be hardcoded DGIW, in places a caller could not reach:
 * `drawChrome` is private, `cover()` renders unconditionally, and
 * `setProperties` runs in the constructor. A non-DGIW report built on this spine
 * got "Powered by DGIW" on every content page, a cover claiming a banking
 * overlay, and PDF properties naming the wrong product.
 *
 * They are resolved through these two helpers rather than inlined at each site
 * so the default lives once. The defaults reproduce the previous literals
 * exactly, which is what keeps every existing DGIW artefact byte-identical —
 * and, since 0a, provably so rather than merely intended.
 */

/** Product name for the chrome and the PDF Creator. */
function poweredByOf(meta: ReportMeta): string {
  return meta.poweredBy ?? 'DGIW'
}

/** Scope sentence for the cover line and the PDF Subject. */
function scopeLabelOf(meta: ReportMeta): string {
  return meta.scopeLabel ?? LAYER_LABEL[meta.layer]
}

/**
 * Join the parts of a compound label, dropping the ones that are not there.
 *
 * The cover tag and the PDF title are both `<artefact id><sep><something>`, and
 * both have to survive an empty artefact id: a module with no artefact register
 * still needs an id for the filename and the /ID seed, but printing it would cite
 * a catalogue that does not exist — the exact defect ARTEFACT-IMPL guards against.
 * With every part present the output is character-for-character what the template
 * literals produced before.
 */
function joinParts(parts: readonly (string | undefined)[], sep: string): string {
  return parts.map((p) => p?.trim() ?? '').filter((p) => p.length > 0).join(sep)
}

/** jsPDF points → millimetres, with the leading the existing reports read at. */
function lineHeight(size: number): number {
  return size * 0.3528 * 1.45
}

/**
 * 32 hex characters derived from the report's identity, for the PDF trailer's
 * /ID entry.
 *
 * jsPDF fills /ID from Math.random when it is not set. That is invisible on
 * screen and harmless to a reader, but it means two generations of the same
 * report differ — measured: identical 52,357-byte files whose only difference
 * was a 16-byte /ID. Determinism has to hold at the byte level to be worth
 * claiming, so the id is a pure function of what the document is about.
 *
 * The seed covers the document's identity AND a digest of its content. Identity
 * alone was not enough: two AR-01 reports for the same engagement on the same day
 * with different answers are different documents, and /ID is the field a viewer
 * or a DMS uses to decide exactly that. Sharing one meant a revised report sent
 * to a client could be treated as the copy already held, and not refreshed.
 *
 * FNV-1a, four times over salted variants. Not a cryptographic hash and not
 * required to be: this is a document identifier, not a security control. It is
 * not a change-detection guarantee either — a collision is possible in principle
 * and simply means two documents share an id, which is where this started.
 */
function stableFileId(seed: string): string {
  let out = ''
  for (let salt = 0; salt < 4; salt++) {
    let h = 0x811c9dc5
    const s = `${salt}:${seed}`
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    out += h.toString(16).padStart(8, '0')
  }
  return out.toUpperCase()
}

/**
 * Separator for content-key parts. A C0 control, so no id, title or activity
 * string can contain it and no two different part lists can join to the same
 * string. Written as an escape on purpose — a literal U+0001 here would be
 * invisible in every editor, exactly like the BOM in utils/export.ts.
 */
const KEY_SEP = '\u0001'

/**
 * Fold the things a document actually renders into one stable string, for
 * `createReport`'s content digest.
 *
 * Sorted here rather than trusted from the caller, and sorted with the default
 * comparator, which compares UTF-16 code units and is therefore locale- and
 * engine-independent — `localeCompare` would let two machines derive two ids for
 * the same document, which is the defect this exists to prevent.
 *
 * Callers pass prefixed parts (`wave:W0`, `gate:G1`) wherever two id families are
 * mixed, so a wave and a gate that happened to share a number cannot swap places
 * without changing the key.
 */
export function contentKey(parts: readonly string[]): string {
  return [...parts].sort().join(KEY_SEP)
}

/* ------------------------------------------------------------------ */
/*  The builder                                                        */
/* ------------------------------------------------------------------ */

/**
 * Two things about this class that are deliberate and will look inconsistent:
 *
 * (a) `table()` returns `finalY` as a number instead of `this`, breaking the
 *     chain that every other method preserves. That is the point: it is the one
 *     place the `lastAutoTable` cast lives, and callers that need to draw
 *     relative to the bottom of a table get a real number instead of repeating
 *     the cast — which is exactly what the three existing generators do, seven
 *     times between them.
 *
 * (b) `doc` is public. It is the escape hatch for per-module drawing the spine
 *     has no opinion about — radars, score discs, heat cells. It bypasses text
 *     splitting AND the cursor, so anything drawn through it owns its own
 *     overflow handling and must call `moveTo()` afterwards to put the cursor
 *     back where the spine should resume.
 */
export class ReportDoc {
  readonly doc: jsPDF
  readonly meta: ReportMeta
  readonly pageWidth: number
  readonly pageHeight: number
  readonly contentWidth: number

  private y: number
  private headerTitle = ''
  /** Pages whose header chrome is already painted, so it is never drawn twice. */
  private readonly chromeDrawn = new Set<number>()

  /**
   * @param contentDigest what this document renders, from `contentKey()`. Folded
   *        into the trailer /ID so a revised report is a different document. It
   *        is deliberately NOT part of ReportMeta: meta is built at the call site
   *        from the engagement, which knows nothing about the rows the generator
   *        is about to select. An empty digest is allowed and means "identity
   *        only" — the pre-existing behaviour, not a silent failure.
   */
  constructor(meta: ReportMeta, contentDigest = '') {
    this.meta = meta
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.contentWidth = this.pageWidth - 2 * MARGIN
    this.y = CONTENT_TOP

    // Reproducibility: jsPDF otherwise stamps the current clock into the PDF's
    // CreationDate, so two runs of the same report would differ byte-for-byte.
    const created = new Date(meta.generatedAt)
    if (!Number.isNaN(created.getTime())) this.doc.setCreationDate(created)
    this.doc.setFileId(
      stableFileId(
        `${meta.artefactId}|${meta.engagementId}|${meta.orgName}|${meta.layer}|${meta.generatedAt}|${contentDigest}`,
      ),
    )
    this.doc.setProperties({
      title: joinParts([meta.artefactId, meta.orgName], ' — '),
      author: 'Godaitec',
      creator: `Godaitec ${poweredByOf(meta)}`,
      subject: scopeLabelOf(meta),
    })
  }

  /* ---- cursor ---- */

  get cursorY(): number {
    return this.y
  }

  moveTo(y: number): this {
    this.y = y
    return this
  }

  spacer(mm: number): this {
    this.y += mm
    return this
  }

  /** Break the page if `needed` millimetres would not fit above the footer band. */
  pageBreakIfNeeded(needed: number): this {
    if (this.y + needed > this.pageHeight - FOOTER_RESERVE) this.page()
    return this
  }

  /* ---- structure ---- */

  /**
   * Page 1. Leaves the document on the cover; call `page()` for the first
   * content page. orgName, date, layer and draft state all come from meta —
   * passing them again would give the client's name two sources of truth, which
   * is the defect this whole engagement-identity effort exists to remove.
   */
  cover(title: string, subtitle?: string): this {
    const { doc, meta, pageWidth: w } = this
    this.headerTitle = title

    doc.setFillColor(...meta.accent)
    doc.rect(0, 0, w, COVER_BANNER_H, 'F')

    doc.setTextColor(...WHITE)
    doc.setFontSize(SIZE.coverOrg)
    doc.text(doc.splitTextToSize(meta.orgName, w - 40)[0] ?? meta.orgName, w / 2, 38, { align: 'center' })

    doc.setFontSize(SIZE.coverTitle)
    doc.text(title, w / 2, 54, { align: 'center', maxWidth: w - 30 })

    doc.setFontSize(SIZE.coverMeta)
    if (subtitle) doc.text(subtitle, w / 2, 66, { align: 'center', maxWidth: w - 40 })
    doc.text(formatCoverDate(meta.generatedAt), w / 2, 78, { align: 'center' })
    // `??`, not `||`: '' is a meaningful value here — it suppresses the line —
    // and `||` would fold it back into the default, which is the opposite.
    // Skipped entirely rather than emitting a text run for the empty string, so
    // a caller who wants no line gets no line and not a blank one.
    const coverTag = meta.coverTag ?? joinParts([meta.artefactId, scopeLabelOf(meta)], ' · ')
    if (coverTag) doc.text(coverTag, w / 2, 88, { align: 'center' })

    doc.setTextColor(...SLATE)
    doc.setFontSize(SIZE.coverMeta)
    doc.text('Prepared by Godaitec (godai.tech)', w / 2, 270, { align: 'center' })

    this.drawWatermark(1)
    this.y = COVER_BANNER_H + 20
    return this
  }

  /** Start a content page. An optional title renders in the accent at the top. */
  page(title?: string, caption?: string): this {
    this.doc.addPage()
    this.y = CONTENT_TOP
    this.drawChrome(this.doc.getNumberOfPages())
    if (title) this.pageTitle(title, caption)
    return this
  }

  /** 18pt accent title, the existing convention for opening a page. */
  pageTitle(text: string, caption?: string): this {
    this.doc.setFontSize(SIZE.pageTitle)
    this.doc.setTextColor(...this.meta.accent)
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[]
    for (const line of lines) {
      this.doc.text(line, MARGIN, this.y)
      this.y += lineHeight(SIZE.pageTitle)
    }
    this.y += 2
    if (caption) this.text(caption, { size: SIZE.body, color: SLATE, gapAfter: 6 })
    else this.y += 4
    return this
  }

  /** 13pt accent heading inside a page. */
  sectionHeading(text: string): this {
    this.pageBreakIfNeeded(lineHeight(SIZE.heading) + 14)
    this.doc.setFontSize(SIZE.heading)
    this.doc.setTextColor(...this.meta.accent)
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[]
    for (const line of lines) {
      this.doc.text(line, MARGIN, this.y)
      this.y += lineHeight(SIZE.heading)
    }
    this.y += 3
    return this
  }

  /* ---- text ---- */

  /**
   * The only text primitive. Always wraps to the content width and always
   * paginates — there is no way to call through to a bare `doc.text` and clip.
   */
  text(value: string, opts: TextOptions = {}): this {
    const size = opts.size ?? SIZE.body
    const indent = opts.indent ?? 0
    this.doc.setFontSize(size)
    this.doc.setTextColor(...(opts.color ?? BLACK))
    const lines = this.doc.splitTextToSize(value, this.contentWidth - indent) as string[]
    const lh = lineHeight(size)
    for (const line of lines) {
      this.pageBreakIfNeeded(lh)
      this.doc.setFontSize(size)
      this.doc.setTextColor(...(opts.color ?? BLACK))
      this.doc.text(line, MARGIN + indent, this.y)
      this.y += lh
    }
    this.y += opts.gapAfter ?? 3
    return this
  }

  /** Alias kept for readability at call sites that write prose. */
  paragraph(value: string, opts: TextOptions = {}): this {
    return this.text(value, opts)
  }

  /** Bulleted list with a hanging indent, so wrapped lines clear the bullet. */
  bullets(items: string[], opts: TextOptions = {}): this {
    const size = opts.size ?? SIZE.small
    const lh = lineHeight(size)
    const bulletX = MARGIN + (opts.indent ?? 0)
    const textX = bulletX + 5
    for (const item of items) {
      const lines = this.doc.splitTextToSize(item, this.pageWidth - MARGIN - textX) as string[]
      lines.forEach((line, i) => {
        this.pageBreakIfNeeded(lh)
        this.doc.setFontSize(size)
        this.doc.setTextColor(...(opts.color ?? BLACK))
        if (i === 0) this.doc.text('•', bulletX, this.y)
        this.doc.text(line, textX, this.y)
        this.y += lh
      })
      this.y += 1
    }
    this.y += opts.gapAfter ?? 3
    return this
  }

  /**
   * Label / value rows. Values wrap inside their column instead of colliding
   * with the page edge, which is what a free-text owner string would otherwise do.
   */
  keyValueBlock(pairs: [string, string][], opts: { labelWidth?: number } & TextOptions = {}): this {
    const size = opts.size ?? SIZE.body
    const labelWidth = opts.labelWidth ?? 50
    const lh = lineHeight(size)
    const valueX = MARGIN + labelWidth
    const valueWidth = this.pageWidth - MARGIN - valueX
    for (const [label, value] of pairs) {
      const lines = this.doc.splitTextToSize(value, valueWidth) as string[]
      this.pageBreakIfNeeded(lh * lines.length)
      const rowTop = this.y
      this.doc.setFontSize(size)
      this.doc.setTextColor(...SLATE)
      this.doc.text(this.doc.splitTextToSize(label, labelWidth - 3)[0] ?? label, MARGIN, rowTop)
      this.doc.setTextColor(...(opts.color ?? BLACK))
      lines.forEach((line, i) => {
        this.doc.text(line, valueX, rowTop + i * lh)
      })
      this.y = rowTop + lines.length * lh + 1
    }
    this.y += opts.gapAfter ?? 3
    return this
  }

  /* ---- tables ---- */

  /**
   * autoTable wrapper. Returns the table's final Y as a real number — the
   * `as unknown as` cast that the three existing generators repeat seven times
   * between them lives here and nowhere else.
   */
  table(spec: TableSpec): number {
    const startY = spec.startY ?? this.y
    autoTable(this.doc, {
      startY,
      head: [spec.head],
      body: spec.rows,
      theme: 'striped',
      // Matches the hand-placed 15mm rather than autoTable's 14mm default, and
      // keeps continued tables clear of the header and footer bands.
      margin: { left: MARGIN, right: MARGIN, top: CONTENT_TOP, bottom: FOOTER_RESERVE },
      headStyles: {
        fillColor: [...this.meta.accent],
        textColor: [...WHITE],
        fontSize: spec.headFontSize ?? SIZE.small,
      },
      bodyStyles: { fontSize: spec.bodyFontSize ?? SIZE.small },
      columnStyles: spec.columnStyles,
      didParseCell: spec.didParseCell,
      // Pages autoTable inserts on overflow are created behind the spine's back;
      // this is where they get their chrome.
      didDrawPage: (data) => {
        this.drawChrome(data.pageNumber)
      },
    })
    const finalY =
      (this.doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY
    this.y = finalY + (spec.gapAfter ?? 8)
    return finalY
  }

  /** Render a declarative section: heading, caption, prose, bullets, table. */
  section(spec: SectionSpec): this {
    if (spec.newPage) this.page()
    this.sectionHeading(spec.heading)
    if (spec.caption) this.text(spec.caption, { size: SIZE.caption, color: SLATE, gapAfter: 4 })
    for (const p of spec.paragraphs ?? []) this.text(p)
    if (spec.bullets?.length) this.bullets(spec.bullets)
    if (spec.table) this.table(spec.table)
    return this
  }

  /* ---- chrome ---- */

  private drawChrome(pageNumber: number): void {
    if (pageNumber <= 1 || this.chromeDrawn.has(pageNumber)) return
    this.chromeDrawn.add(pageNumber)
    const prev = this.doc.getCurrentPageInfo().pageNumber
    this.doc.setPage(pageNumber)

    const { doc, meta, pageWidth: w } = this
    doc.setDrawColor(...meta.accent)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, HEADER_RULE_Y, w - MARGIN, HEADER_RULE_Y)
    doc.setFontSize(SIZE.caption)
    doc.setTextColor(...SLATE)
    doc.text(`${meta.orgName} — ${this.headerTitle}`, MARGIN, HEADER_TEXT_Y, { maxWidth: w * 0.6 })
    doc.text(`Powered by ${poweredByOf(meta)}`, w - MARGIN, HEADER_TEXT_Y, { align: 'right' })

    this.drawWatermark(pageNumber)
    doc.setPage(prev)
  }

  /** Drawn at page creation so document content paints over it, not under it. */
  private drawWatermark(pageNumber: number): void {
    if (!this.meta.isDraft) return
    const prev = this.doc.getCurrentPageInfo().pageNumber
    this.doc.setPage(pageNumber)
    this.doc.setFontSize(50)
    this.doc.setTextColor(200, 200, 200)
    this.doc.text('DRAFT', this.pageWidth / 2, this.pageHeight / 2, { align: 'center', angle: 45 })
    this.doc.setPage(prev)
  }

  /**
   * Stamp footers across every page and hand back the document.
   *
   * This runs last precisely so `of N` is the real page count, including pages
   * autoTable inserted. Saves nothing: the caller decides what the document
   * becomes, which is what lets a test count rows in a built document instead of
   * eyeballing a downloaded file.
   */
  build(): jsPDF {
    const { doc, pageWidth: w, pageHeight: h } = this
    const total = doc.getNumberOfPages()
    for (let p = 2; p <= total; p++) {
      // A page that exists but never received chrome cannot happen through the
      // public API; draw it anyway rather than shipping a bare page.
      this.drawChrome(p)
      doc.setPage(p)
      doc.setDrawColor(...this.meta.accent)
      doc.setLineWidth(0.5)
      doc.line(MARGIN, h - FOOTER_RULE_UP, w - MARGIN, h - FOOTER_RULE_UP)
      doc.setFontSize(SIZE.caption)
      doc.setTextColor(...SLATE)
      doc.text('Prepared by Godaitec | godai.tech', MARGIN, h - FOOTER_TEXT_UP)
      doc.text(`Page ${p} of ${total}`, w - MARGIN, h - FOOTER_TEXT_UP, { align: 'right' })
    }
    doc.setPage(1)
    return doc
  }
}

/** Start a report. Nothing is written until a method is called. */
export function createReport(meta: ReportMeta, contentDigest = ''): ReportDoc {
  return new ReportDoc(meta, contentDigest)
}

/**
 * The only place a PDF hits the disk. Separate from build() on purpose: the
 * existing generators all save internally and return void, which is why none of
 * them can be asserted against.
 */
export function saveReport(doc: jsPDF, filename: string): void {
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
