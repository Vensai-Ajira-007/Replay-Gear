import { Link } from 'react-router-dom'
import type { Product } from '../data/products'
import { ROUTES } from '../config/routes'
import ProductCover from './ProductCover'
import { PriceTag } from './FeaturedCarousel'

/**
 * A store-listing row: wide thumbnail, title and tags, price on the right.
 *
 * The thumbnail box is wide like a store capsule, but the artwork is left on
 * ProductCover's default `contain` — this catalogue's covers are portrait
 * posters, and cropping them to a wide box cuts the title off.
 */
export default function OfferRow({ product }: { product: Product }) {
  return (
    <Link
      to={ROUTES.product(product.id)}
      className="group flex items-center gap-4 bg-panel/40 p-2 transition hover:bg-panel"
    >
      <ProductCover
        product={product}
        className="aspect-video w-32 shrink-0 rounded-sm sm:w-44"
        emojiClassName="text-3xl"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-white transition group-hover:text-brand">
          {product.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
          <span>{product.platform}</span>
          <span aria-hidden="true">·</span>
          <span>{product.condition}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <span className="text-fair">★</span>
            {product.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <PriceTag product={product} className="shrink-0" />
    </Link>
  )
}
