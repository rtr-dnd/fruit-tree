import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { getNode, isSpecies, ROOT_ID } from './data/taxa'
import { TreeScreen } from './screens/TreeScreen'
import { DetailScreen } from './screens/DetailScreen'
import { SearchScreen } from './screens/SearchScreen'
import { MyPageScreen } from './screens/MyPageScreen'
import { BottomNav } from './components/BottomNav'

function NodeRoute() {
  const { id } = useParams<{ id: string }>()
  const node = id ? getNode(id) : undefined
  if (!node) {
    return (
      <div className="empty">
        <p>分類が見つかりませんでした。</p>
        <Navigate to={`/n/${ROOT_ID}`} replace />
      </div>
    )
  }
  // 種ノードは詳細画面、内部ノードはツリードリルダウン（§9）。
  return isSpecies(node) ? <DetailScreen node={node} /> : <TreeScreen node={node} />
}

export function App() {
  return (
    <div className="app">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to={`/n/${ROOT_ID}`} replace />} />
          <Route path="/n/:id" element={<NodeRoute />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/me" element={<MyPageScreen />} />
          <Route path="*" element={<Navigate to={`/n/${ROOT_ID}`} replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
