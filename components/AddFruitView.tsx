'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { resolveFruit, type ResolveResult } from '@/lib/resolve-client'
import { useTree } from '@/state/tree'
import { useCatalog } from '@/state/catalog'
import { useAuth } from '@/state/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FruitImage } from './FruitImage'
import { RANK_JA } from '@/lib/labels'

export function AddFruitView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const { getNode } = useTree()
  const { add, canAdd, localOnly } = useCatalog()
  const { signInWithGoogle } = useAuth()

  const [q, setQ] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResolveResult | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveQuery = async (term: string) => {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const r = await resolveFruit(term)
      setResult(r)
      if (!r.ok) setError(r.message ?? '解決できませんでした')
    } catch (e) {
      setError(`解決中にエラー: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }
  const onResolve = () => resolveQuery(q)

  // 検索タブから「○○を追加」で来たら、その語で自動解決。
  const autoRan = useRef(false)
  useEffect(() => {
    if (initialQ && canAdd && !autoRan.current) {
      autoRan.current = true
      void resolveQuery(initialQ)
    }
  }, [initialQ, canAdd])

  const resolved = result?.ok ? result.resolved! : null
  const alreadyExists = resolved ? !!getNode(resolved.id) : false

  const onAdd = async () => {
    if (!resolved) return
    setAdding(true)
    setError(null)
    const res = await add(resolved)
    setAdding(false)
    if (res.ok) router.push(`/n/${resolved.id}`)
    else setError(res.message ?? '追加に失敗しました')
  }

  return (
    <div className="p-4 pb-6">
      <h1 className="mb-1 text-xl font-bold">フルーツを追加</h1>
      <p className="text-muted-foreground mb-4 text-sm">
        和名・英名・学名で検索して、みんなのカタログに追加できます。
        {localOnly && '（Supabase 未設定のため、この端末にのみ保存されます）'}
      </p>

      {!canAdd ? (
        <Card className="items-center gap-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            追加するにはログインが必要です。
          </p>
          <Button variant="outline" onClick={signInWithGoogle}>
            Google でログイン
          </Button>
        </Card>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            <Input
              value={q}
              placeholder="例：ドリアン / Durian / Durio zibethinus"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q.trim() && !loading) void onResolve()
              }}
            />
            <Button onClick={onResolve} disabled={!q.trim() || loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              検索
            </Button>
          </div>

          {error && (
            <p className="text-destructive mb-3 text-sm">{error}</p>
          )}

          {resolved && (
            <Card className="gap-3 py-4">
              <div className="flex items-center gap-3 px-4">
                <FruitImage
                  src={resolved.imageUrl ?? null}
                  alt={resolved.names.ja || resolved.scientificName}
                  className="size-20 shrink-0 rounded-lg"
                />
                <div className="min-w-0">
                  <div className="text-lg font-bold">
                    {resolved.names.ja || resolved.scientificName}
                  </div>
                  {resolved.names.en && (
                    <div className="text-sm">{resolved.names.en}</div>
                  )}
                  <div className="text-muted-foreground text-sm italic">
                    {resolved.scientificName}
                  </div>
                </div>
              </div>

              <div className="text-muted-foreground px-4 text-xs">
                {resolved.classification
                  .filter((c) => ['ORDER', 'FAMILY', 'GENUS'].includes(c.rank))
                  .map((c) => `${RANK_JA[c.rank]}:${c.names?.ja || c.scientificName}`)
                  .join(' ／ ')}
              </div>
              <div className="text-muted-foreground px-4 text-xs">
                GBIF {result?.matchType}・確度 {result?.confidence}
              </div>

              <div className="px-4">
                {alreadyExists ? (
                  <p className="text-muted-foreground text-sm">
                    この果物はすでに収録されています。
                    <button
                      className="text-primary ml-1 underline"
                      onClick={() => router.push(`/n/${resolved.id}`)}
                    >
                      見る
                    </button>
                  </p>
                ) : (
                  <Button
                    className="w-full"
                    onClick={onAdd}
                    disabled={adding}
                  >
                    {adding && <Loader2 className="size-4 animate-spin" />}
                    カタログに追加する
                  </Button>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
