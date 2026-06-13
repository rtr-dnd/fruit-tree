'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/state/auth'
import { CatalogProvider } from '@/state/catalog'
import { TreeProvider } from '@/state/tree'
import { LogProvider } from '@/state/log'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CatalogProvider>
        <TreeProvider>
          <LogProvider>{children}</LogProvider>
        </TreeProvider>
      </CatalogProvider>
    </AuthProvider>
  )
}
