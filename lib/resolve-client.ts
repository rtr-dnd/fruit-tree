import type { Rank, ResolvedRank, ResolvedSpecies } from '@/lib/core'

// ブラウザから GBIF / Wikidata / MediaWiki を直接叩いてフルーツを解決する（§7.4 モデルB）。
// いずれも CORS 許可済み。追加のバックエンドは不要。

function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[×x]\s+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface GbifMatch {
  usageKey: number
  canonicalName: string
  rank: string
  matchType: string
  confidence: number
  ancestors: { rank: Rank; name: string; key: number }[]
}

const RANK_FIELDS: { rank: Rank; nameKey: string; keyKey: string }[] = [
  { rank: 'KINGDOM', nameKey: 'kingdom', keyKey: 'kingdomKey' },
  { rank: 'PHYLUM', nameKey: 'phylum', keyKey: 'phylumKey' },
  { rank: 'CLASS', nameKey: 'class', keyKey: 'classKey' },
  { rank: 'ORDER', nameKey: 'order', keyKey: 'orderKey' },
  { rank: 'FAMILY', nameKey: 'family', keyKey: 'familyKey' },
  { rank: 'GENUS', nameKey: 'genus', keyKey: 'genusKey' },
]

async function gbifMatch(name: string): Promise<GbifMatch | null> {
  const res = await fetch(
    `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`,
  )
  const d = (await res.json()) as Record<string, unknown>
  if (d.usageKey == null) return null
  const ancestors: GbifMatch['ancestors'] = []
  for (const f of RANK_FIELDS) {
    const nm = d[f.nameKey]
    const key = d[f.keyKey]
    if (typeof nm === 'string' && typeof key === 'number') {
      ancestors.push({ rank: f.rank, name: nm, key })
    }
  }
  return {
    usageKey: d.usageKey as number,
    canonicalName: (d.canonicalName as string) ?? name,
    rank: (d.rank as string) ?? 'UNKNOWN',
    matchType: (d.matchType as string) ?? 'UNKNOWN',
    confidence: (d.confidence as number) ?? 0,
    ancestors,
  }
}

const isBinomial = (q: string) => /^[A-Z][a-z]+ [a-z×]+/.test(q.trim())

/** Wikidata でラベル（和名など）→ 学名(P225) を引く。日本語入力対応のため。 */
async function scientificNameFromLabel(query: string): Promise<string | null> {
  for (const lang of ['ja', 'en']) {
    const url =
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*` +
      `&language=${lang}&uselang=${lang}&type=item&limit=5&search=${encodeURIComponent(query)}`
    const res = await fetch(url)
    const data = (await res.json()) as { search?: { id: string }[] }
    for (const hit of data.search ?? []) {
      const sci = await taxonNameOfEntity(hit.id)
      if (sci) return sci
    }
  }
  return null
}

/** エンティティが分類群なら学名(P225)を返す。 */
async function taxonNameOfEntity(qid: string): Promise<string | null> {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&origin=*` +
    `&property=P225&entity=${qid}`
  const res = await fetch(url)
  const data = (await res.json()) as {
    claims?: { P225?: { mainsnak?: { datavalue?: { value?: string } } }[] }
  }
  return data.claims?.P225?.[0]?.mainsnak?.datavalue?.value ?? null
}

interface WdMeta {
  ja?: string
  en?: string
  imageUrl?: string
  jaTitle?: string
  enTitle?: string
}

function toThumb(commonsUrl: string, width = 480): string {
  const https = commonsUrl.replace(/^http:/, 'https:')
  return https.includes('?') ? https : `${https}?width=${width}`
}

async function wikidataMetaByKeys(keys: number[]): Promise<Map<number, WdMeta>> {
  const out = new Map<number, WdMeta>()
  if (keys.length === 0) return out
  const values = [...new Set(keys)].map((k) => `"${k}"`).join(' ')
  const query = `SELECT ?gbif ?jaName ?enName ?image ?jaTitle ?enTitle WHERE {
  VALUES ?gbif { ${values} }
  ?item wdt:P846 ?gbif.
  OPTIONAL { ?item wdt:P18 ?image. }
  OPTIONAL { ?item rdfs:label ?jaName. FILTER(LANG(?jaName)="ja") }
  OPTIONAL { ?item rdfs:label ?enName. FILTER(LANG(?enName)="en") }
  OPTIONAL { ?ja schema:about ?item; schema:isPartOf <https://ja.wikipedia.org/>; schema:name ?jaTitle. }
  OPTIONAL { ?en schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enTitle. }
}`
  const res = await fetch(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`,
    { headers: { Accept: 'application/sparql-results+json' } },
  )
  const json = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] }
  }
  for (const b of json.results.bindings) {
    const gbif = Number(b.gbif?.value)
    if (!Number.isFinite(gbif)) continue
    const m = out.get(gbif) ?? {}
    if (b.jaName?.value) m.ja = b.jaName.value
    if (b.enName?.value) m.en = b.enName.value
    if (b.image?.value && !m.imageUrl) m.imageUrl = toThumb(b.image.value)
    if (b.jaTitle?.value) m.jaTitle = b.jaTitle.value
    if (b.enTitle?.value) m.enTitle = b.enTitle.value
    out.set(gbif, m)
  }
  return out
}

async function mediawikiExtract(
  lang: string,
  title: string,
): Promise<{ description?: string; wikipediaUrl?: string } | null> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}`
  const res = await fetch(url)
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { title: string; extract?: string }> }
  }
  const page = Object.values(data.query?.pages ?? {})[0]
  if (!page) return null
  return {
    description: page.extract?.trim() || undefined,
    wikipediaUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
      page.title.replace(/ /g, '_'),
    )}`,
  }
}

export interface ResolveResult {
  ok: boolean
  message?: string
  gbifUsageKey?: number
  matchType?: string
  confidence?: number
  resolved?: ResolvedSpecies
}

/**
 * 名前（和名・英名・学名）→ ResolvedSpecies を解決。
 * 学名でなければ Wikidata ラベル検索で学名に変換してから GBIF にかける。
 */
export async function resolveFruit(query: string): Promise<ResolveResult> {
  const q = query.trim()
  if (!q) return { ok: false, message: '名前を入力してください' }

  // 1. 学名らしければ直接、そうでなければラベル→学名に変換してから GBIF。
  let match = isBinomial(q) ? await gbifMatch(q) : null
  if (!match || match.rank !== 'SPECIES') {
    const sci = await scientificNameFromLabel(q)
    if (sci) match = await gbifMatch(sci)
  }
  if (!match) {
    return { ok: false, message: 'GBIF で見つかりませんでした。学名で試してください。' }
  }
  if (match.rank !== 'SPECIES') {
    return {
      ok: false,
      message: `種として解決できませんでした（rank=${match.rank}）。学名で試してください。`,
    }
  }

  // 2. Wikidata で和名・画像・WP リンク（種＋祖先）。
  const keys = [match.usageKey, ...match.ancestors.map((a) => a.key)]
  const wd = await wikidataMetaByKeys(keys).catch(() => new Map<number, WdMeta>())
  const sm = wd.get(match.usageKey)

  // 3. 説明文（ja 優先 / en）。
  let extract: { description?: string; wikipediaUrl?: string } | null = null
  if (sm?.jaTitle) extract = await mediawikiExtract('ja', sm.jaTitle).catch(() => null)
  else if (sm?.enTitle) extract = await mediawikiExtract('en', sm.enTitle).catch(() => null)

  const classification: ResolvedRank[] = match.ancestors.map((a) => {
    const m = wd.get(a.key)
    return {
      rank: a.rank,
      id: slugify(a.name),
      scientificName: a.name,
      names: { ja: m?.ja ?? null, en: m?.en ?? a.name },
      imageUrl: m?.imageUrl ?? null,
    }
  })

  const ja = sm?.ja ?? null
  const resolved: ResolvedSpecies = {
    id: slugify(match.canonicalName),
    scientificName: match.canonicalName,
    names: { ja: ja ?? match.canonicalName, en: sm?.en ?? null },
    imageUrl: sm?.imageUrl ?? null,
    wikipediaUrl: extract?.wikipediaUrl ?? null,
    description: extract?.description ?? null,
    // 入力語が和名と違えば別名に（検索性 §4.4）。
    searchAliases: [q, sm?.en].filter(
      (x): x is string => !!x && x !== (ja ?? match!.canonicalName),
    ),
    classification,
  }

  return {
    ok: true,
    gbifUsageKey: match.usageKey,
    matchType: match.matchType,
    confidence: match.confidence,
    resolved,
  }
}
