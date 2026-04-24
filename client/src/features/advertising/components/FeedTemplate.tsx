/**
 * FeedTemplate — Aspecto 1:1, estilo catálogo elegante (1080×1080)
 */
import { forwardRef } from "react";
import type { TemplateProps } from "../types/advertising.types";

const FeedTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ product, logoUrl, businessName }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          backgroundImage: "linear-gradient(135deg, #f8fafc 0%, #f3f4f6 100%)",
          fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
        }}
        className="relative flex flex-col overflow-hidden"
      >
        {/* Banda superior */}
        <div
          className="absolute left-0 top-0 h-2 w-full"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #0ea5e9 0%, #22d3ee 50%, #a855f7 100%)",
          }}
        />

        {/* Header con logo */}
        <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-10 py-6">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="logo"
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}
          >
            {businessName || "Catálogo"}
          </span>
          <span
            className="ml-auto rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.25em]"
            style={{
              backgroundColor: "#111827",
              color: "#fef3c7",
            }}
          >
            Nuevo
          </span>
        </div>

        {/* Imagen del producto - zona principal */}
        <div className="flex flex-1 items-center justify-center bg-white p-8">
          <div
            className="flex h-[720px] w-[720px] items-center justify-center rounded-[44px]"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 30px 70px rgba(15, 23, 42, 0.15)",
            }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="max-h-[640px] w-auto object-contain"
                style={{ filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.2))" }}
              />
            ) : (
              <div
                className="flex h-[500px] w-[500px] items-center justify-center rounded-2xl text-8xl"
                style={{ backgroundColor: "#f3f4f6" }}
              >
                📦
              </div>
            )}
          </div>
        </div>

        {/* Footer con info */}
        <div className="border-t border-gray-200 bg-white px-10 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-6">
              <h2
                className="text-3xl font-bold leading-tight"
                style={{
                  fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                  letterSpacing: "0.03em",
                }}
              >
                {product.name}
              </h2>
              {product.category && (
                <span
                  className="mt-2 inline-block rounded-full px-4 py-1 text-sm font-semibold"
                  style={{
                    backgroundColor: "#111827",
                    color: "#e2e8f0",
                  }}
                >
                  {product.category}
                </span>
              )}
            </div>
            <div className="text-right">
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="block text-lg text-gray-400 line-through">
                    ${product.originalPrice.toLocaleString("es-MX")}
                  </span>
                )}
              <div
                className="mt-1 inline-block rounded-xl px-4 py-3"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #111827 0%, #1f2937 100%)",
                  color: "#f8fafc",
                }}
              >
                <span className="text-4xl font-black">
                  ${product.price.toLocaleString("es-MX")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FeedTemplate.displayName = "FeedTemplate";
export default FeedTemplate;
