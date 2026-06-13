'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { nodeLabel, type TaxonNode } from '@/lib/core'
import { useTree } from '@/state/tree'

/** パンくず（§4.1）。タップで任意の祖先に戻れる。 */
export function Breadcrumb({ node }: { node: TaxonNode }) {
  const { getNode } = useTree()
  const ancestors = node.lineage
    .map((id) => getNode(id))
    .filter((n): n is TaxonNode => !!n)
  return (
    <nav
      className="text-muted-foreground mb-3 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs"
      aria-label="パンくず"
    >
      {ancestors.map((a) => (
        <span key={a.id} className="flex items-center gap-1">
          <Link href={`/n/${a.id}`} className="hover:text-foreground">
            {nodeLabel(a)}
          </Link>
          <ChevronRight className="text-border size-3" />
        </span>
      ))}
      <span className="text-foreground font-semibold">{nodeLabel(node)}</span>
    </nav>
  )
}
