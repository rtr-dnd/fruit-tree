/** 学名 → 安定 slug（小文字・空白/記号をハイフン化）。同一祖先は同一 slug になる。 */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // ダイアクリティカルマーク除去
    .toLowerCase()
    .replace(/[×x]\s+/g, '') // 雑種記号
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
