/**
 * Template themes metadata (labels, aspect, badges)
 */
import type { TemplateType } from "../types/advertising.types";

export type TemplateAspect = "story" | "square";

export interface TemplateMeta {
  id: TemplateType;
  label: string;
  aspect: TemplateAspect;
  badgeClass: string;
}

export const templateMeta: Record<TemplateType, TemplateMeta> = {
  story: {
    id: "story",
    label: "Story 9:16",
    aspect: "story",
    badgeClass: "bg-purple-100 text-purple-700",
  },
  feed: {
    id: "feed",
    label: "Feed 1:1",
    aspect: "square",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  promo: {
    id: "promo",
    label: "Promo",
    aspect: "square",
    badgeClass: "bg-orange-100 text-orange-700",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    aspect: "square",
    badgeClass: "bg-slate-100 text-slate-700",
  },
  neon: {
    id: "neon",
    label: "Neon",
    aspect: "square",
    badgeClass: "bg-cyan-100 text-cyan-700",
  },
  luxury: {
    id: "luxury",
    label: "Luxury",
    aspect: "square",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  pastel: {
    id: "pastel",
    label: "Pastel",
    aspect: "square",
    badgeClass: "bg-pink-100 text-pink-700",
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    aspect: "square",
    badgeClass: "bg-gray-100 text-gray-700",
  },
  tech: {
    id: "tech",
    label: "Tech",
    aspect: "square",
    badgeClass: "bg-sky-100 text-sky-700",
  },
  monochrome: {
    id: "monochrome",
    label: "Monochrome",
    aspect: "square",
    badgeClass: "bg-zinc-100 text-zinc-700",
  },
  bold: {
    id: "bold",
    label: "Bold",
    aspect: "square",
    badgeClass: "bg-red-100 text-red-700",
  },
  noir: {
    id: "noir",
    label: "Noir",
    aspect: "square",
    badgeClass: "bg-neutral-900 text-white",
  },
  vapor: {
    id: "vapor",
    label: "Vapor",
    aspect: "square",
    badgeClass: "bg-fuchsia-100 text-fuchsia-700",
  },
  candy: {
    id: "candy",
    label: "Candy",
    aspect: "square",
    badgeClass: "bg-rose-100 text-rose-700",
  },
  studio: {
    id: "studio",
    label: "Studio",
    aspect: "square",
    badgeClass: "bg-stone-100 text-stone-700",
  },
  eco: {
    id: "eco",
    label: "Eco",
    aspect: "square",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  sport: {
    id: "sport",
    label: "Sport",
    aspect: "square",
    badgeClass: "bg-orange-100 text-orange-700",
  },
  beauty: {
    id: "beauty",
    label: "Beauty",
    aspect: "square",
    badgeClass: "bg-pink-100 text-pink-700",
  },
  classic: {
    id: "classic",
    label: "Classic",
    aspect: "square",
    badgeClass: "bg-gray-100 text-gray-700",
  },
  warm: {
    id: "warm",
    label: "Warm",
    aspect: "square",
    badgeClass: "bg-amber-100 text-amber-700",
  },
};

export const templateList: TemplateMeta[] = Object.values(templateMeta);
