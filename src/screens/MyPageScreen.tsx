import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { nodeLabel } from '../core'
import { allSpecies, getNode, tree } from '../data/taxa'
import { useAuth } from '../state/auth'
import { useLog } from '../state/log'
import { FruitImage } from '../components/FruitImage'

function countRanks(rank: 'FAMILY' | 'ORDER'): number {
  return new Set(
    Object.values(tree.nodes)
      .filter((n) => n.rank === rank)
      .map((n) => n.id),
  ).size
}

export function MyPageScreen() {
  const { user, signInWithGoogle, signOut, configured } = useAuth()
  const { log } = useLog()

  const stats = useMemo(() => {
    const tried = [...log.values()].filter((e) => e.tried)
    const families = new Set<string>()
    const orders = new Set<string>()
    for (const e of tried) {
      const node = getNode(e.taxonId)
      if (node?.ancestors.FAMILY) families.add(node.ancestors.FAMILY)
      if (node?.ancestors.ORDER) orders.add(node.ancestors.ORDER)
    }
    return {
      species: tried.length,
      totalSpecies: allSpecies.length,
      families: families.size,
      totalFamilies: countRanks('FAMILY'),
      orders: orders.size,
      totalOrders: countRanks('ORDER'),
    }
  }, [log])

  const triedList = useMemo(
    () =>
      [...log.values()]
        .filter((e) => e.tried)
        .map((e) => ({ entry: e, node: getNode(e.taxonId) }))
        .filter((x) => x.node)
        .sort((a, b) => (b.entry.triedDate ?? '').localeCompare(a.entry.triedDate ?? '')),
    [log],
  )

  return (
    <div className="screen mypage-screen">
      <header className="mypage-header">
        {user ? (
          <div className="user-row">
            {user.avatarUrl && (
              <img className="avatar" src={user.avatarUrl} alt="" />
            )}
            <div>
              <div className="user-name">{user.name}</div>
              <button className="link" onClick={signOut}>
                ログアウト
              </button>
            </div>
          </div>
        ) : (
          <div className="login-row">
            <button className="google-btn" onClick={signInWithGoogle}>
              Google でログイン
            </button>
            {!configured && (
              <p className="muted small">
                Supabase 未設定のため、記録は端末内に保存されます。
              </p>
            )}
          </div>
        )}
      </header>

      <section className="stats">
        <div className="stat">
          <span className="stat-num">{stats.species}</span>
          <span className="stat-label">食べた種 / {stats.totalSpecies}</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.families}</span>
          <span className="stat-label">食べた科 / {stats.totalFamilies}</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.orders}</span>
          <span className="stat-label">食べた目 / {stats.totalOrders}</span>
        </div>
      </section>

      <h2 className="section-title">食べた一覧</h2>
      {triedList.length === 0 ? (
        <p className="muted">まだ記録がありません。フルーツの詳細から記録しましょう。</p>
      ) : (
        <ul className="tried-list">
          {triedList.map(({ entry, node }) => (
            <li key={node!.id}>
              <Link to={`/n/${node!.id}`} className="tried-item">
                <FruitImage
                  src={node!.imageUrl}
                  alt={nodeLabel(node!)}
                  className="thumb-sm"
                />
                <span className="tried-item-body">
                  <span className="tried-item-name">{nodeLabel(node!)}</span>
                  <span className="tried-item-sub">
                    {entry.rating ? '★'.repeat(entry.rating) : ''}
                    {entry.place ? ` ・ ${entry.place}` : ''}
                    {entry.triedDate ? ` ・ ${entry.triedDate}` : ''}
                  </span>
                </span>
                <span className="chevron">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
