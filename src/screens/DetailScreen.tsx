import { nodeLabel, type TaxonNode } from '../core'
import { Breadcrumb } from '../components/Breadcrumb'
import { FruitImage } from '../components/FruitImage'
import { RecordEditor } from '../components/RecordEditor'
import { RelationshipList } from '../components/RelationshipList'
import { SyncBanner } from '../components/SyncBanner'
import { useLog } from '../state/log'

export function DetailScreen({ node }: { node: TaxonNode }) {
  const { get } = useLog()
  const entry = get(node.id)

  return (
    <div className="screen detail-screen">
      <SyncBanner />
      <Breadcrumb node={node} />

      <div className="detail-hero">
        <FruitImage src={node.imageUrl} alt={nodeLabel(node)} className="hero-img" />
        <div className="detail-titles">
          <h1>
            {node.names.ja || node.scientificName}
            {entry?.tried && <span className="tried-badge">✓ 食べた</span>}
          </h1>
          {node.names.en && <p className="name-en">{node.names.en}</p>}
          <p className="name-sci">{node.scientificName}</p>
        </div>
      </div>

      <RecordEditor node={node} />

      {node.description && (
        <section className="description">
          <p>{node.description}</p>
          {node.wikipediaUrl && (
            <a
              href={node.wikipediaUrl}
              target="_blank"
              rel="noreferrer"
              className="wiki-link"
            >
              Wikipedia で読む →
            </a>
          )}
        </section>
      )}

      <h2 className="section-title">近い仲間</h2>
      <RelationshipList node={node} />
    </div>
  )
}
