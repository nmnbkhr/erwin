/**
 * useReportMeta — ReportMeta for a module workbench's deliverables.
 *
 * DGIW has `dgiw/report/useDeliverable.ts` and cannot be the shared answer: it
 * calls `useLayer()`, which only exists inside DGIW's LayerProvider, and it
 * hardcodes rose-600. BAIW, TAIW and HAIW need the same engagement identity, the
 * same date truncation and the same `coverTag` decision without any of that.
 *
 * `src/report/` is the wrong home too — it must stay free of React so a CSV
 * export does not pull hooks (or, through spine.ts, jsPDF) into its chunk. This
 * module is where the engagement already lives, which is the thing report meta is
 * actually made of.
 *
 * What the caller supplies is a REPORT PROFILE: the three facts that differ per
 * workbench. Everything else is decided here, once, so three modules cannot drift
 * into three answers for "what layer is a module report?".
 */
import { useCallback } from 'react'
import { useEngagementOptional } from './context'
import { useOrgName } from './useOrgName'
import type { ReportMeta, RGB } from '../report/types'

/** The per-workbench half of a ReportMeta. */
export interface ReportProfile {
  /** Page chrome ("Powered by …") and the PDF's Creator. */
  poweredBy: string
  /** Cover-independent scope sentence; lands in the PDF's Subject. */
  scopeLabel: string
  /** Banner, headings, table heads. */
  accent: RGB
  /**
   * Org name when the engagement has none. Each workbench already shipped its
   * own placeholder on its covers and in its filenames; changing them would be a
   * client-visible edit wearing a refactor's clothes.
   */
  orgFallback: string
}

/**
 * One entry per workbench whose reports run on the spine.
 *
 * Deliberately data rather than three copies of the same object literal in three
 * components — and deliberately here rather than in each generator, because a
 * component that imported its profile from its generator would pull jsPDF into
 * the page chunk and undo the `await import()` those pages do on purpose.
 *
 * All three module workbenches are here as of D2 step 3.
 */
export const REPORT_PROFILES = {
  baiw: {
    poweredBy: 'BAIW',
    scopeLabel: 'Banking analytics maturity — BACR categories, BVF capabilities and FSDM data readiness',
    // purple-900 (#581C87), the PURPLE the generator has always painted its
    // cover banner, page rules and five of its six table heads with.
    accent: [88, 28, 135],
    // Exactly the string ReportGenerator.tsx used to compute inline as
    // `bankName.trim() || 'Your Bank'`. Moving the fallback here rather than
    // changing it keeps every cover and filename a nameless export produced.
    orgFallback: 'Your Bank',
  },
  haiw: {
    poweredBy: 'HAIW',
    scopeLabel: 'Healthcare analytics maturity — HACR across eight categories',
    // emerald-500, matching the workbench's own accent.
    accent: [16, 185, 129],
    orgFallback: 'Your Healthcare Organization',
  },
  taiw: {
    poweredBy: 'TAIW',
    scopeLabel: 'Trade analytics maturity — TACR categories and WCO Data Model v4.2 conformity',
    // teal-600, matching the workbench's own accent.
    accent: [13, 148, 136],
    orgFallback: 'Pakistan Customs',
  },
} as const satisfies Record<string, ReportProfile>

export interface ReportMetaOptions {
  /** Renders the DRAFT watermark. Defaults to false; generators may still raise it. */
  isDraft?: boolean
}

export type MetaFor = (artefactId: string, opts?: ReportMetaOptions) => ReportMeta

export function useReportMeta(profile: ReportProfile): MetaFor {
  // Optional, not the throwing variant: `useOrgName` already degrades to plain
  // component state without a provider so a report form works on a browser that
  // has never created an engagement, and a hook that threw there would undo that.
  const ctx = useEngagementOptional()
  const [orgName] = useOrgName()
  const active = ctx?.active ?? null

  return useCallback(
    (artefactId: string, opts: ReportMetaOptions = {}): ReportMeta => ({
      orgName: orgName.trim() || profile.orgFallback,
      /*
       * With no active engagement this is '', and the /ID seed loses a field.
       * The seed is `artefactId|engagementId|orgName|layer|generatedAt|digest`,
       * so two DIFFERENT clients exporting the same artefact on the same day,
       * both without an engagement, collide only if their org name AND their
       * answers also match — orgName and the content digest still separate them.
       * Not blocking, and not a reason to invent an id here: a fabricated one
       * would make two exports of the SAME assessment differ, which is worse.
       * Written down so it is not rediscovered as a mystery.
       */
      engagementId: active?.id ?? '',
      // Truncated to the day, matching useDeliverable.ts exactly. These are dated
      // deliverables; millisecond precision would make two exports on one
      // afternoon differ in nothing a reader could see.
      generatedAt: `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
      // Module reports have no core/banking split — that model is DGIW's. 'all'
      // is the honest value: nothing was filtered out.
      layer: 'all',
      accent: profile.accent,
      isDraft: opts.isDraft ?? false,
      artefactId,
      poweredBy: profile.poweredBy,
      scopeLabel: profile.scopeLabel,
      // The cover must not print the artefact id. These ids are declared in
      // check-dgiw.mjs's MODULE_ARTEFACT_IDS, not in an artefact register, and a
      // cover citing `MR-HAIW-MATURITY` would send a reader looking for a
      // catalogue entry that does not exist. The id still drives the filename and
      // the /ID seed — see ReportMeta.coverTag.
      coverTag: '',
    }),
    [orgName, active, profile],
  )
}
