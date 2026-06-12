'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { nodeLabel } from '@/lib/core'
import { allSpecies, getNode, tree } from '@/lib/data/taxa'
import { useAuth } from '@/state/auth'
import { useLog } from '@/state/log'
import { FruitImage } from './FruitImage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function countRanks(rank: 'FAMILY' | 'ORDER'): number {
  return Object.values(tree.nodes).filter((n) => n.rank === rank).length
}

export function MyPageView() {
  const { user, signInWithGoogle, signOut, configured } = useAuth()
  const { log } = useLog()

  const stats = useMemo(() => {
    const tried = [...log.values()].filter((e) => e.tried)
    const families = new Set<string>()
    const orders = new Set<string>()
    for (const e of tried) {
      const node = getNode(e.taxonId)
      if (node?.ancestors.FAMILY) families.add(node.ancestors.FAMILY)
      if (node?.ancestors.ORDER) orders.add(node.ancestors.ORDER)
    }
    return {
      species: tried.length,
      totalSpecies: allSpecies.length,
      families: families.size,
      totalFamilies: countRanks('FAMILY'),
      orders: orders.size,
      totalOrders: countRanks('ORDER'),
    }
  }, [log])

  const triedList = useMemo(
    () =>
      [...log.values()]
        .filter((e) => e.tried)
        .map((e) => ({ entry: e, node: getNode(e.taxonId) }))
        .filter((x): x is { entry: (typeof x)['entry']; node: NonNullable<(typeof x)['node']> } => !!x.node)
        .sort((a, b) =>
          (b.entry.triedDate ?? '').localeCompare(a.entry.triedDate ?? ''),
        ),
    [log],
  )

  return (
    <div className="p-4 pb-6">
      <header className="mb-4">
        {user ? (
          <div className="flex items-center gap-3">
            {user.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="size-12 rounded-full" src={user.avatarUrl} alt="" />
            )}
            <div>
              <div className="font-bold">{user.name}</div>
              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={signOut}
              >
                ログアウト
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <Button variant="outline" onClick={signInWithGoogle}>
              Google でログイン
            </Button>
            {!configured && (
              <p className="text-muted-foreground text-xs">
                Supabase 未設定のため、記録は端末内に保存されます。
              </p>
            )}
          </div>
        )}
      </header>

      <section className="mb-5 grid grid-cols-3 gap-2.5">
        {[
          { num: stats.species, label: `食べた種 / ${stats.totalSpecies}` },
          { num: stats.families, label: `食べた科 / ${stats.totalFamilies}` },
          { num: stats.orders, label: `食べた目 / ${stats.totalOrders}` },
        ].map((s) => (
          <Card key={s.label} className="gap-1 py-4 text-center">
            <span className="text-primary text-2xl font-extrabold">{s.num}</span>
            <span className="text-muted-foreground text-[11px]">{s.label}</span>
          </Card>
        ))}
      </section>

      <h2 className="mb-3 text-base font-semibold">食べた一覧</h2>
      {triedList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          まだ記録がありません。フルーツの詳細から記録しましょう。
        </p>
      ) : (
        <ul className="space-y-2">
          {triedList.map(({ entry, node }) => (
            <li key={node.id}>
              <Link
                href={`/n/${node.id}`}
                className="bg-card flex items-center gap-2.5 rounded-lg border p-2 active:bg-accent"
              >
                <FruitImage
                  src={node.imageUrl}
                  alt={nodeLabel(node)}
                  className="size-12 shrink-0 rounded-md"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{nodeLabel(node)}</span>
                  <span className="text-muted-foreground text-xs">
                    {entry.rating ? '★'.repeat(entry.rating) : ''}
                    {entry.place ? ` ・ ${entry.place}` : ''}
                    {entry.triedDate ? ` ・ ${entry.triedDate}` : ''}
                  </span>
                </span>
                <ChevronRight className="text-border size-5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
