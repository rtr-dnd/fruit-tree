'use client'

import { useMemo, useState } from 'react'
import { nodeLabel } from '@/lib/core'
import { allSpecies, getNode } from '@/lib/data/taxa'
import { useLog } from '@/state/log'
import { SpeciesRow } from './SpeciesRow'
import { Input } from '@/components/ui/input'

// 最近追加された順（addedSeq 降順）に並べる。同値や未設定は和名順で安定化。
const sortedSpecies = [...allSpecies].sort((a, b) => {
  const d = (b.addedSeq ?? 0) - (a.addedSeq ?? 0)
  return d !== 0 ? d : nodeLabel(a).localeCompare(nodeLabel(b), 'ja')
})

function formatAdded(iso?: string): string {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}

export function CheckListView() {
  const { log } = useLog()
  const [q, setQ] = useState('')

  const triedCount = useMemo(
    () => sortedSpecies.filter((s) => log.get(s.id)?.tried).length,
    [log],
  )

  const nq = q.trim().toLowerCase()
  const visible = nq
    ? sortedSpecies.filter((s) =>
        `${s.names.ja ?? ''} ${s.names.en ?? ''} ${s.scientificName} ${(s.searchAliases ?? []).join(' ')}`
          .toLowerCase()
          .includes(nq),
      )
    : sortedSpecies

  return (
    <div className="p-4 pb-6">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">リスト</h1>
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

      <ul className="space-y-1.5">
        {visible.map((s) => {
          const family = s.ancestors.FAMILY ? getNode(s.ancestors.FAMILY) : undefined
          const added = formatAdded(s.addedAt)
          const subtitle =
            (family ? nodeLabel(family) : s.scientificName) +
            (added ? ` ・ 追加 ${added}` : '')
          return (
            <li key={s.id}>
              <SpeciesRow node={s} subtitle={subtitle} />
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
