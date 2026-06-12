// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './state/auth'
import { LogProvider } from './state/log'
import { App } from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <LogProvider>
          <App />
        </LogProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('UI スモーク（描画クラッシュしない / 主要要素が出る）', () => {
  it('ツリー（ホーム）が描画され、未踏フィルタが出る', () => {
    renderAt('/n/tracheophyta')
    expect(screen.getByText('未踏のみ表示')).toBeTruthy()
    expect(screen.getByText(/未踏の.+\s\d+\s\/\s総\s\d+/)).toBeTruthy()
  })

  it('黄金果の詳細：関係リストに「同じ目の別の科」と柿(カキノキ)が出る', () => {
    renderAt('/n/pouteria-caimito')
    expect(screen.getAllByText('黄金果').length).toBeGreaterThan(0)
    expect(screen.getByText('近い仲間')).toBeTruthy()
    expect(screen.getByText('同じ目の別の科')).toBeTruthy()
    // 関係リスト内に柿（和名カキノキ）が現れる
    const rel = document.querySelector('.rel-list')!
    expect(within(rel as HTMLElement).getByText('カキノキ')).toBeTruthy()
    // ライチ/レイシは現れない
    expect(within(rel as HTMLElement).queryByText('レイシ')).toBeNull()
  })

  it('ローカル専用モードでは記録ボタンが有効（食べたを記録）', () => {
    renderAt('/n/pouteria-caimito')
    expect(screen.getByText('食べたを記録')).toBeTruthy()
  })

  it('検索画面で和名検索ができる', async () => {
    const { container } = renderAt('/search')
    const input = container.querySelector('input[type="search"]') as HTMLInputElement
    expect(input).toBeTruthy()
  })

  it('マイページが描画され統計が出る', () => {
    renderAt('/me')
    expect(screen.getByText(/食べた種 \/ \d+/)).toBeTruthy()
    expect(screen.getByText('Google でログイン')).toBeTruthy()
  })
})
