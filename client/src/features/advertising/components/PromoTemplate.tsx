/**
 * PromoTemplate — Colores fuertes, destaca precio, ideal para promociones (1080×1080)
 */
import { forwardRef } from "react";
import type { TemplateProps } from "../types/advertising.types";

const PromoTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ product, logoUrl, businessName }, ref) => {
    const hasDiscount =
      product.originalPrice && product.originalPrice > product.price;
    const discountPct = hasDiscount
      ? Math.round(
          ((product.originalPrice! - product.price) / product.originalPrice!) *
            100
        )
      : 0;
    const collageImages = (product.images || []).filter(Boolean).slice(0, 4);

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          backgroundImage:
            "linear-gradient(135deg, #dc2626 0%, #f97316 55%, #facc15 100%)",
          fontFamily:
            "'Bebas Neue', 'Oswald', 'Arial Black', 'Segoe UI', sans-serif",
        }}
        className="relative flex flex-col overflow-hidden text-white"
      >
        {/* Franjas diagonales */}
        <div
          className="absolute -left-20 top-10 h-[120px] w-[1300px] rotate-[-6deg]"
          style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
        />
        <div
          className="absolute -left-24 top-44 h-[80px] w-[1300px] rotate-[-6deg]"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        />

        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 text-[200px] font-black leading-none">
            %
          </div>
          <div className="absolute bottom-10 right-10 text-[200px] font-black leading-none">
            $
          </div>
        </div>

        {/* Badge de descuento */}
        {hasDiscount && (
          <div
            className="absolute right-8 top-8 z-20 flex h-36 w-36 items-center justify-center rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #fef08a 0%, #fde047 50%, #f59e0b 100%)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            }}
          >
            <span
              className="text-center text-3xl font-black leading-tight"
              style={{ color: "#7f1d1d" }}
            >
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 px-10 pt-10">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="logo"
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-full border-2 object-cover"
              style={{ borderColor: "rgba(255, 255, 255, 0.5)" }}
            />
          )}
          <span className="text-xl font-bold opacity-90">
            {businessName || ""}
          </span>
        </div>

        {/* Encabezado promo */}
        <div className="relative z-10 px-10 pt-6">
          <div
            className="inline-flex items-center gap-3 rounded-full px-6 py-2 text-xl font-bold uppercase tracking-[0.2em]"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
            }}
          >
            <span>Oferta</span>
            <span style={{ color: "#fde047" }}>Especial</span>
          </div>
        </div>

        {/* Producto */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-8">
          <div className="grid grid-cols-[1fr_1fr] items-center gap-6">
            <div
              className="flex h-[520px] w-[520px] items-center justify-center rounded-[48px]"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.35)",
                boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
              }}
            >
              {collageImages.length > 0 ? (
                <div className="grid h-[440px] w-[440px] grid-cols-2 gap-3">
                  {collageImages.map((image, idx) => (
                    <div
                      key={`${image}-${idx}`}
                      className="flex items-center justify-center rounded-3xl"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    >
                      <img
                        src={image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="h-[190px] w-[190px] object-contain"
                        style={{
                          filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.35))",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="h-[440px] w-[440px] rounded-3xl object-contain"
                  style={{
                    filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.35))",
                  }}
                />
              ) : (
                <div
                  className="flex h-[400px] w-[400px] items-center justify-center rounded-3xl text-8xl"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                >
                  📦
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <h2
                className="text-6xl font-extrabold leading-tight"
                style={{ letterSpacing: "0.02em" }}
              >
                {product.name}
              </h2>
              {hasDiscount && (
                <span className="text-3xl font-medium line-through opacity-70">
                  ${product.originalPrice!.toLocaleString("es-MX")}
                </span>
              )}
              <div
                className="w-fit rounded-2xl px-6 py-4"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #111827 0%, #0f172a 100%)",
                  color: "#fde047",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
                }}
              >
                <span className="text-8xl font-black tracking-tighter">
                  ${product.price.toLocaleString("es-MX")}
                </span>
              </div>
              <div
                className="mt-2 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2 text-lg"
                style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
              >
                Entrega inmediata
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="relative z-10 px-10 pb-10">
          <div
            className="rounded-2xl px-8 py-5 text-center text-2xl font-bold"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              letterSpacing: "0.08em",
            }}
          >
            Aprovecha hoy — Unidades limitadas
          </div>
        </div>
      </div>
    );
  }
);

PromoTemplate.displayName = "PromoTemplate";
export default PromoTemplate;
