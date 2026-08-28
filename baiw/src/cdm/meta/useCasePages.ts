/**
 * The use-case page registry a CDM mapping's `useCasePageId` resolves into.
 *
 * ONE REGISTRY, NOT ONE PER CONSUMER. Before this file the only page ids the
 * gate could resolve were two the check fixture declared privately, and every
 * real `hostWorkbench` failed as unresolvable-by-design. Both halves are gone:
 * the fixture's ids moved here and no longer exist anywhere else, so there is
 * a single place a page id is declared and a single place to look when one
 * does not resolve.
 *
 * ─── HOW THE baiw ROWS WERE DERIVED, AND THE DRIFT THIS CANNOT SEE ─────────
 *
 * From the app's own structure on 2026-08-28, not from memory: the eighteen
 * `<Route>` paths inside App.tsx's `path="*"` block (BAIW is the catch-all —
 * see CLAUDE.md on route ordering) and the eighteen `navItems` in
 * components/layout/Sidebar.tsx. The two were asserted to be the SAME SET
 * before either was copied here, which is why the titles below can be taken
 * from the nav labels without inventing any.
 *
 * That assertion was made once, by hand, and NOTHING RE-MAKES IT. Add a route
 * without a nav item, or rename either, and this file silently disagrees with
 * the app — the same shape as SuiteLanding.tsx's hardcoded dataset counts,
 * which CLAUDE.md records as wrong in four places. A check that parses both
 * sources and asserts this list against them is the fix; it is a new branch
 * with its own mutation and is deliberately NOT in CDM-P2's narrow scope.
 * Recorded here and carried into the close-out report rather than left to be
 * discovered.
 *
 * `pageId` is the route path with its leading slash removed — derived from the
 * route, never authored beside it, so a page id cannot drift from the URL it
 * names while both still look right.
 */

export interface UseCasePage {
  /** Route path without the leading slash, e.g. 'cash-optimization'. */
  pageId: string;
  /** `hostWorkbench` of the descriptors whose mappings may reach this page. */
  workbenchId: string;
  /** Human label, from the workbench's own navigation. */
  title: string;
}

export const USE_CASE_PAGES: readonly UseCasePage[] = [
  // ── BAIW — App.tsx path="*" block, titles from Sidebar.tsx navItems ──────
  { pageId: 'dashboard', workbenchId: 'baiw', title: 'Dashboard' },
  { pageId: 'model', workbenchId: 'baiw', title: 'Model Explorer' },
  { pageId: 'capabilities', workbenchId: 'baiw', title: 'Capabilities' },
  { pageId: 'graph', workbenchId: 'baiw', title: 'Dependency Graph' },
  { pageId: 'maturity', workbenchId: 'baiw', title: 'Maturity Assessment' },
  { pageId: 'profitability', workbenchId: 'baiw', title: 'Profitability Engine' },
  { pageId: 'customer-profitability', workbenchId: 'baiw', title: 'Customer Profitability' },
  { pageId: 'customer-profitability-workbench', workbenchId: 'baiw', title: 'CP Workbench' },
  { pageId: 'customer-value', workbenchId: 'baiw', title: 'Consumer 360° Value' },
  { pageId: 'corporate-value', workbenchId: 'baiw', title: 'Corporate 360° Value' },
  { pageId: 'customer-comparison', workbenchId: 'baiw', title: 'Strategy Matrix' },
  { pageId: 'what-if', workbenchId: 'baiw', title: 'What-If Lab' },
  { pageId: 'portfolio', workbenchId: 'baiw', title: 'Portfolio Roll-Up' },
  { pageId: 'deck', workbenchId: 'baiw', title: 'Use-Case Deck' },
  { pageId: 'roadmap', workbenchId: 'baiw', title: 'Roadmap Builder' },
  { pageId: 'pakistan', workbenchId: 'baiw', title: 'Pakistan Reference' },
  // The COE page. It is a BAIW page reached at /cash-optimization inside the
  // catch-all block, NOT the separate /coe/* module — two different things
  // that both answer to "COE" in conversation.
  { pageId: 'cash-optimization', workbenchId: 'baiw', title: 'Cash Optimization' },
  { pageId: 'architecture', workbenchId: 'baiw', title: 'Architecture Cockpit' },

  // ── fixture — the gate's own two, moved out of scripts/fixtures/ ─────────
  // These sit in application source because the registry is meant to be the
  // ONE place a page id is declared, and a second copy under scripts/ would
  // reintroduce exactly the split this file exists to close. They are inert at
  // runtime: no descriptor ships with hostWorkbench 'fixture'.
  { pageId: 'fixture-page-party-360', workbenchId: 'fixture', title: 'Fixture — Party 360' },
  { pageId: 'fixture-page-settlement', workbenchId: 'fixture', title: 'Fixture — Settlement' },
];

/**
 * Page ids for one workbench. Returns an EMPTY ARRAY for a workbench nobody has
 * registered, never null: "this workbench has no pages" and "this workbench is
 * unknown" are the same fact here, and a mapping reaching either one is equally
 * unresolvable.
 */
export const pageIdsFor = (workbenchId: string): string[] =>
  USE_CASE_PAGES.filter((p) => p.workbenchId === workbenchId).map((p) => p.pageId);
