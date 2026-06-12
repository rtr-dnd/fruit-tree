'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/state/auth'
import { LogProvider } from '@/state/log'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LogProvider>{children}</LogProvider>
    </AuthProvider>
  )
}
