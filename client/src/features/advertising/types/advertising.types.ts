/**
 * Advertising / Auto-Ads Feature Types
 */

export type TemplateType =
  | "story"
  | "feed"
  | "promo"
  | "minimal"
  | "neon"
  | "luxury"
  | "pastel"
  | "editorial"
  | "tech"
  | "monochrome"
  | "bold"
  | "noir"
  | "vapor"
  | "candy"
  | "studio"
  | "eco"
  | "sport"
  | "beauty"
  | "classic"
  | "warm";

export interface AdProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  description?: string;
}

export interface TemplateProps {
  product: AdProduct;
  logoUrl?: string;
  businessName?: string;
}

export interface GeneratedAd {
  product: AdProduct;
  template: TemplateType;
  salesCopy: string;
}
