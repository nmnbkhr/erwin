/**
 * ISO 20022 Stage 1 subject areas — the 36 business areas of the business
 * process catalogue, from the pinned e-Repository artifact `eRepo-20260626`.
 *
 * GENERATED FROM THE ARTIFACT, NOT AUTHORED. Produced by running
 *
 *   node scripts/cdm/parse-iso20022.mjs <artifact>.iso20022
 *
 * over the pinned download and mapping each record mechanically: `id` is
 * `iso20022-` plus the repository's own business-area `code`, `name` is the
 * repository name verbatim, `locator` is the repository path the parse output
 * already carries. Nothing here was typed from a list. Re-running the parser
 * against the same artifact reproduces these rows; against a NEWER artifact it
 * will not, which is what the version pin is for.
 *
 * ─── ONE LEVEL, ON PURPOSE ─────────────────────────────────────────────────
 *
 * Subject areas ARE business areas at Stage 1. The catalogue goes deeper —
 * message sets, message definitions, then the data dictionary's 791 business
 * components and 65,466 message attributes — and the dossier's OI-2 says
 * explicitly to resist importing that depth here. Stage 2 is where entities
 * arrive, and it is a separate decision made after this output has been read.
 *
 * ─── DESCRIPTIONS ARE EMPTY, AND THAT IS THE LICENCE, NOT AN OVERSIGHT ─────
 *
 * 34 of the 36 carry a definition in the repository, 52 to 305 characters. The
 * dossier's licence ruling puts a HOLD on bulk verbatim reproduction of
 * definition text: the ISO 20022 grant is a royalty-free USE licence, not a
 * redistribution licence. Shipping all 34 would be exactly the bulk
 * reproduction that ruling names.
 *
 * They are left EMPTY rather than filled with a paraphrase. A paraphrase of 36
 * definitions would be authored content nobody reviewed, presented in a field
 * a reader takes as sourced — the placeholder shape CLAUDE.md records as
 * D-001/D-003/D-008. When a use case needs them, the route is a specific legal
 * note plus `--with-definitions`, not a quiet backfill here.
 *
 * `method: 'verbatim'` is correct and permitted: what ships is names and
 * identifiers, which the dossier's ruling allows verbatim, and the regime is
 * `open-use-restricted` rather than `derived-synthetic`, so CDM-PROVENANCE's
 * verbatim firewall does not apply to this model.
 */
import type { CdmSubjectArea } from '../meta/cdmMeta';

export const ISO20022_SUBJECT_AREAS: CdmSubjectArea[] = [
  {
    id: 'iso20022-catp',
    modelId: 'iso20022',
    name: "ATM Card Transaction",
    // Definition withheld: 240 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_cAIjQIniEeSEIt-Xs5V4sA']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-caam',
    modelId: 'iso20022',
    name: "ATM Management",
    // Definition withheld: 123 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_9QyroIniEeSEIt-Xs5V4sA']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-caaa',
    modelId: 'iso20022',
    name: "Acceptor to Acquirer Card Transaction",
    // Definition withheld: 207 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='__mfms02aEeGsmMHwuJF_aQ']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-acmt',
    modelId: 'iso20022',
    name: "Account Management",
    // Definition withheld: 118 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sOqY0mtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-cain',
    modelId: 'iso20022',
    name: "Acquirer to Issuer Card Transaction",
    // Definition withheld: 127 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_3RIecXq8EeSqmf43GdBXXQ']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-admi',
    modelId: 'iso20022',
    name: "Administration",
    // Definition withheld: 74 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sOziyGtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-auth',
    modelId: 'iso20022',
    name: "Authorities",
    // Definition withheld: 186 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_UyZuAMG-EeGE64q4lXx5Mw']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-head',
    modelId: 'iso20022',
    name: "Business Application Header",
    // Definition withheld: 87 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_qwPV8ORREemE5LyhzjFiwg']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-caad',
    modelId: 'iso20022',
    name: "Card Administration",
    // Definition withheld: 111 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sx6JEHV_Eemxsq9wkxEiDg']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-camt',
    modelId: 'iso20022',
    name: "Cash Management",
    // Definition withheld: 218 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sPGdsGtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-colr',
    modelId: 'iso20022',
    name: "Collateral Management",
    // Definition withheld: 52 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_LMRXA02bEeGsmMHwuJF_aQ']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-nvlp',
    modelId: 'iso20022',
    name: "Envelope",
    // Definition withheld: 305 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_S4JWwGDfEe2yZ71w6P_HbQ']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-cafc',
    modelId: 'iso20022',
    name: "Fee collection",
    // Definition withheld: 143 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_hHQ08HWBEemxsq9wkxEiDg']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-cafm',
    modelId: 'iso20022',
    name: "File Management",
    // Definition withheld: 128 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_vvykkHWBEemxsq9wkxEiDg']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-fxtr',
    modelId: 'iso20022',
    name: "Foreign Exchange Trade",
    // Definition withheld: 196 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_X2bLUDy7EeOhTf-dOBgT3g']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-cafr',
    modelId: 'iso20022',
    name: "Fraud Reporting and Disposition",
    // Definition withheld: 132 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_iB_W0HWMEemxsq9wkxEiDg']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-canm',
    modelId: 'iso20022',
    name: "Network Management",
    // Definition withheld: 131 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_5u6gIHWBEemxsq9wkxEiDg']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  // No `code` in the repository — the only one of the 36. Id falls back to a
  // name slug, and the fallback is visible here rather than hidden in a helper.
  {
    id: 'iso20022-othermessages',
    modelId: 'iso20022',
    name: "OtherMessages",
    // Definition withheld: the repository carries none. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='OtherMessages_ID']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-pacs',
    modelId: 'iso20022',
    name: "Payments Clearing and Settlement",
    // Definition withheld: 116 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sPQOvmtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-pain',
    modelId: 'iso20022',
    name: "Payments Initiation",
    // Definition withheld: 158 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sPjJomtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-remt',
    modelId: 'iso20022',
    name: "Payments Remittance Advice",
    // Definition withheld: 120 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_Yq2z4KuTEeO6YrnGem_Z3g']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-reda',
    modelId: 'iso20022',
    name: "Reference Data",
    // Definition withheld: 190 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sPs6qGtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-casp',
    modelId: 'iso20022',
    name: "Sale to POI Card Transactions",
    // Definition withheld: 127 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_Be36cMChEeicl8OqlySPkA']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-secl',
    modelId: 'iso20022',
    name: "Securities Clearing",
    // Definition withheld: 201 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_t4ZF402dEeGsmMHwuJF_aQ']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-seev',
    modelId: 'iso20022',
    name: "Securities Events",
    // Definition withheld: 92 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sP2rq2tdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-semt',
    modelId: 'iso20022',
    name: "Securities Management",
    // Definition withheld: 288 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sQSwgGtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-sese',
    modelId: 'iso20022',
    name: "Securities Settlement",
    // Definition withheld: 99 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sQvceGtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-setr',
    modelId: 'iso20022',
    name: "Securities Trade",
    // Definition withheld: 173 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sRC-cGtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-casr',
    modelId: 'iso20022',
    name: "Settlement Reporting",
    // Definition withheld: 121 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_JkNk4HWCEemxsq9wkxEiDg']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-supl',
    modelId: 'iso20022',
    name: "Supplementary Data",
    // Definition withheld: 256 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_3mDhM3UKEeKtmPJ81L3P6w']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-catm',
    modelId: 'iso20022',
    name: "Terminal Management",
    // Definition withheld: 151 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_C41Ls_OsEeK4-5jRl1NONQ']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-tsrv',
    modelId: 'iso20022',
    name: "Trade Services",
    // Definition withheld: 244 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_ziaEYHTwEeK8T8FFySHvcw']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-tsin',
    modelId: 'iso20022',
    name: "Trade Services Initiation",
    // Definition withheld: 138 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_8C0kQ02dEeGsmMHwuJF_aQ']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-tsmt',
    modelId: 'iso20022',
    name: "Trade Services Management",
    // Definition withheld: 191 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sRfDUGtdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-trck',
    modelId: 'iso20022',
    name: "Transaction Tracker",
    // Definition withheld: the repository carries none. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_Rt4akM7uEemEIuVuDudp4g']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  {
    id: 'iso20022-trea',
    modelId: 'iso20022',
    name: "Treasury",
    // Definition withheld: 180 chars in the repository. See the header.
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='_sRMIa2tdEeCY4-KZ9JEyUQ_-735475843']",
      method: 'verbatim',
      verifiedOn: '2026-08-28',
    },
  },
  // ── CP1.3 RUNG (c): the dictionary-wide area ────────────────────────────
  // NOT a business area. The 36 above come from the business process
  // catalogue; this one exists because the DATA DICTIONARY has no partition of
  // its own and its 791 business components must still belong somewhere.
  //
  // Measured, not assumed: zero of the 791 components reference any of the 36
  // area ids, and the dictionary is flat — 24,252 sibling topLevelDictionaryEntry
  // with no grouping containers. The only path from a component toward an area
  // runs through `derivationComponent` into the MESSAGE layer, which this stage
  // excludes by decision; and it would not work anyway, since 365 of the 791
  // carry no derivationComponent at all and fan-out reaches 971, so it could
  // never yield a single-valued subjectAreaId.
  //
  // method is 'derived' — unlike every other record here — because the NAME is
  // ours. The repository does not call this anything; it is the container we
  // are naming so that entities have an honest home. Inventing a taxonomy of
  // plausible-looking areas would have been the D-001 shape at model scale.
  {
    id: 'iso20022-data-dictionary',
    modelId: 'iso20022',
    name: 'Data dictionary',
    description: '',
    provenance: {
      sourceId: 'iso20022-erepo',
      locator: "dataDictionary",
      method: 'derived',
      verifiedOn: '2026-08-28',
    },
  },
];
