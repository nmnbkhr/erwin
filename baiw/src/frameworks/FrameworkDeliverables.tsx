/**
 * The two framework deliverables, on a module's report panel.
 *
 * Shared for the same reason the page and the generators are: TAIW's and HAIW's report
 * panels would otherwise carry two copies of the same two cards and the same
 * disclosure, and a disclosure that exists in two places is a disclosure that will
 * eventually exist in two versions.
 *
 * ─── WHY ONE ALIGNMENT PACK HERE AND THE REST ON THE CROSSWALK PAGE ────────
 *
 * `src/dgiw/components/Deliverables.tsx` is the precedent and its reason is good: the
 * alignment pack is one artefact id producing one document per framework, and a
 * deliverables card is a single button. DGIW generates DMBOK2's from here — the one
 * framework at HIGH structure confidence — and sends the reader to the crosswalk page
 * for the others, "where the reader can see the confidence qualification first". DCAM
 * and COBIT are recorded at medium; handing someone a COBIT alignment pack from a
 * button that never showed them that would be the omission this suite spends its
 * disclosures avoiding.
 *
 * ─── THE DISCLOSURE TRAVELS WITH THE BUTTON ────────────────────────────────
 *
 * `headlineDisclosure` is rendered here as well as on the page and inside the PDF.
 * That is not redundancy: this panel is reachable without ever visiting the crosswalk
 * page, so a consultant can export HAIW's four-framework scorecard having never been
 * shown that HACR is nine template stems. The rule in CLAUDE.md is unconditional —
 * any HAIW deliverable that renders a framework scorecard must carry that sentence
 * beside it — and a download button is a deliverable surface.
 */
import { FileText, Library } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface FrameworkDeliverablesProps {
  /** 'TAIW' / 'HAIW'. */
  moduleLabel: string
  /** How many frameworks this module offers — three for TAIW, four for HAIW. */
  frameworkCount: number
  /** The framework generated from here, and its code for the button label. */
  primaryFrameworkCode: string
  /** `/taiw/frameworks`. Where the other packs and every caveat live. */
  crosswalkHref: string
  /** HAIW's instrument disclosure. Rendered above the buttons, never under them. */
  headlineDisclosure?: string
  /** `bg-teal-600 hover:bg-teal-700` etc — literals, so Tailwind's scan sees them. */
  accent: { button: string; text: string; link: string }
  busy: string | null
  onGenerateScorecard: () => void
  onGeneratePrimaryAlignment: () => void
}

export default function FrameworkDeliverables({
  moduleLabel,
  frameworkCount,
  primaryFrameworkCode,
  crosswalkHref,
  headlineDisclosure,
  accent,
  busy,
  onGenerateScorecard,
  onGeneratePrimaryAlignment,
}: FrameworkDeliverablesProps) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 mb-1">
        <Library size={16} className={accent.text} />
        <h4 className="text-sm font-semibold text-slate-700">Framework crosswalk deliverables</h4>
      </div>
      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        One {moduleLabel} assessment expressed in {frameworkCount} published frameworks. These are
        not {frameworkCount} independent measurements — they read the same answers through the same
        spine, so the overalls landing close together is the correct result rather than
        corroboration.
      </p>
      {headlineDisclosure && (
        <p className="text-xs text-slate-700 mb-3 leading-relaxed border-l-2 border-amber-300 pl-3">
          {headlineDisclosure}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-indigo-500" />
            <span className="font-medium text-slate-700 text-sm">Multi-Framework Scorecard</span>
          </div>
          <p className="text-xs text-slate-500 mb-1">All {frameworkCount} frameworks side by side</p>
          <p className="text-xs text-slate-400 mb-3">
            Worst three per framework · coverage gaps · where each concentrates
          </p>
          <div className="mt-auto">
            <button
              onClick={onGenerateScorecard}
              disabled={busy !== null}
              className={`w-full px-3 py-2 text-white text-sm rounded-lg ${accent.button} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {busy === 'scorecard' ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-violet-500" />
            <span className="font-medium text-slate-700 text-sm">Framework Alignment Pack</span>
          </div>
          <p className="text-xs text-slate-500 mb-1">{primaryFrameworkCode}, dimension by dimension</p>
          <p className="text-xs text-slate-400 mb-3">
            The authored rationale for every mapping.{' '}
            <Link to={crosswalkHref} className={`underline ${accent.link}`}>
              The other {frameworkCount - 1} from the crosswalk page
            </Link>
            , where the structure-confidence qualification is shown first.
          </p>
          <div className="mt-auto">
            <button
              onClick={onGeneratePrimaryAlignment}
              disabled={busy !== null}
              className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-700 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy === 'alignment' ? 'Generating...' : `Download ${primaryFrameworkCode} pack`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
