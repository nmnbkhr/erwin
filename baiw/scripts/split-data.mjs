#!/usr/bin/env node
/**
 * Split large JSON data files into per-domain chunks for lazy loading.
 * Run: node scripts/split-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA = join(import.meta.dirname, '..', 'src', 'data')

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Load domains to build slug map
const domains = JSON.parse(readFileSync(join(DATA, 'domains.json'), 'utf-8'))
const domainSlugs = {}
for (const d of domains) {
  domainSlugs[d.name] = slugify(d.name)
}

console.log(`Found ${domains.length} domains`)

// --- 1. Split entities.json by domain ---
const entities = JSON.parse(readFileSync(join(DATA, 'entities.json'), 'utf-8'))
const entitiesByDomain = {}
const entityIndex = [] // lightweight index for search

for (const e of entities) {
  const slug = domainSlugs[e.domain] || 'other'
  if (!entitiesByDomain[slug]) entitiesByDomain[slug] = []
  entitiesByDomain[slug].push(e)
  entityIndex.push({ id: e.id, name: e.name, domain: e.domain })
}

mkdirSync(join(DATA, 'entities'), { recursive: true })
const entitiesIndex = []
for (const [slug, ents] of Object.entries(entitiesByDomain)) {
  writeFileSync(join(DATA, 'entities', `${slug}.json`), JSON.stringify(ents))
  entitiesIndex.push({ slug, count: ents.length })
  console.log(`  entities/${slug}.json: ${ents.length} entities`)
}
writeFileSync(join(DATA, 'entities', 'index.json'), JSON.stringify(entitiesIndex, null, 2))
writeFileSync(join(DATA, 'entityIndex.json'), JSON.stringify(entityIndex))
console.log(`  entityIndex.json: ${entityIndex.length} entries for search`)

// --- 2. Split attributes.json by domain ---
const attributes = JSON.parse(readFileSync(join(DATA, 'attributes.json'), 'utf-8'))
// Build entity→domain lookup
const entityDomainMap = {}
for (const e of entities) {
  entityDomainMap[e.entityId || e.id] = domainSlugs[e.domain] || 'other'
  entityDomainMap[e.entityName || e.name] = domainSlugs[e.domain] || 'other'
}

const attrsByDomain = {}
for (const a of attributes) {
  const slug = entityDomainMap[a.entityId] || entityDomainMap[a.entityName] || 'other'
  if (!attrsByDomain[slug]) attrsByDomain[slug] = []
  attrsByDomain[slug].push(a)
}

mkdirSync(join(DATA, 'attributes'), { recursive: true })
for (const [slug, attrs] of Object.entries(attrsByDomain)) {
  writeFileSync(join(DATA, 'attributes', `${slug}.json`), JSON.stringify(attrs))
  console.log(`  attributes/${slug}.json: ${attrs.length} attributes`)
}

// --- 3. Split relationships.json by domain ---
const relationships = JSON.parse(readFileSync(join(DATA, 'relationships.json'), 'utf-8'))
// Assign relationship to parent's domain (or child's if parent unknown)
const entityIdToDomain = {}
for (const e of entities) {
  entityIdToDomain[e.id] = domainSlugs[e.domain] || 'other'
}

const relsByDomain = {}
for (const r of relationships) {
  const slug = entityIdToDomain[r.parentId] || entityIdToDomain[r.childId] || 'other'
  if (!relsByDomain[slug]) relsByDomain[slug] = []
  relsByDomain[slug].push(r)
}

mkdirSync(join(DATA, 'relationships'), { recursive: true })
for (const [slug, rels] of Object.entries(relsByDomain)) {
  writeFileSync(join(DATA, 'relationships', `${slug}.json`), JSON.stringify(rels))
  console.log(`  relationships/${slug}.json: ${rels.length} relationships`)
}

// --- Summary ---
console.log('\n=== Split Summary ===')
console.log(`Entities: ${entities.length} → ${Object.keys(entitiesByDomain).length} domain files`)
console.log(`Attributes: ${attributes.length} → ${Object.keys(attrsByDomain).length} domain files`)
console.log(`Relationships: ${relationships.length} → ${Object.keys(relsByDomain).length} domain files`)
console.log(`Entity search index: ${entityIndex.length} entries`)
console.log('\nDone! Original files kept for backward compatibility.')
