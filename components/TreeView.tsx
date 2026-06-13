'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { nodeLabel, untrodden, type TaxonNode } from '@/lib/core'
import { RANK_JA } from '@/lib/labels'
import { useTree } from '@/state/tree'
import { useLog } from '@/state/log'
import { Breadcrumb } from './Breadcrumb'
import { CoverageBadge } from './CoverageBadge'
import { Preview } from './Preview'
import { SpeciesRow } from './SpeciesRow'
import { SyncBanner } from './SyncBanner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function TreeView({ node }: { node: TaxonNode }) {
  const router = useRouter()
  const { tree, getNode } = useTree()
  const { log } = useLog()

  const children = useMemo(
    () =>
      node.childrenIds
        .map((id) => getNode(id))
        .filter((n): n is TaxonNode => !!n),
    [node, getNode],
  )

  const untroddenFlags = useMemo(
    () => new Map(children.map((c) => [c.id, untrodden(tree, c, log)])),
    [children, log, tree],
  )

  return (
    <div className="p-4 pb-6">
      <SyncBanner />
      <Breadcrumb node={node} />

      <header className="mb-3 flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          {nodeLabel(node)}
          <Badge variant="secondary" className="font-normal">
            {RANK_JA[node.rank]}
          </Badge>
        </h1>
        <CoverageBadge node={node} detailed />
      </header>

      <ul className="space-y-2.5">
        {children.map((child) =>
          // 種は果物カード行（サムネ＋チェック）、内部ノードは制覇バッジ＋プレビュー。
          child.rank === 'SPECIES' ? (
            <li key={child.id}>
              <SpeciesRow node={child} />
            </li>
          ) : (
            <li
              key={child.id}
              onClick={() => router.push(`/n/${child.id}`)}
              className={cn(
                'bg-card relative cursor-pointer rounded-xl border p-3 pr-7 active:bg-accent',
                untroddenFlags.get(child.id) && 'border-dashed',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                  {nodeLabel(child)}
                  <Badge variant="secondary" className="ml-1.5 font-normal">
                    {RANK_JA[child.rank]}
                  </Badge>
                </span>
                <CoverageBadge node={child} />
              </div>
              <Preview node={child} />
              <ChevronRight className="text-border absolute top-1/2 right-2 size-5 -translate-y-1/2" />
            </li>
          ),
        )}
        {children.length === 0 && (
          <li className="text-muted-foreground py-6 text-center">
            配下のノードがありません
          </li>
        )}
      </ul>
    </div>
  )
}
