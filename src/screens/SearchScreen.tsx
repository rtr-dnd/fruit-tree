import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { nodeLabel, search } from '../core'
import { searchIndex } from '../data/taxa'
import { RANK_JA } from '../lib/labels'
import { useLog } from '../state/log'
import { FruitImage } from '../components/FruitImage'

export function SearchScreen() {
  const [q, setQ] = useState('')
  const { log } = useLog()
  const results = useMemo(() => search(q, searchIndex, 60), [q])

  return (
    <div className="screen search-screen">
      <div className="search-box">
        <input
          type="search"
          value={q}
          autoFocus
          placeholder="和名・英名・学名で検索"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {q.trim().length > 0 && results.length === 0 && (
        <div className="empty">
          <p>「{q}」に該当なし。</p>
          <p className="muted small">学名や英名でも試してみてください。</p>
        </div>
      )}

      <ul className="search-results">
        {results.map((r) => {
          const tried = log.get(r.node.id)?.tried
          return (
            <li key={r.node.id}>
              <Link to={`/n/${r.node.id}`} className="search-item">
                <FruitImage
                  src={r.node.imageUrl}
                  alt={nodeLabel(r.node)}
                  className="thumb-sm"
                />
                <span className="search-item-body">
                  <span className="search-item-name">
                    {tried && <span className="tried-dot">✓</span>}
                    {nodeLabel(r.node)}
                    <span className="rank-tag small">{RANK_JA[r.node.rank]}</span>
                  </span>
                  {r.node.names.en && (
                    <span className="search-item-sub">{r.node.names.en}</span>
                  )}
                </span>
                <span className="chevron">›</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
