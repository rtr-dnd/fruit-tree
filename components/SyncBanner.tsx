'use client'

import { useLog } from '@/state/log'
import { cn } from '@/lib/utils'

/** 同期状態の小バナー（§11）。ローカル専用 / 同期待ち / 同期中 を表示。 */
export function SyncBanner() {
  const { localOnly, pending, syncing } = useLog()

  let text: string | null = null
  let tone = ''
  if (syncing) {
    text = '同期中…'
    tone = 'bg-blue-50 text-blue-700'
  } else if (pending > 0) {
    text = `同期待ち ${pending} 件（再接続時に同期）`
    tone = 'bg-amber-50 text-amber-700'
  } else if (localOnly) {
    text = 'ローカル保存モード（クラウド同期は未設定）'
    tone = 'bg-muted text-muted-foreground'
  }
  if (!text) return null

  return (
    <div className={cn('mb-2.5 rounded-md px-2.5 py-1.5 text-xs', tone)}>
      {text}
    </div>
  )
}
