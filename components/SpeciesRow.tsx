'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Package } from 'lucide-react'
import { nodeLabel, type TaxonNode } from '@/lib/core'
import { useLog } from '@/state/log'
import { useAuth } from '@/state/auth'
import { FruitImage } from './FruitImage'
import { cn } from '@/lib/utils'

/**
 * 種（フルーツ）1件の行。サムネ＋和名＋サブ情報＋チェック。
 * チェックは「食べてない → 生で食べた → 加工品を食べた → …」を循環。
 * それ以外をタップすると詳細へ遷移。ツリー（属配下）とリストで共用。
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
  const entry = log.get(node.id)
  const tried = !!entry?.tried
  // 旧データ（tried・form無し）は「生」とみなす。
  const form = entry?.form ?? (tried ? 'raw' : null)
  const sub = subtitle ?? node.names.en ?? node.scientificName

  // 食べてない → 生 → 加工品 → 食べてない。
  const cycle = () => {
    if (!canEdit) {
      void signInWithGoogle()
      return
    }
    if (!tried) save(node.id, { form: 'raw' })
    else if (form === 'raw') save(node.id, { form: 'processed' })
    else save(node.id, { tried: false })
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
        aria-label={
          !tried
            ? '生で食べたにする'
            : form === 'raw'
              ? '加工品を食べたにする'
              : '食べてないに戻す'
        }
        aria-pressed={tried}
        onClick={(e) => {
          e.stopPropagation()
          cycle()
        }}
        className={cn(
          'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 text-white',
          form === 'raw' && 'border-primary bg-primary',
          form === 'processed' && 'border-[var(--amber)] bg-[var(--amber)]',
          !tried && 'border-muted-foreground/40 text-transparent hover:border-primary/60',
        )}
      >
        {form === 'processed' ? (
          <Package className="size-4" strokeWidth={2.5} />
        ) : (
          <Check className="size-5" strokeWidth={3} />
        )}
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

      {tried && (
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
            form === 'processed'
              ? 'bg-[var(--amber)]/15 text-[var(--amber)]'
              : 'bg-primary/10 text-primary',
          )}
        >
          {form === 'processed' ? '加工' : '生'}
        </span>
      )}

      <ChevronRight className="text-border size-5 shrink-0" />
    </div>
  )
}
