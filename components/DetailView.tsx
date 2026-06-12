'use client'

import { Check } from 'lucide-react'
import { nodeLabel, type TaxonNode } from '@/lib/core'
import { useLog } from '@/state/log'
import { Breadcrumb } from './Breadcrumb'
import { FruitImage } from './FruitImage'
import { RecordEditor } from './RecordEditor'
import { RelationshipList } from './RelationshipList'
import { SyncBanner } from './SyncBanner'
import { Badge } from '@/components/ui/badge'

export function DetailView({ node }: { node: TaxonNode }) {
  const { get } = useLog()
  const entry = get(node.id)

  return (
    <div className="p-4 pb-6">
      <SyncBanner />
      <Breadcrumb node={node} />

      <div className="mb-4">
        <FruitImage
          src={node.imageUrl}
          alt={nodeLabel(node)}
          className="h-56 w-full rounded-xl"
        />
        <div className="mt-3">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
            {node.names.ja || node.scientificName}
            {entry?.tried && (
              <Badge className="gap-1">
                <Check className="size-3" /> 食べた
              </Badge>
            )}
          </h1>
          {node.names.en && <p className="text-sm">{node.names.en}</p>}
          <p className="text-muted-foreground text-sm italic">
            {node.scientificName}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <RecordEditor node={node} />
      </div>

      {node.description && (
        <section className="bg-card mb-4 rounded-xl border p-4 text-sm">
          <p className="whitespace-pre-line">{node.description}</p>
          {node.wikipediaUrl && (
            <a
              href={node.wikipediaUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary mt-2.5 inline-block font-semibold"
            >
              Wikipedia で読む →
            </a>
          )}
        </section>
      )}

      <h2 className="mb-3 text-base font-semibold">近い仲間</h2>
      <RelationshipList node={node} />
    </div>
  )
}
