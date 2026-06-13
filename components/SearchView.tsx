'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { nodeLabel, search } from '@/lib/core'
import { RANK_JA } from '@/lib/labels'
import { useTree } from '@/state/tree'
import { useLog } from '@/state/log'
import { FruitImage } from './FruitImage'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function SearchView() {
  const [q, setQ] = useState('')
  const { searchIndex } = useTree()
  const { log } = useLog()
  const results = useMemo(() => search(q, searchIndex, 60), [q, searchIndex])

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
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-muted-foreground">「{q}」は収録されていません。</p>
          <Button asChild>
            <Link href={`/add?q=${encodeURIComponent(q.trim())}`}>
              <Plus className="size-4" />「{q.trim()}」を追加する
            </Link>
          </Button>
          <p className="text-muted-foreground text-xs">
            学名や英名でも探せます。
          </p>
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
