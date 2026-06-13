'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight } from 'lucide-react'
import { nodeLabel, type TaxonNode } from '@/lib/core'
import { useLog } from '@/state/log'
import { useAuth } from '@/state/auth'
import { FruitImage } from './FruitImage'
import { cn } from '@/lib/utils'

/**
 * 種（フルーツ）1件の行。サムネ＋和名＋サブ情報＋チェックトグル。
 * チェックマークだけがトグル、それ以外をタップすると詳細へ遷移。
 * ツリー（属配下）とリストで共用。
 */
export function SpeciesRow({
  node,
  subtitle,
}: {
  node: TaxonNode
  subtitle?: ReactNode
}) {
  const router = useRouter()
  const { log, save, canEdit } = useLog()
  const { signInWithGoogle } = useAuth()
  const tried = !!log.get(node.id)?.tried
  const sub = subtitle ?? node.names.en ?? node.scientificName

  const toggle = () => {
    if (!canEdit) {
      void signInWithGoogle()
      return
    }
    save(node.id, { tried: !tried })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/n/${node.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/n/${node.id}`)
      }}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors select-none',
        tried ? 'border-primary/40 bg-primary/5' : 'bg-card active:bg-accent',
      )}
    >
      <button
        type="button"
        aria-label={tried ? '食べた済みを解除' : '食べたにする'}
        aria-pressed={tried}
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        className={cn(
          'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-2',
          tried
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40 hover:border-primary/60',
        )}
      >
        {tried && <Check className="size-5" strokeWidth={3} />}
      </button>

      <FruitImage
        src={node.imageUrl}
        alt={nodeLabel(node)}
        className="size-12 shrink-0 rounded-md"
      />

      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate font-medium', tried && 'text-primary')}>
          {nodeLabel(node)}
        </span>
        {sub && (
          <span className="text-muted-foreground truncate text-xs">{sub}</span>
        )}
      </span>

      <ChevronRight className="text-border size-5 shrink-0" />
    </div>
  )
}
