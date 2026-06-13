import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** 解決済み ResolvedSpecies[] の保存先（resolve → build-taxa の受け渡し）。 */
export const RESOLVED_PATH = join(here, '..', '.cache', 'resolved.json')

/** アプリにバンドルする静的分類ツリー。 */
export const TAXA_OUT_PATH = join(here, '..', '..', 'lib', 'data', 'taxa.json')

/** 種ごとの「追加日・追加順」台帳（コミット対象。新規種のみ追記）。 */
export const ADDED_DATES_PATH = join(here, '..', '..', 'lib', 'data', 'added-dates.json')
