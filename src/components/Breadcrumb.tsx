import { Link } from 'react-router-dom'
import { nodeLabel, type TaxonNode } from '../core'
import { getNode } from '../data/taxa'

/** パンくず（§4.1）。タップで任意の祖先に戻れる。 */
export function Breadcrumb({ node }: { node: TaxonNode }) {
  const ancestors = node.lineage
    .map((id) => getNode(id))
    .filter((n): n is TaxonNode => !!n)
  return (
    <nav className="breadcrumb" aria-label="パンくず">
      {ancestors.map((a) => (
        <span key={a.id} className="crumb">
          <Link to={`/n/${a.id}`}>{nodeLabel(a)}</Link>
          <span className="sep">›</span>
        </span>
      ))}
      <span className="crumb current">{nodeLabel(node)}</span>
    </nav>
  )
}
