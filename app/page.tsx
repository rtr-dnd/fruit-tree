import { NodeView } from '@/components/NodeView'
import { ROOT_ID } from '@/lib/data/taxa'

// ホーム＝分類ツリーのルート（収録フルーツの最小共通祖先 / §4.1）。
export default function Home() {
  return <NodeView id={ROOT_ID} />
}
