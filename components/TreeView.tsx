'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { nodeLabel, untrodden, type TaxonNode } from '@/lib/core'
import { getNode, tree } from '@/lib/data/taxa'
import { RANK_JA } from '@/lib/labels'
import { useLog } from '@/state/log'
import { Breadcrumb } from './Breadcrumb'
import { CoverageBadge } from './CoverageBadge'
import { Preview } from './Preview'
import { SyncBanner } from './SyncBanner'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function TreeView({ node }: { node: TaxonNode }) {
  const router = useRouter()
  const { log } = useLog()
  const [onlyUntrodden, setOnlyUntrodden] = useState(false)

  const children = useMemo(
    () =>
      node.childrenIds
        .map((id) => getNode(id))
        .filter((n): n is TaxonNode => !!n),
    [node],
  )

  const untroddenFlags = useMemo(
    () => new Map(children.map((c) => [c.id, untrodden(tree, c, log)])),
    [children, log],
  )

  const untroddenCount = children.filter((c) => untroddenFlags.get(c.id)).length
  const visible = onlyUntrodden
    ? children.filter((c) => untroddenFlags.get(c.id))
    : children

  const childRank = children[0]?.rank
  const childRankJa = childRank ? RANK_JA[childRank] : 'グループ'

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
        <CoverageBadge node={node} />
      </header>

      {children.length > 0 && (
        <div className="bg-card mb-3 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm">
          <Label className="cursor-pointer">
            <Switch checked={onlyUntrodden} onCheckedChange={setOnlyUntrodden} />
            未踏のみ表示
          </Label>
          <span className="text-muted-foreground">
            未踏の{childRankJa} {untroddenCount} / 総 {children.length}
          </span>
        </div>
      )}

      <ul className="space-y-2.5">
        {visible.map((child) => (
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
            {child.rank !== 'SPECIES' && <Preview node={child} />}
            <ChevronRight className="text-border absolute top-1/2 right-2 size-5 -translate-y-1/2" />
          </li>
        ))}
        {visible.length === 0 && (
          <li className="text-muted-foreground py-6 text-center">
            {onlyUntrodden ? '未踏の枝はありません 🎉' : '配下のノードがありません'}
          </li>
        )}
      </ul>
    </div>
  )
}
