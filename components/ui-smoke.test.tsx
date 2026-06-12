// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Next のルーティングをスタブ化（jsdom 上で描画するため）。
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

import { Providers } from './Providers'
import { TreeView } from './TreeView'
import { DetailView } from './DetailView'
import { SearchView } from './SearchView'
import { MyPageView } from './MyPageView'
import { getNode, ROOT_ID } from '@/lib/data/taxa'

function wrap(ui: ReactNode) {
  return render(<Providers>{ui}</Providers>)
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('UI スモーク（Next + shadcn）', () => {
  it('ツリーが描画され、未踏フィルタが出る', () => {
    wrap(<TreeView node={getNode(ROOT_ID)!} />)
    expect(screen.getByText('未踏のみ表示')).toBeTruthy()
    expect(screen.getByText(/未踏の.+\s\d+\s\/\s総\s\d+/)).toBeTruthy()
  })

  it('黄金果の詳細：関係リストに「同じ目の別の科」と柿(カキノキ)が出て、レイシは出ない', () => {
    wrap(<DetailView node={getNode('pouteria-caimito')!} />)
    expect(screen.getAllByText('黄金果').length).toBeGreaterThan(0)
    expect(screen.getByText('近い仲間')).toBeTruthy()
    expect(screen.getByText('同じ目の別の科')).toBeTruthy()
    expect(screen.getByText('カキノキ')).toBeTruthy()
    expect(screen.queryByText('レイシ')).toBeNull()
  })

  it('ローカル専用モードでは記録ボタンが有効', () => {
    wrap(<DetailView node={getNode('pouteria-caimito')!} />)
    expect(screen.getByText('食べたを記録')).toBeTruthy()
  })

  it('検索ボックスが描画される', () => {
    const { container } = wrap(<SearchView />)
    expect(container.querySelector('input[type="search"]')).toBeTruthy()
  })

  it('マイページに統計とログインボタンが出る', () => {
    wrap(<MyPageView />)
    expect(screen.getByText(/食べた種 \/ \d+/)).toBeTruthy()
    expect(screen.getByText('Google でログイン')).toBeTruthy()
  })
})
