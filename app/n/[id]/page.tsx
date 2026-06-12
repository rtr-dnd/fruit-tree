import { NodeView } from '@/components/NodeView'
import { tree } from '@/lib/data/taxa'

// 収録ノードを静的生成（外部fetchなしで即応 / §10）。
export function generateStaticParams() {
  return Object.keys(tree.nodes).map((id) => ({ id }))
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <NodeView id={id} />
}
