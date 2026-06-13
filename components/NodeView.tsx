'use client'

import { isSpecies } from '@/lib/data/catalog'
import { useTree } from '@/state/tree'
import { TreeView } from './TreeView'
import { DetailView } from './DetailView'

/** id から分類ノードを引き、種なら詳細・内部ノードならツリーを表示。id 省略時はルート。 */
export function NodeView({ id }: { id?: string }) {
  const { getNode, rootId } = useTree()
  const node = getNode(id ?? rootId)
  if (!node) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        分類が見つかりませんでした。
      </div>
    )
  }
  return isSpecies(node) ? <DetailView node={node} /> : <TreeView node={node} />
}
