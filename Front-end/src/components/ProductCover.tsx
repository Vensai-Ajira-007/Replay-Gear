import { useState, type ReactNode } from 'react'
import type { Product } from '../data/products'

type CoverFit = 'contain' | 'cover'

interface ProductCoverProps {
  product: Product
  /**
   * How the artwork fills the tile. 'contain' (the default) shows the whole
   * poster, letterboxed onto the accent gradient — cover art ranges from 0.55
   * to 1.75 in aspect ratio, so anything else crops.
   *
   * Use this prop rather than passing `object-*` through imgClassName: both
   * utilities have equal specificity, so stylesheet order would decide the
   * winner, not the order they appear in the class string.
   */
  fit?: CoverFit
  /** Classes for the outer tile (size, rounding, aspect, centering). */
  className?: string
  /** Classes for the fallback emoji (size + hover effects). */
  emojiClassName?: string
  /** Extra classes for the image (padding, hover scale). */
  imgClassName?: string
  /** Overlays rendered above the image (sheen, badges). */
  children?: ReactNode
}

// Static map so Tailwind's scanner sees both literals — never build `object-${fit}`.
const fitClass: Record<CoverFit, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
}

/**
 * Product cover tile: shows the real cover art / console photo when available,
 * and gracefully falls back to the emoji on the accent gradient if the product
 * has no image or the image fails to load. Keeps its own error state so it can
 * be used per-item (e.g. inside a mapped cart list).
 */
export default function ProductCover({
  product,
  fit = 'contain',
  className = '',
  emojiClassName = '',
  imgClassName = '',
  children,
}: ProductCoverProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = Boolean(product.imageUrl) && !imgError

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${product.accent} ${className}`}
    >
      {showImage ? (
        <img
          src={product.imageUrl ?? ''}
          alt={product.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className={`absolute inset-0 h-full w-full ${fitClass[fit]} ${imgClassName}`}
        />
      ) : (
        /* Emoji fallback — only when there's no usable image. It can't hide
           behind a contained image, so it must not render alongside one. */
        <span className={`drop-shadow-lg ${emojiClassName}`}>{product.emoji}</span>
      )}

      {/* Overlays (sheen, badges) render above the image. */}
      {children}
    </div>
  )
}
