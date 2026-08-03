/**
 * TAIW framework alignment — "how this TACR assessment satisfies <framework>".
 *
 * The document is `src/frameworks/report/projectionReports.ts`; this file is the
 * artefact id and the binding. It is deliberately three lines of code: everything that
 * makes it TAIW's is in `projectionModule.ts`, and a fourth copy of a 340-line generator
 * differing by a noun is the habit CLAUDE.md names as this repo's dominant structural
 * fact.
 *
 * ─── THE ARTEFACT ID IS NEW, AND `MR-`, AND THAT IS THE RIGHT PREFIX ───────
 *
 * `MR-TAIW-ALIGNMENT` is declared in `scripts/check/modules/taiw.mjs`'s `artefactIds`.
 * `AR-*` ids belong to DGIW's forty-eight-item artefact REGISTER — a delivery catalogue
 * a client cites by number — and DGIW's own alignment pack is AR-47 because that
 * register catalogues it. TACR has no such register, so a TAIW deliverable carrying an
 * `AR-` id would send a reader looking for an entry that does not exist.
 *
 * ARTEFACT-IMPL accepts the id because the registry derives the accepted `MR-` prefixes
 * from the modules that declare `artefactIds`, and it checks the shared generator's
 * report-constructor call for a content digest. That check only reaches this code
 * because `src/frameworks/report` and `src/taiw/report` are now DECLARED report source
 * locations — before D5 stage E3 they were not, and the two generators most likely to
 * forget a digest had no digest rule applied to them at all.
 *
 * (The identifier itself is deliberately not spelled out above. ARTEFACT-IMPL's
 * "referenced but not imported" guard is a raw text match over the whole file, so
 * naming it in a comment in a file that does not import it fails the build. Reported as
 * a wart rather than fixed here — changing that detection is a gate change with its own
 * selftest row, not something to fold into a feature.)
 *
 * ONE ID, THREE DOCUMENTS. As with DGIW's AR-47, a single artefact id produces one PDF
 * per framework; the caller distinguishes them in the filename. They are the same
 * deliverable in three vocabularies, not three deliverables.
 */
import type jsPDF from 'jspdf'
import { buildProjectionAlignmentPdf } from '../../frameworks/report/projectionReports'
import type { ReportMeta } from '../../report/types'
import type { TacrSpineCategory } from '../projection'
import { taiwProjectionModule, type TaiwAnswers } from './projectionModule'

export const TAIW_ALIGNMENT_ARTEFACT_ID = 'MR-TAIW-ALIGNMENT'

export interface TaiwAlignmentInput {
  meta: ReportMeta
  answers: TaiwAnswers
  /** The TACR category tree — see projectionModule.ts on why it is a parameter. */
  categories: readonly TacrSpineCategory[]
  frameworkId: string
}

export function buildTaiwFrameworkAlignmentPdf(input: TaiwAlignmentInput): jsPDF {
  const { meta, answers, categories, frameworkId } = input
  return buildProjectionAlignmentPdf(taiwProjectionModule(categories), { meta, answers, frameworkId })
}
