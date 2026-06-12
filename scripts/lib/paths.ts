import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** 解決済み ResolvedSpecies[] の保存先（resolve → build-taxa の受け渡し）。 */
export const RESOLVED_PATH = join(here, '..', '.cache', 'resolved.json')

/** アプリにバンドルする静的分類ツリー。 */
export const TAXA_OUT_PATH = join(here, '..', '..', 'src', 'data', 'taxa.json')
