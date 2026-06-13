'use client'

import { coverage, type TaxonNode } from '@/lib/core'
import { useTree } from '@/state/tree'
import { useLog } from '@/state/log'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * 制覇バッジ（§4.1 / §5.5）。
 * 生で食べた数を主に表示（緑）、加工品でも食べた数があれば余白に応じて補足（黄）。
 * - detailed: ヘッダ等の広い場所向け（「生 2/3 ・ 計 3/3」）
 * - 既定(compact): 行内向け（「2/3」＋「+1」）
 */
export function CoverageBadge({
  node,
  detailed = false,
}: {
  node: TaxonNode
  detailed?: boolean
}) {
  const { tree } = useTree()
  const { log, hydrated } = useLog()
  if (!hydrated) return <Skeleton className="h-5 w-12 rounded-md" />

  const cov = coverage(tree, node, log)

  if (cov.any === 0) {
    return <Badge variant="outline">未踏</Badge>
  }

  const green = 'bg-primary text-primary-foreground'
  const amber = 'bg-[var(--amber)] text-white'
  const pill = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium'

  // 生をまだ食べていない（加工品のみ）→ 黄一色。
  if (cov.raw === 0) {
    return (
      <span className={`${pill} ${amber}`}>
        {detailed ? `加工 ${cov.processed}/${cov.total}` : `${cov.processed}/${cov.total}`}
      </span>
    )
  }

  // 生で食べた数（緑）＋ 加工品も含めた「どちらか」数（黄）。
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`${pill} ${green}`}>
        {detailed ? `生 ${cov.raw}/${cov.total}` : `${cov.raw}/${cov.total}`}
      </span>
      {cov.processed > 0 && (
        <span className={`${pill} ${amber}`}>
          {detailed ? `計 ${cov.any}/${cov.total}` : `+${cov.processed}`}
        </span>
      )}
    </span>
  )
}
