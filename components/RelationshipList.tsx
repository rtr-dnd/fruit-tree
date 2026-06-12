'use client'

import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { buildRelationshipList, nodeLabel, type TaxonNode } from '@/lib/core'
import { tree } from '@/lib/data/taxa'
import { useLog } from '@/state/log'
import { Badge } from '@/components/ui/badge'
import { FruitImage } from './FruitImage'

/** 関係リスト（近い順・見出しグルーピング / §4.2・§5.3）。 */
export function RelationshipList({ node }: { node: TaxonNode }) {
  const { log } = useLog()
  const rel = buildRelationshipList(node.id, tree, log)

  if (rel.sections.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        <p>収録データ内に近縁の仲間が見つかりませんでした。</p>
        {rel.furtherCount > 0 && (
          <p className="mt-1 text-xs">より遠い仲間: {rel.furtherCount} 種</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {rel.sections.map((section) => (
        <section key={section.bucket}>
          <h3 className="border-primary text-primary mb-2.5 border-l-4 pl-2 text-sm font-semibold">
            {section.label}
          </h3>
          <div className="space-y-3">
            {section.groups.map((group) => (
              <div key={group.id || section.bucket}>
                {section.grouped && group.headingLabel && (
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                    <Link href={`/n/${group.id}`} className="hover:underline">
                      {group.headingLabel}
                    </Link>
                    {group.untrodden && <Badge variant="outline">未踏</Badge>}
                  </div>
                )}
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.node.id}>
                      <Link
                        href={`/n/${item.node.id}`}
                        className="bg-card flex items-center gap-2.5 rounded-lg border p-2 active:bg-accent"
                      >
                        <FruitImage
                          src={item.node.imageUrl}
                          alt={nodeLabel(item.node)}
                          className="size-12 shrink-0 rounded-md"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="font-semibold">
                            {item.tried && (
                              <Check className="text-primary mr-0.5 inline size-4" />
                            )}
                            {nodeLabel(item.node)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {item.closeness}
                          </span>
                        </span>
                        <ChevronRight className="text-border size-5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
      {rel.furtherCount > 0 && (
        <p className="text-muted-foreground text-xs">
          目より遠い仲間（別の目）: {rel.furtherCount} 種は省略
        </p>
      )}
    </div>
  )
}
