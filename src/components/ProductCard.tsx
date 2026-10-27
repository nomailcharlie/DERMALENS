import { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import type { ProductMatch } from '@/types/analysis';
import { getProductById } from '@/data/productCatalog';

interface ProductCardProps {
  match: ProductMatch;
}

export function ProductCard({ match }: ProductCardProps) {
  const product = getProductById(match.productId);
  const [showReasons, setShowReasons] = useState(false);

  if (!product) {
    return (
      <div className="rounded-2xl border border-ivory-200 bg-ivory-50 p-5 text-sm text-charcoal-500">
        Product details unavailable.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ivory-200 bg-ivory-50 p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-sage-700">
            {product.brand}
          </p>
          <h3 className="mt-1 text-base font-medium text-charcoal-900">
            {product.name}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-wider text-charcoal-400">
            {product.category}
          </p>
        </div>
        {product.suitableForSensitive && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700">
            <ShieldCheck className="h-3 w-3" /> Sensitive-suitable
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-charcoal-600">
        {product.description}
      </p>

      {/* Verified ingredients */}
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
          Key ingredients / features
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.keyIngredients.map((ing) => (
            <span
              key={ing}
              className="rounded-full border border-ivory-300 bg-ivory-100 px-2.5 py-1 text-xs text-charcoal-600"
            >
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Why this match */}
      <button
        type="button"
        onClick={() => setShowReasons((v) => !v)}
        className="mt-4 flex w-full items-center justify-between rounded-xl bg-ivory-100/70 px-3.5 py-2.5 text-left text-sm font-medium text-charcoal-700 transition-colors hover:bg-ivory-100"
        aria-expanded={showReasons}
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-sage-600" />
          Why this match?
        </span>
        <ChevronDown
          className={`h-4 w-4 text-charcoal-400 transition-transform duration-200 ${
            showReasons ? 'rotate-180' : ''
          }`}
        />
      </button>
      {showReasons && (
        <ul className="mt-2 space-y-2 rounded-xl border border-ivory-200 bg-ivory-50 p-3.5">
          {match.reasons.map((reason, i) => (
            <li
              key={`${reason.source}-${reason.sourceId}-${i}`}
              className="flex items-start gap-2 text-xs leading-relaxed text-charcoal-600"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
              <span>{reason.explanation}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Cautions */}
      {product.cautions.length > 0 && (
        <div className="mt-4 rounded-xl border border-terracotta-500/20 bg-terracotta-500/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-terracotta-600">
            <AlertCircle className="h-3.5 w-3.5" /> Precautions
          </p>
          <ul className="mt-2 space-y-1">
            {product.cautions.map((c, i) => (
              <li
                key={i}
                className="text-[11px] leading-relaxed text-charcoal-600"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price / availability */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-charcoal-400" />
          {product.priceUnknown ? (
            <span className="text-xs text-charcoal-500">
              Check current regional price
            </span>
          ) : (
            <span className="text-xs text-charcoal-600">
              {product.priceUsd !== undefined
                ? `$${product.priceUsd.toFixed(2)}`
                : 'Price not verified'}
            </span>
          )}
        </div>
        {match.priceUnknown && (
          <span className="text-[10px] uppercase tracking-wider text-charcoal-300">
            Availability not verified
          </span>
        )}
      </div>

      {/* Official info link */}
      <a
        href={product.infoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sage-300 px-4 py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-50"
      >
        View official product information
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      <p className="mt-3 text-[10px] text-charcoal-300">
        Catalog verified {product.verifiedDate}. Not a checkout link.
      </p>
    </div>
  );
}
