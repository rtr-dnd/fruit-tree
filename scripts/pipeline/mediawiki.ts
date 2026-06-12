import { cachedGet } from '../lib/http'

export interface Extract {
  description?: string
  thumbnail?: string
  wikipediaUrl?: string
}

interface MwPage {
  title: string
  extract?: string
  thumbnail?: { source: string }
}

interface MwResponse {
  query?: {
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
    pages?: Record<string, MwPage>
  }
}

/**
 * MediaWiki Action API で説明文抜粋＋サムネを取得（§7.2）。
 * 旧 RESTBase 系は不採用。titles はバッチ（最大20）。
 */
export async function extractsByTitles(
  lang: string,
  titles: string[],
): Promise<Map<string, Extract>> {
  const result = new Map<string, Extract>()
  const unique = [...new Set(titles.filter(Boolean))]

  const CHUNK = 20
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK)
    const body = await cachedGet(`https://${lang}.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        prop: 'extracts|pageimages',
        exintro: '1',
        explaintext: '1',
        exlimit: '20',
        piprop: 'thumbnail',
        pithumbsize: '480',
        redirects: '1',
        titles: chunk.join('|'),
      },
      politeDelayMs: 400,
    })

    const json = JSON.parse(body) as MwResponse
    const q = json.query
    if (!q?.pages) continue

    const normalized = new Map((q.normalized ?? []).map((n) => [n.from, n.to]))
    const redirects = new Map((q.redirects ?? []).map((r) => [r.from, r.to]))
    const pagesByTitle = new Map<string, MwPage>()
    for (const p of Object.values(q.pages)) pagesByTitle.set(p.title, p)

    for (const requested of chunk) {
      const t1 = normalized.get(requested) ?? requested
      const t2 = redirects.get(t1) ?? t1
      const page = pagesByTitle.get(t2)
      if (!page) continue
      const extract: Extract = {}
      if (page.extract) extract.description = page.extract.trim()
      if (page.thumbnail?.source) extract.thumbnail = page.thumbnail.source
      extract.wikipediaUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
        t2.replace(/ /g, '_'),
      )}`
      result.set(requested, extract)
    }
  }

  return result
}
