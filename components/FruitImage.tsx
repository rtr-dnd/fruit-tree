'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  src: string | null
  alt: string
  className?: string
}

/** 画像。無い/読み込み失敗時は絵文字プレースホルダ。 */
export function FruitImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div
        className={cn(
          'bg-accent text-muted-foreground flex items-center justify-center',
          className,
        )}
        aria-label={alt}
      >
        <span className="text-xl">🍈</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn('bg-accent object-cover', className)}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
