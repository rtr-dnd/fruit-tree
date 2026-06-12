'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, TreePine, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'ツリー', icon: TreePine, match: (p: string) => p === '/' || p.startsWith('/n') },
  { href: '/search', label: '検索', icon: Search, match: (p: string) => p.startsWith('/search') },
  { href: '/me', label: 'マイページ', icon: User, match: (p: string) => p.startsWith('/me') },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="bg-card fixed inset-x-0 bottom-0 z-10 mx-auto flex h-[calc(60px+env(safe-area-inset-bottom))] max-w-[560px] border-t pb-[env(safe-area-inset-bottom)]">
      {items.map((it) => {
        const active = it.match(pathname)
        const Icon = it.icon
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]',
              active ? 'text-primary font-bold' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" />
            <span>{it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
