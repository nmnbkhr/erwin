/**
 * Trajectory — movement between frozen snapshots. G6, and DGIW's first chart.
 *
 * Every number here comes from trajectory/deltas.ts over trajectory/snapshots.ts
 * — the same compiled modules the gates run and the delta report renders, so
 * the screen, the gate and the PDF cannot disagree. This page computes no
 * delta of its own.
 *
 * ─── WHY SMALL MULTIPLES, NOT ONE MULTI-LINE CHART ─────────────────────────
 *
 * Eleven pillars on one chart would need eleven distinguishable series hues;
 * a categorical palette stops being tellable-apart well before that (the
 * dataviz rule of thumb is ~6, and this suite's own crosswalk work measured
 * how fast identity dissolves at 11). Small multiples give every pillar its
 * own tile with ONE series in the module accent, so no legend is needed, no
 * hue is cycled, and a flat line in one tile is not hidden behind a busy one
 * in another. The cost — no direct cross-pillar slope comparison — is paid
 * deliberately: the delta table above the chart is the cross-pillar view.
 *
 * ─── DRAWN HONESTY (non-negotiable 4) ──────────────────────────────────────
 *
 * Captured points joined by STRAIGHT segments only. No smoothing, no
 * interpolation, no extrapolation, no trend line. A segment is drawn only
 * between chronologically ADJACENT captures in which the pillar is scored in
 * both — a capture where the pillar was not scored BREAKS the line, because a
 * segment across it would draw a value nobody measured. A pillar with a
 * single scored capture draws a point, not a line. Axes carry real values
 * (y: the 1..5 scale; x: the captures, in order, named by their labels).
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, GitCompareArrows } from 'lucide-react'
import { Card, PageHeader, SectionTitle, TableWrap } from './ui'
import { useSnapshots } from '../trajectory/state'
import {
  comparableSnapshotPairs,
  snapshotsComparable,
  type AssessmentSnapshot,
} from '../trajectory/snapshots'
import {
  B_NO_FORECAST,
  B_SAME_TIER,
  B_SCORED_BOTH,
  scoreSnapshot,
  snapshotDeltas,
} from '../trajectory/deltas'
import { TIER_META } from '../tier'
import pillarsData from '../data/pillars.json'
import type { Pillar } from '../types'

const PILLARS = pillarsData as Pillar[]

const show1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)
const signed1 = (n: number) => `${n >= 0 ? '+' : ''}${show1(n)}`
const day = (iso: string) => iso.slice(0, 10)

/** One snapshot, named the way every selector and citation shows it. */
const snapName = (s: AssessmentSnapshot) =>
  `${s.label} — ${day(s.capturedAt)} · ${TIER_META[s.tier].label} · ${s.layer}`

/* ── the chart ─────────────────────────────────────────────────────────── */

const TILE_W = 250
const TILE_H = 150
const PAD = { top: 14, right: 34, bottom: 34, left: 26 }
const PLOT_W = TILE_W - PAD.left - PAD.right
const PLOT_H = TILE_H - PAD.top - PAD.bottom

/** y for a 1..5 score, linear, top = 5. Real values only — no rescaling. */
const yOf = (score: number) => PAD.top + ((5 - score) / 4) * PLOT_H

function PillarTile({
  pillar,
  series,
  points,
}: {
  pillar: Pillar
  series: AssessmentSnapshot[]
  points: (number | null)[]
}) {
  const n = series.length
  const xOf = (i: number) => PAD.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W)
  const scoredCount = points.filter((p) => p !== null).length

  return (
    <div className="border border-slate-200 rounded-lg p-2 bg-white">
      <p className="text-xs font-semibold text-slate-700 px-1">
        <span className="font-mono text-slate-400 mr-1.5">{pillar.id}</span>
        {pillar.short}
      </p>
      {scoredCount === 0 ? (
        <div className="h-[150px] flex items-center justify-center">
          <p className="text-xs text-slate-400 px-3 text-center">
            Not scored in any captured snapshot of this series.
          </p>
        </div>
      ) : (
        <svg width={TILE_W} height={TILE_H} role="img" aria-label={`${pillar.short} across ${n} captures`}>
          {/* y axis: the real 1..5 scale */}
          {[1, 2, 3, 4, 5].map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={TILE_W - PAD.right} y1={yOf(v)} y2={yOf(v)} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD.left - 5} y={yOf(v) + 3} fontSize={8} fill="#94a3b8" textAnchor="end">{v}</text>
            </g>
          ))}
          {/* straight segments between chronologically ADJACENT scored captures only */}
          {series.map((_, i) => {
            if (i === 0) return null
            const a = points[i - 1]
            const b = points[i]
            if (a === null || b === null) return null
            return (
              <line
                key={`seg-${i}`}
                x1={xOf(i - 1)} y1={yOf(a)} x2={xOf(i)} y2={yOf(b)}
                stroke="#e11d48" strokeWidth={2} strokeLinecap="round"
              />
            )
          })}
          {/* captured points, labelled with their real value; hover names the snapshot */}
          {series.map((s, i) => {
            const v = points[i]
            if (v === null) return null
            return (
              <g key={s.id}>
                <circle cx={xOf(i)} cy={yOf(v)} r={4} fill="#e11d48" stroke="#ffffff" strokeWidth={1.5}>
                  <title>{`${s.label} (${day(s.capturedAt)}): ${show1(v)} — digest ${s.digest}`}</title>
                </circle>
                <text x={xOf(i)} y={yOf(v) - 7} fontSize={8} fill="#475569" textAnchor="middle">{show1(v)}</text>
              </g>
            )
          })}
          {/* x axis: the captures in order, named by their snapshot labels */}
          {series.map((s, i) => (
            <text
              key={`x-${s.id}`}
              x={xOf(i)} y={TILE_H - PAD.bottom + 12}
              fontSize={7.5} fill="#64748b" textAnchor="middle"
            >
              <title>{snapName(s)}</title>
              {s.label.length > 12 ? `${s.label.slice(0, 11)}…` : s.label}
            </text>
          ))}
          {series.map((s, i) => (
            <text key={`xd-${s.id}`} x={xOf(i)} y={TILE_H - PAD.bottom + 21} fontSize={7} fill="#94a3b8" textAnchor="middle">
              {day(s.capturedAt)}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}

/* ── the page ──────────────────────────────────────────────────────────── */

export default function Trajectory() {
  const [snapshots] = useSnapshots()
  const [aId, setAId] = useState<string | null>(null)
  const [bId, setBId] = useState<string | null>(null)

  const ordered = useMemo(
    () => [...snapshots].sort((x, y) => (x.capturedAt < y.capturedAt ? -1 : 1)),
    [snapshots],
  )
  const pairs = useMemo(() => comparableSnapshotPairs(snapshots), [snapshots])

  // Selection: the user's picks when both resolve, else the two most recent
  // comparable snapshots, else nothing to compare.
  const byId = useMemo(() => new Map(snapshots.map((s) => [s.id, s])), [snapshots])
  const selectedA = (aId && byId.get(aId)) || pairs[0]?.[0] || null
  const selectedB = (bId && byId.get(bId)) || pairs[0]?.[1] || null

  const result = useMemo(
    () => (selectedA && selectedB ? snapshotDeltas(selectedA, selectedB) : null),
    [selectedA, selectedB],
  )

  // The chart's series: every snapshot comparable with the later selected one
  // (same tier + layer), in capture order — the axis a delta walks along.
  const seriesAnchor = selectedB ?? ordered[ordered.length - 1] ?? null
  const series = useMemo(
    () => (seriesAnchor ? ordered.filter((s) => snapshotsComparable(s, seriesAnchor)) : []),
    [ordered, seriesAnchor],
  )
  const seriesScores = useMemo(
    () =>
      series.map((s) => {
        const outcomes = scoreSnapshot(s)
        return new Map(outcomes.map((o) => [o.pillarId, o.state === 'scored' ? (o.score as number) : null]))
      }),
    [series],
  )

  if (snapshots.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Trajectory"
          subtitle="Movement between frozen assessment snapshots — deltas exist only between comparable captures, and every claim cites its two digests."
        />
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Camera size={18} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-slate-600 leading-relaxed">
                No snapshot has been captured for this engagement yet. Capture one from the{' '}
                <Link to="/dg/diagnostic" className="text-rose-600 hover:underline">Diagnostic Instrument</Link>{' '}
                results view — answer questions, open results, give the capture a label. The first
                is usually called <span className="font-medium">Baseline</span>; a re-assessment
                later makes it a trajectory.
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{B_NO_FORECAST}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trajectory"
        subtitle={`${snapshots.length} frozen snapshot${snapshots.length === 1 ? '' : 's'} for this engagement. Deltas exist only between captures at the same tier and layer; every claim cites its two digests.`}
      />

      {/* pair selector */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-slate-400 pb-2">
            <GitCompareArrows size={18} />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">From (earlier snapshot)</label>
            <select
              value={selectedA?.id ?? ''}
              onChange={(e) => setAId(e.target.value || null)}
              className="px-2 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-700 max-w-xs"
            >
              {ordered.map((s) => (
                <option key={s.id} value={s.id}>{snapName(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">To (later snapshot)</label>
            <select
              value={selectedB?.id ?? ''}
              onChange={(e) => setBId(e.target.value || null)}
              className="px-2 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-700 max-w-xs"
            >
              {ordered.map((s) => (
                <option key={s.id} value={s.id}>{snapName(s)}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 pb-2 flex-1 min-w-52">
            Defaults to the two most recent comparable snapshots.
            {pairs.length === 0 && ' No comparable pair exists yet — two captures at the same tier and layer are needed.'}
          </p>
        </div>
      </Card>

      {/* the verdict: deltas, or the rule that refuses them */}
      {result && !result.comparable && (
        <Card className="p-6 border border-amber-200">
          <SectionTitle hint="Cross-tier and cross-layer pairs are listed as not comparable — the rule is shown, nothing is computed.">
            These two snapshots cannot be compared
          </SectionTitle>
          <p className="text-sm text-slate-700 leading-relaxed" data-testid="not-comparable-rule">
            {result.rule}
          </p>
          <div className="mt-3 text-xs text-slate-500 font-mono space-y-1">
            <p>{result.citations.aLabel} · {day(result.citations.aAt)} · {TIER_META[result.aTier].label}/{result.aLayer} · {result.citations.aDigest}</p>
            <p>{result.citations.bLabel} · {day(result.citations.bAt)} · {TIER_META[result.bTier].label}/{result.bLayer} · {result.citations.bDigest}</p>
          </div>
        </Card>
      )}

      {result && result.comparable && (
        <>
          <Card className="p-6">
            <SectionTitle hint={B_SCORED_BOTH}>
              Pillar deltas
            </SectionTitle>
            {/* the citation line: which two frozen states produced these numbers */}
            <div className="mb-3 text-xs text-slate-500 font-mono space-y-1" data-testid="delta-citations">
              <p>from: {result.citations.aLabel} · {day(result.citations.aAt)} · digest {result.citations.aDigest}</p>
              <p>to: {result.citations.bLabel} · {day(result.citations.bAt)} · digest {result.citations.bDigest}</p>
            </div>
            {result.overall && (
              <p className="text-sm text-slate-700 mb-3">
                Overall (across the {result.overall.pillarCount} pillar{result.overall.pillarCount === 1 ? '' : 's'} scored
                in both): <span className="font-semibold">{show1(result.overall.from)} {'->'} {show1(result.overall.to)}</span>{' '}
                <span className={`font-semibold ${result.overall.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ({signed1(result.overall.delta)})
                </span>{' '}
                at the {TIER_META[result.tier].label} tier.
              </p>
            )}
            {result.deltas.length === 0 ? (
              <p className="text-sm text-slate-400">
                No pillar is scored in both snapshots, so no delta exists — the exclusions below say why, pillar by pillar.
              </p>
            ) : (
              <TableWrap>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4 font-medium">Pillar</th>
                      <th className="py-2 pr-4 font-medium">From</th>
                      <th className="py-2 pr-4 font-medium">To</th>
                      <th className="py-2 pr-4 font-medium">Delta</th>
                      <th className="py-2 font-medium">Coverage (from {'->'} to)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.deltas.map((d) => (
                      <tr key={d.pillarId} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-4 text-slate-700">
                          <span className="font-mono text-xs text-slate-400 mr-2">{d.pillarId}</span>
                          {d.pillarName}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">{show1(d.from)}</td>
                        <td className="py-2 pr-4 text-slate-600">{show1(d.to)}</td>
                        <td className={`py-2 pr-4 font-semibold ${d.delta > 0 ? 'text-emerald-600' : d.delta < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                          {signed1(d.delta)}
                        </td>
                        <td className="py-2 text-slate-500 text-xs">
                          {d.fromCoverage.answered}/{d.fromCoverage.applicable} {'->'} {d.toCoverage.answered}/{d.toCoverage.applicable}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
            {result.exclusions.length > 0 && (
              <div className="mt-4">
                <SectionTitle hint="Scored in one snapshot but not the other, or in neither — excluded with the reason, never rendered as a zero.">
                  Excluded from the comparison
                </SectionTitle>
                <ul className="space-y-1">
                  {result.exclusions.map((x) => (
                    <li key={x.pillarId} className="text-xs text-slate-500 leading-relaxed">
                      <span className="font-mono text-slate-400 mr-1">{x.pillarId}</span>
                      <span className="text-slate-600">{x.pillarName}:</span> {x.reasons.join('; ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}

      {/* the chart — every snapshot in the anchor's tier+layer series */}
      {series.length > 0 && (
        <Card className="p-6">
          <SectionTitle
            hint={`Captured points joined by straight segments only — no smoothing, no trend line, nothing drawn beyond the captures. A capture in which a pillar was not scored breaks that pillar's line; a single scored capture draws a point. Series: ${TIER_META[series[0].tier].label} tier, ${series[0].layer} layer, ${series.length} capture${series.length === 1 ? '' : 's'}.`}
          >
            Trajectory by pillar
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {PILLARS.map((p) => (
              <PillarTile
                key={p.id}
                pillar={p}
                series={series}
                points={series.map((_, i) => seriesScores[i].get(p.id) ?? null)}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">{B_NO_FORECAST}</p>
        </Card>
      )}

      {/* the record itself */}
      <Card className="p-6">
        <SectionTitle hint="Append-only: snapshots are captured on the Diagnostic results view and never edited or deleted here — a regression is a new capture beside the old one.">
          Captured snapshots
        </SectionTitle>
        <TableWrap>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Label</th>
                <th className="py-2 pr-4 font-medium">Captured</th>
                <th className="py-2 pr-4 font-medium">Tier</th>
                <th className="py-2 pr-4 font-medium">Layer</th>
                <th className="py-2 font-medium">Content digest</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-4 text-slate-700">{s.label}</td>
                  <td className="py-2 pr-4 text-slate-500">{day(s.capturedAt)}</td>
                  <td className="py-2 pr-4 text-slate-500">{TIER_META[s.tier].label}</td>
                  <td className="py-2 pr-4 text-slate-500">{s.layer}</td>
                  <td className="py-2 font-mono text-xs text-slate-500">{s.digest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">{B_SAME_TIER}</p>
      </Card>
    </div>
  )
}
