import { cachedGet } from '../lib/http'

export interface WikidataMeta {
  qid: string
  ja?: string
  en?: string
  imageUrl?: string
  jaTitle?: string
  enTitle?: string
}

/** P18 の commons URL → サムネ URL に整形。 */
function toThumb(commonsUrl: string, width = 480): string {
  const https = commonsUrl.replace(/^http:/, 'https:')
  return https.includes('?') ? https : `${https}?width=${width}`
}

interface SparqlBinding {
  [k: string]: { value: string } | undefined
}

/**
 * GBIF usageKey 群 → Wikidata メタ（和名/英名/画像/各WPサイトリンク）。
 * P846（GBIF taxon ID）で突き合わせるため、名前の表記ゆれに左右されない（§7.2）。
 */
export async function metadataByGbifKeys(
  keys: number[],
): Promise<Map<number, WikidataMeta>> {
  const result = new Map<number, WikidataMeta>()
  const unique = [...new Set(keys)]

  // URL長対策のためチャンク分割。
  const CHUNK = 50
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK)
    const values = chunk.map((k) => `"${k}"`).join(' ')
    const query = `
SELECT ?gbif ?item ?jaName ?enName ?image ?jaTitle ?enTitle WHERE {
  VALUES ?gbif { ${values} }
  ?item wdt:P846 ?gbif.
  OPTIONAL { ?item wdt:P18 ?image. }
  OPTIONAL { ?item rdfs:label ?jaName. FILTER(LANG(?jaName)="ja") }
  OPTIONAL { ?item rdfs:label ?enName. FILTER(LANG(?enName)="en") }
  OPTIONAL { ?ja schema:about ?item; schema:isPartOf <https://ja.wikipedia.org/>; schema:name ?jaTitle. }
  OPTIONAL { ?en schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enTitle. }
}`.trim()

    const body = await cachedGet('https://query.wikidata.org/sparql', {
      params: { query, format: 'json' },
      accept: 'application/sparql-results+json',
      politeDelayMs: 1000,
    })

    const json = JSON.parse(body) as {
      results: { bindings: SparqlBinding[] }
    }

    for (const b of json.results.bindings) {
      const gbif = Number(b.gbif?.value)
      if (!Number.isFinite(gbif)) continue
      const existing = result.get(gbif) ?? {
        qid: b.item?.value.split('/').pop() ?? '',
      }
      if (b.jaName?.value) existing.ja = b.jaName.value
      if (b.enName?.value) existing.en = b.enName.value
      if (b.image?.value && !existing.imageUrl)
        existing.imageUrl = toThumb(b.image.value)
      if (b.jaTitle?.value) existing.jaTitle = b.jaTitle.value
      if (b.enTitle?.value) existing.enTitle = b.enTitle.value
      result.set(gbif, existing)
    }
  }

  return result
}
