/**
 * Curated, verified product catalog for DERMALENS recommendations.
 *
 * Each entry is sourced from official manufacturer information pages
 * (catalog/range pages, not checkout pages). Prices are intentionally
 * omitted unless independently verified — most entries use
 * `priceUnknown: true` so the UI shows "Check current regional price"
 * rather than fabricating a number.
 *
 * Sources:
 * - CeraVe facial cleansers:  https://www.cerave.com/skincare/cleansers/facial-cleansers
 * - CeraVe facial moisturizers: https://www.cerave.com/skincare/moisturizers/facial-moisturizers
 * - Neutrogena facial sunscreens: https://www.neutrogena.com/sun/sunscreen-for-face
 * - The Ordinary salicylic acid: https://theordinary.com/en-pk/category/skincare/shop-by-ingredients/salicylic-acid
 *
 * Only information confirmed on those pages is recorded here. No retailer
 * inventory, ratings, discounts, or checkout links are included.
 */

import type { RoutineCategory, UserGoal } from '@/types/analysis';

export interface ProductCatalogEntry {
  /** Stable product ID. */
  id: string;
  brand: string;
  name: string;
  /** Routine step this product fits. */
  category: RoutineCategory;
  /** Verified product-label or ingredient highlights from the manufacturer page. */
  keyIngredients: string[];
  /** Short factual description grounded in the manufacturer page. */
  description: string;
  /** Goals this product can support. */
  supportedGoals: UserGoal[];
  /** YouCam concern IDs this product relates to (cosmetic appearance focus). */
  supportedConcerns: string[];
  /** True if suitable for sensitive skin per manufacturer positioning. */
  suitableForSensitive: boolean;
  /** Caution notes (patch testing, avoid compromised skin, etc.). */
  cautions: string[];
  /** Official information URL (catalog/range page, not a checkout link). */
  infoUrl: string;
  /** Verified price in USD, if known. Undefined when unverified. */
  priceUsd?: number;
  /** ISO market code if price is verified for a specific market. */
  market?: string;
  /** Date (ISO) the catalog entry was last verified against the source. */
  verifiedDate: string;
  /** Whether price/market availability is unverified. */
  priceUnknown: boolean;
}

export const PRODUCT_CATALOG: ProductCatalogEntry[] = [
  {
    id: 'cerave-foaming-cleanser',
    brand: 'CeraVe',
    name: 'Foaming Facial Cleanser',
    category: 'cleanse',
    keyIngredients: ['Ceramides', 'Niacinamide', 'Hyaluronic acid'],
    description:
      'A foaming gel cleanser developed with dermatologists for normal to oily skin, formulated with ceramides and niacinamide.',
    supportedGoals: ['breakout_prone', 'pores', 'texture'],
    supportedConcerns: ['acne', 'pore', 'texture'],
    suitableForSensitive: true,
    cautions: [
      'For external use only. Avoid contact with eyes.',
    ],
    infoUrl: 'https://www.cerave.com/skincare/cleansers/facial-cleansers',
    verifiedDate: '2026-10-27',
    priceUnknown: true,
  },
  {
    id: 'cerave-hydrating-cleanser',
    brand: 'CeraVe',
    name: 'Hydrating Facial Cleanser',
    category: 'cleanse',
    keyIngredients: ['Ceramides', 'Hyaluronic acid', 'Glycerin'],
    description:
      'A creamy lotion cleanser developed with dermatologists for normal to dry skin, designed to cleanse without disrupting the skin barrier.',
    supportedGoals: ['fine_lines', 'simpler_routine'],
    supportedConcerns: ['wrinkle', 'texture'],
    suitableForSensitive: true,
    cautions: ['For external use only. Avoid contact with eyes.'],
    infoUrl: 'https://www.cerave.com/skincare/cleansers/facial-cleansers',
    verifiedDate: '2026-10-27',
    priceUnknown: true,
  },
  {
    id: 'cerave-pm-moisturizer',
    brand: 'CeraVe',
    name: 'PM Facial Moisturizing Lotion',
    category: 'moisturize',
    keyIngredients: ['Ceramides', 'Niacinamide', 'Hyaluronic acid'],
    description:
      'A lightweight night moisturizer with niacinamide and ceramides, developed for overnight use on normal to dry skin.',
    supportedGoals: ['texture', 'fine_lines', 'pores'],
    supportedConcerns: ['texture', 'wrinkle', 'pore'],
    suitableForSensitive: true,
    cautions: ['For external use only. Use only as directed.'],
    infoUrl: 'https://www.cerave.com/skincare/moisturizers/facial-moisturizers',
    verifiedDate: '2026-10-27',
    priceUnknown: true,
  },
  {
    id: 'cerave-am-moisturizer-spf30',
    brand: 'CeraVe',
    name: 'AM Facial Moisturizing Lotion with SPF 30',
    category: 'protect',
    keyIngredients: ['Ceramides', 'Niacinamide', 'Hyaluronic acid', 'SPF 30 broad-spectrum'],
    description:
      'A daily facial moisturizer with broad-spectrum SPF 30, formulated with ceramides for normal to dry skin.',
    supportedGoals: ['fine_lines', 'simpler_routine', 'texture'],
    supportedConcerns: ['wrinkle', 'texture'],
    suitableForSensitive: true,
    cautions: [
      'Reapply sunscreen at least every two hours. Use a water-resistant sunscreen if swimming or sweating.',
    ],
    infoUrl: 'https://www.cerave.com/skincare/moisturizers/facial-moisturizers',
    verifiedDate: '2026-10-27',
    priceUnknown: true,
  },
  {
    id: 'neutrogena-clear-face-sunscreen',
    brand: 'Neutrogena',
    name: 'Clear Face Sunscreen',
    category: 'protect',
    keyIngredients: ['Broad-spectrum SPF', 'Oil-free', 'Non-comedogenic'],
    description:
      'A broad-spectrum facial sunscreen formulated to be oil-free and non-comedogenic, designed for breakout-prone skin.',
    supportedGoals: ['breakout_prone', 'fine_lines', 'simpler_routine'],
    supportedConcerns: ['acne', 'wrinkle'],
    suitableForSensitive: true,
    cautions: [
      'Reapply at least every two hours. For external use only.',
    ],
    infoUrl: 'https://www.neutrogena.com/sun/sunscreen-for-face',
    verifiedDate: '2026-10-27',
    priceUnknown: true,
  },
  {
    id: 'the-ordinary-salicylic-acid-2',
    brand: 'The Ordinary',
    name: 'Salicylic Acid 2% Solution',
    category: 'treat',
    keyIngredients: ['Salicylic acid 2%', 'BHA'],
    description:
      'A 2% salicylic acid (BHA) exfoliating solution for targeted use, supporting the appearance of blemishes and pore congestion.',
    supportedGoals: ['breakout_prone', 'pores', 'texture'],
    supportedConcerns: ['acne', 'pore', 'texture'],
    suitableForSensitive: false,
    cautions: [
      'Patch testing is recommended before use. Avoid use on sensitive, peeling, or compromised skin.',
      'Use sun protection during the day, as BHA can increase skin sensitivity to the sun.',
      'This is a cosmetic product and is not a medical acne treatment.',
      'Follow the manufacturer directions for application frequency.',
    ],
    infoUrl:
      'https://theordinary.com/en-pk/category/skincare/shop-by-ingredients/salicylic-acid',
    verifiedDate: '2026-10-27',
    priceUnknown: true,
  },
];

/** Look up a catalog entry by id. */
export function getProductById(id: string): ProductCatalogEntry | undefined {
  return PRODUCT_CATALOG.find((p) => p.id === id);
}
