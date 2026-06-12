'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { nodeLabel, representativePreview, type TaxonNode } from '@/lib/core'
import { tree } from '@/lib/data/taxa'
import { useLog } from '@/state/log'
import { cn } from '@/lib/utils'
import { FruitImage } from './FruitImage'

/** 果物プレビュー：代表サムネ（食べた種を優先・強調 / §4.1・§5.6）。 */
export function Preview({ node }: { node: TaxonNode }) {
  const { log } = useLog()
  const picks = representativePreview(tree, node, log, 4)
  if (picks.length === 0) return null
  return (
    <div className="mt-2.5 flex gap-2 overflow-x-auto">
      {picks.map((p) => (
        <Link
          key={p.node.id}
          href={`/n/${p.node.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn('w-16 shrink-0 text-center', !p.tried && 'opacity-60')}
        >
          <FruitImage
            src={p.node.imageUrl}
            alt={nodeLabel(p.node)}
            className="size-16 rounded-lg"
          />
          <span className="mt-0.5 block truncate text-[10px]">
            {p.tried && <Check className="text-primary mr-0.5 inline size-3" />}
            {nodeLabel(p.node)}
          </span>
        </Link>
      ))}
    </div>
  )
}
