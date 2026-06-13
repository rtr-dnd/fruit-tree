'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/state/auth'
import { SupplementalProvider } from '@/state/supplemental'
import { TreeProvider } from '@/state/tree'
import { LogProvider } from '@/state/log'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SupplementalProvider>
        <TreeProvider>
          <LogProvider>{children}</LogProvider>
        </TreeProvider>
      </SupplementalProvider>
    </AuthProvider>
  )
}
