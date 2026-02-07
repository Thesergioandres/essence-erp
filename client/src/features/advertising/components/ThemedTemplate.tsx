/**
 * ThemedTemplate — Plantilla generica para multiples estilos
 */
import { forwardRef } from "react";
import type { TemplateProps, TemplateType } from "../types/advertising.types";
import { templateMeta } from "../utils/templateThemes";

interface ThemedTemplateProps extends TemplateProps {
  variant: TemplateType;
}

type ThemeTokens = {
  background: string;
  accent: string;
  titleFont: string;
  bodyFont: string;
  priceBg: string;
  priceColor: string;
  badgeBg: string;
  badgeColor: string;
  ctaBg: string;
  ctaColor: string;
  frameBg: string;
  frameBorder: string;
  frameShadow: string;
};

const THEME_TOKENS: Record<string, ThemeTokens> = {
  minimal: {
    background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
    accent: "linear-gradient(90deg, #111827 0%, #1f2937 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#111827",
    priceColor: "#f8fafc",
    badgeBg: "#111827",
    badgeColor: "#fef3c7",
    ctaBg: "#111827",
    ctaColor: "#f8fafc",
    frameBg: "#ffffff",
    frameBorder: "#e5e7eb",
    frameShadow: "0 26px 70px rgba(0,0,0,0.12)",
  },
  neon: {
    background: "linear-gradient(135deg, #0b1020 0%, #0f172a 100%)",
    accent: "linear-gradient(90deg, #22d3ee 0%, #a855f7 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#22d3ee",
    priceColor: "#0b1020",
    badgeBg: "#a855f7",
    badgeColor: "#f8fafc",
    ctaBg: "#22d3ee",
    ctaColor: "#0b1020",
    frameBg: "rgba(255,255,255,0.08)",
    frameBorder: "rgba(255,255,255,0.2)",
    frameShadow: "0 30px 80px rgba(0,0,0,0.45)",
  },
  luxury: {
    background: "linear-gradient(135deg, #0b0f1a 0%, #1a1f2b 100%)",
    accent: "linear-gradient(90deg, #d4af37 0%, #f6e27a 100%)",
    titleFont: "'Bodoni MT', 'Bodoni 72', 'Times New Roman', serif",
    bodyFont: "'Didot', 'Times New Roman', serif",
    priceBg: "#d4af37",
    priceColor: "#0b0f1a",
    badgeBg: "#d4af37",
    badgeColor: "#0b0f1a",
    ctaBg: "#d4af37",
    ctaColor: "#0b0f1a",
    frameBg: "rgba(255,255,255,0.06)",
    frameBorder: "rgba(212,175,55,0.5)",
    frameShadow: "0 26px 70px rgba(0,0,0,0.5)",
  },
  pastel: {
    background: "linear-gradient(135deg, #fde2e4 0%, #e2ece9 100%)",
    accent: "linear-gradient(90deg, #a9def9 0%, #d0f4de 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#ffcad4",
    priceColor: "#3a0f2e",
    badgeBg: "#a9def9",
    badgeColor: "#0f172a",
    ctaBg: "#ffcad4",
    ctaColor: "#3a0f2e",
    frameBg: "rgba(255,255,255,0.7)",
    frameBorder: "rgba(0,0,0,0.05)",
    frameShadow: "0 20px 50px rgba(0,0,0,0.12)",
  },
  editorial: {
    background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
    accent: "linear-gradient(90deg, #111827 0%, #1f2937 100%)",
    titleFont: "'Times New Roman', serif",
    bodyFont: "'Georgia', 'Times New Roman', serif",
    priceBg: "#111827",
    priceColor: "#fef3c7",
    badgeBg: "#111827",
    badgeColor: "#f8fafc",
    ctaBg: "#111827",
    ctaColor: "#f8fafc",
    frameBg: "#ffffff",
    frameBorder: "#e5e7eb",
    frameShadow: "0 20px 50px rgba(0,0,0,0.12)",
  },
  tech: {
    background: "linear-gradient(135deg, #0b1220 0%, #0f172a 100%)",
    accent: "linear-gradient(90deg, #38bdf8 0%, #22d3ee 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#38bdf8",
    priceColor: "#0b1020",
    badgeBg: "#22d3ee",
    badgeColor: "#0b1020",
    ctaBg: "#38bdf8",
    ctaColor: "#0b1020",
    frameBg: "rgba(255,255,255,0.08)",
    frameBorder: "rgba(56,189,248,0.35)",
    frameShadow: "0 30px 80px rgba(0,0,0,0.45)",
  },
  monochrome: {
    background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
    accent: "linear-gradient(90deg, #e5e7eb 0%, #9ca3af 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#e5e7eb",
    priceColor: "#111827",
    badgeBg: "#e5e7eb",
    badgeColor: "#111827",
    ctaBg: "#e5e7eb",
    ctaColor: "#111827",
    frameBg: "rgba(255,255,255,0.08)",
    frameBorder: "rgba(255,255,255,0.25)",
    frameShadow: "0 30px 80px rgba(0,0,0,0.45)",
  },
  bold: {
    background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
    accent: "linear-gradient(90deg, #111827 0%, #0f172a 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#111827",
    priceColor: "#facc15",
    badgeBg: "#111827",
    badgeColor: "#facc15",
    ctaBg: "#111827",
    ctaColor: "#facc15",
    frameBg: "rgba(255,255,255,0.1)",
    frameBorder: "rgba(255,255,255,0.35)",
    frameShadow: "0 30px 80px rgba(0,0,0,0.45)",
  },
  noir: {
    background: "linear-gradient(135deg, #000000 0%, #111827 100%)",
    accent: "linear-gradient(90deg, #ffffff 0%, #d1d5db 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#ffffff",
    priceColor: "#000000",
    badgeBg: "#ffffff",
    badgeColor: "#000000",
    ctaBg: "#ffffff",
    ctaColor: "#000000",
    frameBg: "rgba(255,255,255,0.05)",
    frameBorder: "rgba(255,255,255,0.2)",
    frameShadow: "0 30px 80px rgba(0,0,0,0.6)",
  },
  vapor: {
    background:
      "linear-gradient(135deg, #22d3ee 0%, #a78bfa 60%, #f472b6 100%)",
    accent: "linear-gradient(90deg, #f472b6 0%, #a78bfa 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#0b1020",
    priceColor: "#f472b6",
    badgeBg: "#0b1020",
    badgeColor: "#f472b6",
    ctaBg: "#0b1020",
    ctaColor: "#f472b6",
    frameBg: "rgba(255,255,255,0.12)",
    frameBorder: "rgba(255,255,255,0.35)",
    frameShadow: "0 30px 80px rgba(0,0,0,0.35)",
  },
  candy: {
    background: "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
    accent: "linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#fef3c7",
    priceColor: "#7f1d1d",
    badgeBg: "#fef3c7",
    badgeColor: "#7f1d1d",
    ctaBg: "#fef3c7",
    ctaColor: "#7f1d1d",
    frameBg: "rgba(255,255,255,0.2)",
    frameBorder: "rgba(255,255,255,0.45)",
    frameShadow: "0 26px 70px rgba(0,0,0,0.3)",
  },
  studio: {
    background: "linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)",
    accent: "linear-gradient(90deg, #111827 0%, #374151 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#111827",
    priceColor: "#f8fafc",
    badgeBg: "#111827",
    badgeColor: "#f8fafc",
    ctaBg: "#111827",
    ctaColor: "#f8fafc",
    frameBg: "#ffffff",
    frameBorder: "#e5e7eb",
    frameShadow: "0 26px 60px rgba(0,0,0,0.18)",
  },
  eco: {
    background: "linear-gradient(135deg, #064e3b 0%, #14532d 100%)",
    accent: "linear-gradient(90deg, #a7f3d0 0%, #34d399 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#a7f3d0",
    priceColor: "#064e3b",
    badgeBg: "#a7f3d0",
    badgeColor: "#064e3b",
    ctaBg: "#a7f3d0",
    ctaColor: "#064e3b",
    frameBg: "rgba(255,255,255,0.08)",
    frameBorder: "rgba(167,243,208,0.6)",
    frameShadow: "0 30px 70px rgba(0,0,0,0.45)",
  },
  sport: {
    background: "linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)",
    accent: "linear-gradient(90deg, #f97316 0%, #f59e0b 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#f97316",
    priceColor: "#0b1020",
    badgeBg: "#f97316",
    badgeColor: "#0b1020",
    ctaBg: "#f97316",
    ctaColor: "#0b1020",
    frameBg: "rgba(255,255,255,0.15)",
    frameBorder: "rgba(255,255,255,0.45)",
    frameShadow: "0 30px 80px rgba(0,0,0,0.35)",
  },
  beauty: {
    background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    accent: "linear-gradient(90deg, #db2777 0%, #f472b6 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#db2777",
    priceColor: "#ffffff",
    badgeBg: "#db2777",
    badgeColor: "#ffffff",
    ctaBg: "#db2777",
    ctaColor: "#ffffff",
    frameBg: "rgba(255,255,255,0.6)",
    frameBorder: "rgba(219,39,119,0.4)",
    frameShadow: "0 26px 60px rgba(0,0,0,0.15)",
  },
  classic: {
    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
    accent: "linear-gradient(90deg, #374151 0%, #111827 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#374151",
    priceColor: "#f9fafb",
    badgeBg: "#374151",
    badgeColor: "#f9fafb",
    ctaBg: "#374151",
    ctaColor: "#f9fafb",
    frameBg: "#ffffff",
    frameBorder: "#d1d5db",
    frameShadow: "0 26px 60px rgba(0,0,0,0.12)",
  },
  warm: {
    background:
      "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ef4444 100%)",
    accent: "linear-gradient(90deg, #ffffff 0%, #fde68a 100%)",
    titleFont: "'Bebas Neue', 'Oswald', 'Segoe UI', sans-serif",
    bodyFont: "'Space Grotesk', 'Segoe UI', sans-serif",
    priceBg: "#ffffff",
    priceColor: "#7c2d12",
    badgeBg: "#ffffff",
    badgeColor: "#7c2d12",
    ctaBg: "#ffffff",
    ctaColor: "#7c2d12",
    frameBg: "rgba(255,255,255,0.15)",
    frameBorder: "rgba(255,255,255,0.45)",
    frameShadow: "0 30px 70px rgba(0,0,0,0.25)",
  },
};

const ThemedTemplate = forwardRef<HTMLDivElement, ThemedTemplateProps>(
  ({ product, logoUrl, businessName, variant }, ref) => {
    const meta = templateMeta[variant];
    const theme = THEME_TOKENS[variant] || THEME_TOKENS.minimal;
    const isStory = meta.aspect === "story";

    const width = 1080;
    const height = isStory ? 1920 : 1080;
    const imageSize = isStory ? 760 : 640;
    const imageInner = isStory ? 700 : 600;
    const priceSize = isStory ? "text-7xl" : "text-6xl";
    const titleSize = isStory ? "text-6xl" : "text-5xl";
    const paddingX = isStory ? "px-12" : "px-10";
    const paddingY = isStory ? "pt-12" : "pt-8";

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          backgroundImage: theme.background,
          fontFamily: theme.titleFont,
        }}
        className="relative flex flex-col overflow-hidden text-white"
      >
        {/* Accent bar */}
        <div
          className="absolute left-0 top-0 h-2 w-full"
          style={{ backgroundImage: theme.accent }}
        />

        {/* Header */}
        <div
          className={`relative z-10 flex items-center gap-4 ${paddingX} ${paddingY}`}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt="logo"
              crossOrigin="anonymous"
              className="h-14 w-14 rounded-full object-cover"
              style={{ border: `2px solid ${theme.frameBorder}` }}
            />
          )}
          <div className="flex flex-col">
            {businessName && (
              <span className="text-xl font-bold" style={{ opacity: 0.9 }}>
                {businessName}
              </span>
            )}
            <span
              className="mt-1 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeColor,
                letterSpacing: "0.2em",
              }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {/* Product image */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div
            className="flex items-center justify-center rounded-[44px]"
            style={{
              width: imageSize,
              height: imageSize,
              backgroundColor: theme.frameBg,
              border: `1px solid ${theme.frameBorder}`,
              boxShadow: theme.frameShadow,
            }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                crossOrigin="anonymous"
                className="rounded-3xl object-contain"
                style={{
                  width: imageInner,
                  height: imageInner,
                  filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.25))",
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-3xl text-8xl"
                style={{
                  width: imageInner,
                  height: imageInner,
                  backgroundColor: "rgba(255,255,255,0.12)",
                }}
              >
                📦
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`relative z-10 ${paddingX} pb-12`}
          style={{ fontFamily: theme.bodyFont }}
        >
          <h2 className={`${titleSize} font-extrabold leading-tight`}>
            {product.name}
          </h2>
          {product.description && (
            <p className="mt-3 line-clamp-2 text-xl" style={{ opacity: 0.85 }}>
              {product.description}
            </p>
          )}
          <div className="mt-6 flex items-end gap-4">
            <div
              className="rounded-2xl px-6 py-4"
              style={{
                backgroundColor: theme.priceBg,
                color: theme.priceColor,
                boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
              }}
            >
              <span className={`${priceSize} font-black`}>
                ${product.price.toLocaleString("es-MX")}
              </span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-2xl line-through" style={{ opacity: 0.6 }}>
                ${product.originalPrice.toLocaleString("es-MX")}
              </span>
            )}
          </div>
          <div
            className="mt-5 inline-flex w-fit items-center rounded-full px-6 py-2 text-lg font-semibold"
            style={{ backgroundColor: theme.ctaBg, color: theme.ctaColor }}
          >
            Disponible hoy
          </div>
        </div>
      </div>
    );
  }
);

ThemedTemplate.displayName = "ThemedTemplate";
export default ThemedTemplate;
