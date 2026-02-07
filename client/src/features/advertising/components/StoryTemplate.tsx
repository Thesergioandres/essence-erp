/**
 * StoryTemplate — Aspecto 9:16, estilo moderno para stories (1080×1920)
 */
import { forwardRef } from "react";
import type { TemplateProps } from "../types/advertising.types";

const StoryTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ product, logoUrl, businessName }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1920,
          backgroundImage:
            "linear-gradient(135deg, #c026d3 0%, #7e22ce 50%, #312e81 100%)",
          fontFamily:
            "'Bebas Neue', 'Oswald', 'Arial Black', 'Segoe UI', sans-serif",
        }}
        className="relative flex flex-col overflow-hidden text-white"
      >
        {/* Banda diagonal */}
        <div
          className="absolute -left-40 top-32 h-[320px] w-[1400px] rotate-[-10deg]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0))",
          }}
        />

        {/* Círculos decorativos */}
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        />
        <div
          className="absolute -left-24 bottom-60 h-72 w-72 rounded-full"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        />

        {/* Logo superior */}
        <div className="relative z-10 flex items-center gap-4 px-12 pt-14">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="logo"
              crossOrigin="anonymous"
              className="h-16 w-16 rounded-full border-2 object-cover"
              style={{ borderColor: "rgba(255, 255, 255, 0.4)" }}
            />
          )}
          <div className="flex flex-col">
            {businessName && (
              <span className="text-2xl font-bold tracking-wide opacity-90">
                {businessName}
              </span>
            )}
            <span
              className="mt-1 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.18)" }}
            >
              Nuevo Drop
            </span>
          </div>
        </div>

        {/* Imagen del producto */}
        <div className="relative z-10 mt-10 flex flex-1 items-center justify-center px-8">
          <div
            className="flex h-[760px] w-[760px] items-center justify-center rounded-[48px]"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                crossOrigin="anonymous"
                className="max-h-[720px] w-auto rounded-3xl object-contain"
                style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.35))" }}
              />
            ) : (
              <div
                className="flex h-[600px] w-[600px] items-center justify-center rounded-3xl text-8xl"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              >
                📦
              </div>
            )}
          </div>
        </div>

        {/* Info del producto */}
        <div className="relative z-10 px-12 pb-20">
          <h2
            className="mb-3 text-6xl font-extrabold leading-tight"
            style={{ letterSpacing: "0.02em" }}
          >
            {product.name}
          </h2>
          {product.description && (
            <p
              className="mb-6 line-clamp-2 text-2xl leading-relaxed"
              style={{
                fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
                opacity: 0.85,
              }}
            >
              {product.description}
            </p>
          )}
          <div className="flex items-end gap-4">
            <div
              className="rounded-2xl px-6 py-4"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #22d3ee 0%, #60a5fa 50%, #a78bfa 100%)",
                color: "#0b1020",
                boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
              }}
            >
              <span className="text-7xl font-black tracking-tight">
                ${product.price.toLocaleString("es-MX")}
              </span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="mb-2 text-3xl line-through opacity-50">
                ${product.originalPrice.toLocaleString("es-MX")}
              </span>
            )}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div
              className="inline-block rounded-full px-8 py-3 text-xl font-semibold"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.18)" }}
            >
              Disponible hoy
            </div>
            <span
              className="text-xl"
              style={{ fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif" }}
            >
              Envio rapido
            </span>
          </div>
        </div>
      </div>
    );
  }
);

StoryTemplate.displayName = "StoryTemplate";
export default StoryTemplate;
