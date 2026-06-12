import { Link } from 'react-router-dom'
import { buildRelationshipList, nodeLabel, type TaxonNode } from '../core'
import { tree } from '../data/taxa'
import { useLog } from '../state/log'
import { FruitImage } from './FruitImage'

/** 関係リスト（近い順・見出しグルーピング / §4.2・§5.3）。 */
export function RelationshipList({ node }: { node: TaxonNode }) {
  const { log } = useLog()
  const rel = buildRelationshipList(node.id, tree, log)

  if (rel.sections.length === 0) {
    return (
      <section className="rel-list">
        <p className="muted">収録データ内に近縁の仲間が見つかりませんでした。</p>
        {rel.furtherCount > 0 && (
          <p className="muted small">より遠い仲間: {rel.furtherCount} 種</p>
        )}
      </section>
    )
  }

  return (
    <section className="rel-list">
      {rel.sections.map((section) => (
        <div key={section.bucket} className="rel-section">
          <h3 className="rel-section-title">{section.label}</h3>
          {section.groups.map((group) => (
            <div key={group.id || section.bucket} className="rel-group">
              {section.grouped && group.headingLabel && (
                <div className="rel-group-heading">
                  <Link to={`/n/${group.id}`}>{group.headingLabel}</Link>
                  {group.untrodden && <span className="untrodden-flag">未踏</span>}
                </div>
              )}
              <ul className="rel-items">
                {group.items.map((item) => (
                  <li key={item.node.id}>
                    <Link to={`/n/${item.node.id}`} className="rel-item">
                      <FruitImage
                        src={item.node.imageUrl}
                        alt={nodeLabel(item.node)}
                        className="thumb-sm"
                      />
                      <span className="rel-item-body">
                        <span className="rel-item-name">
                          {item.tried && <span className="tried-dot">✓</span>}
                          {nodeLabel(item.node)}
                        </span>
                        <span className="rel-item-close">{item.closeness}</span>
                      </span>
                      <span className="chevron">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
      {rel.furtherCount > 0 && (
        <p className="muted small">
          目より遠い仲間（別の目）: {rel.furtherCount} 種は省略
        </p>
      )}
    </section>
  )
}
