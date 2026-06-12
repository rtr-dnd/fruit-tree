import { useLog } from '../state/log'

/** 同期状態の小バナー（§11）。ローカル専用 / 同期待ち / 同期中 を表示。 */
export function SyncBanner() {
  const { localOnly, pending, syncing } = useLog()
  if (syncing) return <div className="sync-banner info">同期中…</div>
  if (pending > 0)
    return <div className="sync-banner warn">同期待ち {pending} 件（再接続時に同期）</div>
  if (localOnly)
    return (
      <div className="sync-banner muted">
        ローカル保存モード（クラウド同期は未設定）
      </div>
    )
  return null
}
