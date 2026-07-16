import { useState, type ReactNode } from 'react'
import type { Product } from '../data/products'

interface ProductCoverProps {
  product: Product
  /** Classes for the outer tile (size, rounding, aspect, centering). */
  className?: string
  /** Classes for the fallback emoji (size + hover effects). */
  emojiClassName?: string
  /** Extra classes for the image (e.g. hover scale). */
  imgClassName?: string
  /** Overlays rendered above the image (sheen, badges). */
  children?: ReactNode
}

/**
 * Product cover tile: shows the real cover art / console photo when available,
 * and gracefully falls back to the emoji on the accent gradient if the product
 * has no image or the image fails to load. Keeps its own error state so it can
 * be used per-item (e.g. inside a mapped cart list).
 */
export default function ProductCover({
  product,
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
      {/* Emoji fallback — sits underneath; revealed if there's no image. */}
      <span className={`drop-shadow-lg ${emojiClassName}`}>{product.emoji}</span>

      {showImage && (
        <img
          src={product.imageUrl ?? ''}
          alt={product.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
        />
      )}

      {/* Overlays (sheen, badges) render above the image. */}
      {children}
    </div>
  )
}
