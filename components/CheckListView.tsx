'use client'

import { useMemo } from 'react'
import { nodeLabel } from '@/lib/core'
import { useTree } from '@/state/tree'
import { useLog } from '@/state/log'
import { SpeciesRow } from './SpeciesRow'

function formatAdded(iso?: string): string {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}

export function CheckListView() {
  const { getNode, allSpecies } = useTree()
  const { log } = useLog()

  // 最近追加された順（addedSeq 降順）。同値・未設定は和名順で安定化。
  const sortedSpecies = useMemo(
    () =>
      [...allSpecies].sort((a, b) => {
        const d = (b.addedSeq ?? 0) - (a.addedSeq ?? 0)
        return d !== 0 ? d : nodeLabel(a).localeCompare(nodeLabel(b), 'ja')
      }),
    [allSpecies],
  )

  const triedCount = useMemo(
    () => sortedSpecies.filter((s) => log.get(s.id)?.tried).length,
    [log, sortedSpecies],
  )

  return (
    <div className="p-4 pb-6">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">リスト</h1>
        <span className="text-muted-foreground text-sm">
          食べた <span className="text-primary font-bold">{triedCount}</span> /{' '}
          {sortedSpecies.length}
        </span>
      </header>

      <ul className="space-y-1.5">
        {sortedSpecies.map((s) => {
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
      </ul>
    </div>
  )
}
