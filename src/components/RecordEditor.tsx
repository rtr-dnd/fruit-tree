import { useEffect, useState } from 'react'
import type { TaxonNode } from '../core'
import { useLog } from '../state/log'
import { useAuth } from '../state/auth'

/** 食べた記録・メモの編集（§4.2 / §4.3）。未ログイン時は無効化（§4.5・§11）。 */
export function RecordEditor({ node }: { node: TaxonNode }) {
  const { get, save, remove, canEdit } = useLog()
  const { signInWithGoogle } = useAuth()
  const entry = get(node.id)

  const [rating, setRating] = useState<number | null>(entry?.rating ?? null)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [place, setPlace] = useState(entry?.place ?? '')
  const [triedDate, setTriedDate] = useState(entry?.triedDate ?? '')

  // 別端末同期などで entry が変わったら反映。
  useEffect(() => {
    setRating(entry?.rating ?? null)
    setNotes(entry?.notes ?? '')
    setPlace(entry?.place ?? '')
    setTriedDate(entry?.triedDate ?? '')
  }, [entry?.taxonId, entry?.updatedAt])

  const tried = entry?.tried ?? false

  if (!canEdit) {
    return (
      <section className="record-card disabled">
        <p className="record-locked">記録するにはログインが必要です。</p>
        <button className="google-btn" onClick={signInWithGoogle}>
          Google でログイン
        </button>
      </section>
    )
  }

  const persist = (patch: Parameters<typeof save>[1]) => save(node.id, patch)

  return (
    <section className="record-card">
      <button
        className={`tried-toggle ${tried ? 'on' : ''}`}
        onClick={() => persist({ tried: !tried })}
      >
        {tried ? '✓ 食べた' : '食べたを記録'}
      </button>

      {tried && (
        <div className="record-fields">
          <div className="field">
            <label>評価</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`star ${rating && n <= rating ? 'on' : ''}`}
                  onClick={() => {
                    const next = rating === n ? null : n
                    setRating(next)
                    persist({ rating: next })
                  }}
                  aria-label={`${n}つ星`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="place">食べた場所</label>
            <input
              id="place"
              type="text"
              value={place}
              placeholder="例：台湾・台北の夜市"
              onChange={(e) => setPlace(e.target.value)}
              onBlur={() => persist({ place })}
            />
          </div>

          <div className="field">
            <label htmlFor="date">食べた日</label>
            <input
              id="date"
              type="date"
              value={triedDate}
              onChange={(e) => {
                setTriedDate(e.target.value)
                persist({ triedDate: e.target.value })
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="notes">メモ・感想</label>
            <textarea
              id="notes"
              value={notes}
              rows={3}
              placeholder="味・香り・食感など"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => persist({ notes })}
            />
          </div>

          <button className="link-danger" onClick={() => remove(node.id)}>
            記録を削除
          </button>
        </div>
      )}
    </section>
  )
}
