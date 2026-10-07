import type { Product } from './api'
import { HighlightedText } from './HighlightedText'

type SearchResultItemProps = {
  readonly product: Product
  readonly query: string
}

const THUMBNAIL_SIZE = 64

const PRICE_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function SearchResultItem({ product, query }: SearchResultItemProps) {
  const details =
    product.brand === undefined
      ? product.category
      : `${product.brand} · ${product.category}`

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:gap-4">
      {/* The title sits next to the image, so it is decorative. */}
      <img
        src={product.thumbnail}
        alt=""
        width={THUMBNAIL_SIZE}
        height={THUMBNAIL_SIZE}
        loading="lazy"
        className="size-14 shrink-0 rounded-xl bg-slate-100 object-cover sm:size-16"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium break-words text-slate-800">
          <HighlightedText text={product.title} query={query} />
        </p>
        <p className="mt-0.5 truncate text-sm text-slate-500">{details}</p>
      </div>
      <p className="shrink-0 font-semibold text-indigo-700">
        {PRICE_FORMAT.format(product.price)}
      </p>
    </li>
  )
}
