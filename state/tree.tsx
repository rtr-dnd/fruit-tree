'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { SearchIndex, TaxonNode, TaxonTree } from '@/lib/core'
import { buildCatalogTree, defaultCatalogTree } from '@/lib/data/catalog'
import { useCatalog } from './catalog'

interface TreeState {
  tree: TaxonTree
  searchIndex: SearchIndex
  rootId: string
  getNode: (id: string) => TaxonNode | undefined
  allSpecies: TaxonNode[]
}

const TreeContext = createContext<TreeState | null>(null)

/** カタログ（DB＋同梱）から分類ツリーを組んで全画面に供給。 */
export function TreeProvider({ children }: { children: ReactNode }) {
  const { entries } = useCatalog()

  const value = useMemo<TreeState>(() => {
    const { tree, searchIndex } =
      entries.length === 0 ? defaultCatalogTree : buildCatalogTree(entries)
    return {
      tree,
      searchIndex,
      rootId: tree.rootId,
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
