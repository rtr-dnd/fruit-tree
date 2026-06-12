'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { nodeLabel, search } from '@/lib/core'
import { searchIndex } from '@/lib/data/taxa'
import { RANK_JA } from '@/lib/labels'
import { useLog } from '@/state/log'
import { FruitImage } from './FruitImage'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function SearchView() {
  const [q, setQ] = useState('')
  const { log } = useLog()
  const results = useMemo(() => search(q, searchIndex, 60), [q])

  return (
    <div className="p-4 pb-6">
      <div className="mb-4">
        <Input
          type="search"
          value={q}
          autoFocus
          placeholder="和名・英名・学名で検索"
          className="h-12 rounded-full text-base"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {q.trim().length > 0 && results.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <p>「{q}」に該当なし。</p>
          <p className="mt-1 text-xs">学名や英名でも試してみてください。</p>
        </div>
      )}

      <ul className="space-y-2">
        {results.map((r) => {
          const tried = log.get(r.node.id)?.tried
          return (
            <li key={r.node.id}>
              <Link
                href={`/n/${r.node.id}`}
                className="bg-card flex items-center gap-2.5 rounded-lg border p-2 active:bg-accent"
              >
                <FruitImage
                  src={r.node.imageUrl}
                  alt={nodeLabel(r.node)}
                  className="size-12 shrink-0 rounded-md"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">
                    {tried && <Check className="text-primary mr-0.5 inline size-4" />}
                    {nodeLabel(r.node)}
                    <Badge variant="secondary" className="ml-1.5 font-normal">
                      {RANK_JA[r.node.rank]}
                    </Badge>
                  </span>
                  {r.node.names.en && (
                    <span className="text-muted-foreground text-xs">
                      {r.node.names.en}
                    </span>
                  )}
                </span>
                <ChevronRight className="text-border size-5" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
