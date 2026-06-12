'use client'

import { useEffect, useState } from 'react'
import { Check, Star } from 'lucide-react'
import type { TaxonNode } from '@/lib/core'
import { useLog } from '@/state/log'
import { useAuth } from '@/state/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/** 食べた記録・メモの編集（§4.2 / §4.3）。未ログイン時は無効化（§4.5・§11）。 */
export function RecordEditor({ node }: { node: TaxonNode }) {
  const { get, save, remove, canEdit } = useLog()
  const { signInWithGoogle } = useAuth()
  const entry = get(node.id)

  const [rating, setRating] = useState<number | null>(entry?.rating ?? null)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [place, setPlace] = useState(entry?.place ?? '')
  const [triedDate, setTriedDate] = useState(entry?.triedDate ?? '')

  useEffect(() => {
    setRating(entry?.rating ?? null)
    setNotes(entry?.notes ?? '')
    setPlace(entry?.place ?? '')
    setTriedDate(entry?.triedDate ?? '')
  }, [entry?.taxonId, entry?.updatedAt])

  const tried = entry?.tried ?? false

  if (!canEdit) {
    return (
      <Card className="items-center gap-3 py-5 text-center">
        <p className="text-muted-foreground text-sm">
          記録するにはログインが必要です。
        </p>
        <Button variant="outline" onClick={signInWithGoogle}>
          Google でログイン
        </Button>
      </Card>
    )
  }

  const persist = (patch: Parameters<typeof save>[1]) => save(node.id, patch)

  return (
    <Card className="gap-4 py-5">
      <div className="px-6">
        <Button
          variant={tried ? 'default' : 'outline'}
          className="h-12 w-full text-base"
          onClick={() => persist({ tried: !tried })}
        >
          {tried ? (
            <>
              <Check className="size-5" /> 食べた
            </>
          ) : (
            '食べたを記録'
          )}
        </Button>
      </div>

      {tried && (
        <div className="flex flex-col gap-4 px-6">
          <div className="flex flex-col gap-1.5">
            <Label>評価</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`${n}つ星`}
                  onClick={() => {
                    const next = rating === n ? null : n
                    setRating(next)
                    persist({ rating: next })
                  }}
                  className="cursor-pointer"
                >
                  <Star
                    className={cn(
                      'size-7',
                      rating && n <= rating
                        ? 'fill-[var(--amber)] text-[var(--amber)]'
                        : 'text-border',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="place">食べた場所</Label>
            <Input
              id="place"
              value={place}
              placeholder="例：台湾・台北の夜市"
              onChange={(e) => setPlace(e.target.value)}
              onBlur={() => persist({ place })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">食べた日</Label>
            <Input
              id="date"
              type="date"
              value={triedDate}
              onChange={(e) => {
                setTriedDate(e.target.value)
                persist({ triedDate: e.target.value })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">メモ・感想</Label>
            <Textarea
              id="notes"
              value={notes}
              rows={3}
              placeholder="味・香り・食感など"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => persist({ notes })}
            />
          </div>

          <Button
            variant="link"
            className="text-destructive h-auto justify-start p-0"
            onClick={() => remove(node.id)}
          >
            記録を削除
          </Button>
        </div>
      )}
    </Card>
  )
}
