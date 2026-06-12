import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(__dirname, '..', '.cache', 'http')

const CONTACT = process.env.PIPELINE_CONTACT || 'skysoyn@gmail.com'
// §7.2 必須事項：連絡先を含む meaningful な User-Agent。
export const USER_AGENT = `fruit-tree-pipeline/0.1 (+${CONTACT})`

function cachePath(key: string): string {
  const hash = createHash('sha1').update(key).digest('hex')
  return join(CACHE_DIR, `${hash}.json`)
}

async function readCache(key: string): Promise<string | null> {
  try {
    return await readFile(cachePath(key), 'utf8')
  } catch {
    return null
  }
}

async function writeCache(key: string, body: string): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(cachePath(key), body, 'utf8')
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface FetchOptions {
  /** キャッシュ識別子（既定は url）。POSTボディ等を含めたいとき用。 */
  cacheKey?: string
  /** リクエスト間の最小待機(ms)。レート制限対策（§7.2）。 */
  politeDelayMs?: number
  accept?: string
  /** GET パラメータ（URLSearchParams 化）。 */
  params?: Record<string, string>
  retries?: number
}

let lastRequestAt = 0

/** キャッシュ付き GET。JSON文字列を返す。低頻度＋キャッシュ前提（§7.1）。 */
export async function cachedGet(
  baseUrl: string,
  opts: FetchOptions = {},
): Promise<string> {
  const url = opts.params
    ? `${baseUrl}?${new URLSearchParams(opts.params).toString()}`
    : baseUrl
  const key = opts.cacheKey ?? url

  const cached = await readCache(key)
  if (cached !== null) return cached

  const delay = opts.politeDelayMs ?? 300
  const wait = lastRequestAt + delay - Date.now()
  if (wait > 0) await sleep(wait)

  const retries = opts.retries ?? 3
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      lastRequestAt = Date.now()
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: opts.accept ?? 'application/json',
        },
      })
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`)
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} (no retry)`)
      const body = await res.text()
      await writeCache(key, body)
      return body
    } catch (err) {
      lastErr = err
      const backoff = 800 * (attempt + 1)
      console.warn(`  ! fetch失敗 (${attempt + 1}/${retries + 1}): ${String(err)} — ${backoff}ms後に再試行`)
      await sleep(backoff)
    }
  }
  throw new Error(`fetch 失敗: ${url}\n${String(lastErr)}`)
}
