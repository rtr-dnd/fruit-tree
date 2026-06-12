import { Link } from 'react-router-dom'
import { nodeLabel, representativePreview, type TaxonNode } from '../core'
import { tree } from '../data/taxa'
import { useLog } from '../state/log'
import { FruitImage } from './FruitImage'

/** 果物プレビュー：代表サムネ（食べた種を優先・強調 / §4.1・§5.6）。 */
export function Preview({ node }: { node: TaxonNode }) {
  const { log } = useLog()
  const picks = representativePreview(tree, node, log, 4)
  if (picks.length === 0) return null
  return (
    <div className="preview-row">
      {picks.map((p) => (
        <Link
          key={p.node.id}
          to={`/n/${p.node.id}`}
          className={`preview-item ${p.tried ? 'tried' : 'untried'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FruitImage src={p.node.imageUrl} alt={nodeLabel(p.node)} className="thumb" />
          <span className="preview-name">
            {p.tried && <span className="tried-dot">✓</span>}
            {nodeLabel(p.node)}
          </span>
        </Link>
      ))}
    </div>
  )
}
