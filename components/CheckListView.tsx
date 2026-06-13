'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { nodeLabel } from '@/lib/core'
import { allSpecies, getNode } from '@/lib/data/taxa'
import { useLog } from '@/state/log'
import { useAuth } from '@/state/auth'
import { FruitImage } from './FruitImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'untried' | 'tried'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'untried', label: '未食' },
  { key: 'tried', label: '食べた' },
]

// 和名（かな）で安定ソートするための一覧（ビルド時に確定）。
const sortedSpecies = [...allSpecies].sort((a, b) =>
  nodeLabel(a).localeCompare(nodeLabel(b), 'ja'),
)

export function CheckListView() {
  const { log, save, canEdit } = useLog()
  const { signInWithGoogle } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')

  const triedCount = useMemo(
    () => sortedSpecies.filter((s) => log.get(s.id)?.tried).length,
    [log],
  )

  const nq = q.trim().toLowerCase()
  const visible = sortedSpecies.filter((s) => {
    const tried = !!log.get(s.id)?.tried
    if (filter === 'tried' && !tried) return false
    if (filter === 'untried' && tried) return false
    if (nq) {
      const hay = `${s.names.ja ?? ''} ${s.names.en ?? ''} ${s.scientificName}`.toLowerCase()
      if (!hay.includes(nq)) return false
    }
    return true
  })

  const toggle = (id: string, tried: boolean) => {
    if (!canEdit) {
      void signInWithGoogle()
      return
    }
    save(id, { tried: !tried })
  }

  return (
    <div className="p-4 pb-6">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">チェックリスト</h1>
        <span className="text-muted-foreground text-sm">
          食べた <span className="text-primary font-bold">{triedCount}</span> /{' '}
          {sortedSpecies.length}
        </span>
      </header>

      <div className="mb-3">
        <Input
          type="search"
          value={q}
          placeholder="絞り込み（和名・英名・学名）"
          className="h-10 rounded-full"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-3 flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {!canEdit && (
        <div className="bg-muted text-muted-foreground mb-3 rounded-md px-3 py-2 text-xs">
          チェックを保存するにはログインが必要です。
        </div>
      )}

      <ul className="space-y-1.5">
        {visible.map((s) => {
          const tried = !!log.get(s.id)?.tried
          const family = s.ancestors.FAMILY
            ? getNode(s.ancestors.FAMILY)
            : undefined
          return (
            <li key={s.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(s.id, tried)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(s.id, tried)
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors select-none',
                  tried ? 'border-primary/40 bg-primary/5' : 'bg-card active:bg-accent',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md border-2',
                    tried
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/40',
                  )}
                >
                  {tried && <Check className="size-4" strokeWidth={3} />}
                </span>

                <FruitImage
                  src={s.imageUrl}
                  alt={nodeLabel(s)}
                  className="size-10 shrink-0 rounded-md"
                />

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('truncate font-medium', tried && 'text-primary')}>
                    {nodeLabel(s)}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {family ? nodeLabel(family) : s.scientificName}
                  </span>
                </span>

                <Link
                  href={`/n/${s.id}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${nodeLabel(s)}の詳細`}
                  className="text-border hover:text-muted-foreground shrink-0 p-1"
                >
                  <ChevronRight className="size-5" />
                </Link>
              </div>
            </li>
          )
        })}
        {visible.length === 0 && (
          <li className="text-muted-foreground py-6 text-center">
            該当する果物がありません
          </li>
        )}
      </ul>
    </div>
  )
}
