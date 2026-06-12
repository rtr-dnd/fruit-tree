import { useState } from 'react'

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
      <div className={`fruit-image placeholder ${className ?? ''}`} aria-label={alt}>
        🍈
      </div>
    )
  }
  return (
    <img
      className={`fruit-image ${className ?? ''}`}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
