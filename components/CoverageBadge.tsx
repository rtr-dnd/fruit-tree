'use client'

import { coverage, type TaxonNode } from '@/lib/core'
import { useTree } from '@/state/tree'
import { useLog } from '@/state/log'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

/** 制覇バッジ：配下の「食べた数 / 総数」（§4.1 / §5.5）。 */
export function CoverageBadge({ node }: { node: TaxonNode }) {
  const { tree } = useTree()
  const { log, hydrated } = useLog()
  if (!hydrated) return <Skeleton className="h-5 w-12 rounded-md" />
  const cov = coverage(tree, node, log)
  const untrodden = cov.tried === 0
  return (
    <Badge variant={untrodden ? 'outline' : 'default'}>
      {untrodden ? '未踏' : `${cov.tried}/${cov.total}`}
    </Badge>
  )
}
