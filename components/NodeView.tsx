'use client'

import { isSpecies } from '@/lib/data/taxa'
import { useTree } from '@/state/tree'
import { TreeView } from './TreeView'
import { DetailView } from './DetailView'

/** id から分類ノードを引き、種なら詳細・内部ノードならツリーを表示（§9）。 */
export function NodeView({ id }: { id: string }) {
  const { getNode } = useTree()
  const node = getNode(id)
  if (!node) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        分類が見つかりませんでした。
      </div>
    )
  }
  return isSpecies(node) ? <DetailView node={node} /> : <TreeView node={node} />
}
