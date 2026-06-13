'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { SearchIndex, TaxonNode, TaxonTree } from '@/lib/core'
import { assembleTree } from '@/lib/data/tree-runtime'
import { ROOT_ID as BASE_ROOT } from '@/lib/data/taxa'
import { useSupplemental } from './supplemental'

interface TreeState {
  tree: TaxonTree
  searchIndex: SearchIndex
  rootId: string
  getNode: (id: string) => TaxonNode | undefined
  allSpecies: TaxonNode[]
}

const TreeContext = createContext<TreeState | null>(null)

/** バンドル済み種＋アプリ内追加をマージしたツリーを全画面に供給（§7.4 モデルB）。 */
export function TreeProvider({ children }: { children: ReactNode }) {
  const { entries } = useSupplemental()

  const value = useMemo<TreeState>(() => {
    const { tree, searchIndex } = assembleTree(entries)
    return {
      tree,
      searchIndex,
      rootId: tree.nodes[BASE_ROOT] ? BASE_ROOT : tree.rootId,
      getNode: (id) => tree.nodes[id],
      allSpecies: Object.values(tree.nodes).filter((n) => n.rank === 'SPECIES'),
    }
  }, [entries])

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>
}

export function useTree(): TreeState {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTree must be used within TreeProvider')
  return ctx
}
