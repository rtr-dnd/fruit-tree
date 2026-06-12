import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nodeLabel, untrodden, type TaxonNode } from '../core'
import { getNode, tree } from '../data/taxa'
import { RANK_JA } from '../lib/labels'
import { useLog } from '../state/log'
import { Breadcrumb } from '../components/Breadcrumb'
import { CoverageBadge } from '../components/CoverageBadge'
import { Preview } from '../components/Preview'
import { SyncBanner } from '../components/SyncBanner'

export function TreeScreen({ node }: { node: TaxonNode }) {
  const navigate = useNavigate()
  const { log } = useLog()
  const [onlyUntrodden, setOnlyUntrodden] = useState(false)

  const children = useMemo(
    () =>
      node.childrenIds
        .map((id) => getNode(id))
        .filter((n): n is TaxonNode => !!n),
    [node],
  )

  const untroddenFlags = useMemo(
    () => new Map(children.map((c) => [c.id, untrodden(tree, c, log)])),
    [children, log],
  )

  const untroddenCount = children.filter((c) => untroddenFlags.get(c.id)).length
  const visible = onlyUntrodden
    ? children.filter((c) => untroddenFlags.get(c.id))
    : children

  const childRank = children[0]?.rank
  const childRankJa = childRank ? RANK_JA[childRank] : 'グループ'

  return (
    <div className="screen tree-screen">
      <SyncBanner />
      <Breadcrumb node={node} />

      <header className="node-header">
        <h1>
          {nodeLabel(node)}
          <span className="rank-tag">{RANK_JA[node.rank]}</span>
        </h1>
        <CoverageBadge node={node} />
      </header>

      {children.length > 0 && (
        <div className="filter-bar">
          <label className="toggle">
            <input
              type="checkbox"
              checked={onlyUntrodden}
              onChange={(e) => setOnlyUntrodden(e.target.checked)}
            />
            未踏のみ表示
          </label>
          <span className="filter-count">
            未踏の{childRankJa} {untroddenCount} / 総 {children.length}
          </span>
        </div>
      )}

      <ul className="node-list">
        {visible.map((child) => (
          <li
            key={child.id}
            className={`node-row ${untroddenFlags.get(child.id) ? 'untrodden' : ''}`}
            onClick={() => navigate(`/n/${child.id}`)}
          >
            <div className="node-row-main">
              <span className="node-row-name">
                {nodeLabel(child)}
                <span className="rank-tag small">{RANK_JA[child.rank]}</span>
              </span>
              <CoverageBadge node={child} />
            </div>
            {child.rank !== 'SPECIES' && <Preview node={child} />}
            <span className="chevron">›</span>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="empty-row">
            {onlyUntrodden ? '未踏の枝はありません 🎉' : '配下のノードがありません'}
          </li>
        )}
      </ul>
    </div>
  )
}
