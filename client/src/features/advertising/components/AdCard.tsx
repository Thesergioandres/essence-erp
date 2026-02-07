/**
 * AdCard — Tarjeta individual de un anuncio generado
 * Muestra una preview escalada del template y los botones de acción.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdProduct, TemplateType } from "../types/advertising.types";
import type { TemplateProps } from "../types/advertising.types";
import StoryTemplate from "./StoryTemplate";
import FeedTemplate from "./FeedTemplate";
import PromoTemplate from "./PromoTemplate";
import { createThemedTemplate } from "./themedTemplateFactory";
import { downloadAsPng, shareImage } from "../utils/imageExport";
import { generateSalesCopy } from "../utils/salesCopy";
import { templateMeta } from "../utils/templateThemes";

interface AdCardProps {
  product: AdProduct;
  template: TemplateType;
  logoUrl?: string;
  businessName?: string;
}

const templateMap: Record<
  TemplateType,
  React.ForwardRefExoticComponent<
    TemplateProps & React.RefAttributes<HTMLDivElement>
  >
> = {
  story: StoryTemplate,
  feed: FeedTemplate,
  promo: PromoTemplate,
  minimal: createThemedTemplate("minimal"),
  neon: createThemedTemplate("neon"),
  luxury: createThemedTemplate("luxury"),
  pastel: createThemedTemplate("pastel"),
  editorial: createThemedTemplate("editorial"),
  tech: createThemedTemplate("tech"),
  monochrome: createThemedTemplate("monochrome"),
  bold: createThemedTemplate("bold"),
  noir: createThemedTemplate("noir"),
  vapor: createThemedTemplate("vapor"),
  candy: createThemedTemplate("candy"),
  studio: createThemedTemplate("studio"),
  eco: createThemedTemplate("eco"),
  sport: createThemedTemplate("sport"),
  beauty: createThemedTemplate("beauty"),
  classic: createThemedTemplate("classic"),
  warm: createThemedTemplate("warm"),
};

export default function AdCard({
  product,
  template,
  logoUrl,
  businessName,
}: AdCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inView, setInView] = useState(false);
  const [exportRender, setExportRender] = useState(false);

  const TemplateComponent = templateMap[template];
  const filename = `${product.name.replace(/\s+/g, "_")}_${template}`;
  const shouldRender = inView;
  const meta = templateMeta[template];
  const isStory = meta.aspect === "story";

  useEffect(() => {
    if (!rootRef.current || inView) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [inView]);

  const waitForExport = useCallback(async () => {
    if (exportRef.current) return true;

    return new Promise<boolean>(resolve => {
      let tries = 0;
      const tick = () => {
        if (exportRef.current) return resolve(true);
        if (tries++ > 30) return resolve(false);
        requestAnimationFrame(tick);
      };
      tick();
    });
  }, []);

  const ensureExportRendered = useCallback(async () => {
    if (exportRef.current) return true;
    setExportRender(true);
    return waitForExport();
  }, [waitForExport]);

  const handleDownload = useCallback(async () => {
    if (busy) return;
    const exportReady = await ensureExportRendered();
    if (!exportReady || !exportRef.current) return;
    setBusy(true);
    try {
      await downloadAsPng(exportRef.current, filename);
    } catch (err) {
      console.error("Error al descargar:", err);
    } finally {
      setBusy(false);
      setExportRender(false);
    }
  }, [filename, busy, ensureExportRendered]);

  const handleShare = useCallback(async () => {
    if (busy) return;
    const exportReady = await ensureExportRendered();
    if (!exportReady || !exportRef.current) return;
    setBusy(true);
    try {
      const copy = generateSalesCopy(product);
      await shareImage(exportRef.current, filename, copy);
    } catch (err) {
      console.error("Error al compartir:", err);
    } finally {
      setBusy(false);
      setExportRender(false);
    }
  }, [product, filename, busy, ensureExportRendered]);

  const handleCopyCopy = useCallback(async () => {
    const copy = generateSalesCopy(product);
    try {
      await navigator.clipboard.writeText(copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = copy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [product]);

  return (
    <div
      ref={rootRef}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Preview escalada */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gray-50">
        {/* Badge del template */}
        <span
          className={`absolute left-3 top-3 z-20 rounded-full px-3 py-1 text-xs font-bold ${meta.badgeClass}`}
        >
          {meta.label}
        </span>

        {/* Container escalado para preview visual */}
        <div
          className="relative overflow-hidden"
          style={{
            width: isStory ? 1080 * 0.145 : 1080 * 0.24,
            height: isStory ? 1920 * 0.145 : 1080 * 0.24,
            margin: "16px auto",
          }}
        >
          {shouldRender ? (
            <div
              style={{
                transform: isStory ? "scale(0.145)" : "scale(0.24)",
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <TemplateComponent
                ref={canvasRef}
                product={product}
                logoUrl={logoUrl}
                businessName={businessName}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-400">
              Vista previa
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-emerald-600">
          ${product.price.toLocaleString("es-MX")}
        </p>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {busy ? "..." : "Descargar"}
          </button>

          <button
            onClick={handleShare}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          <button
            onClick={handleCopyCopy}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              copied
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            {copied ? "¡Copiado!" : "Copy"}
          </button>
        </div>
      </div>

      {exportRender && (
        <div
          style={{
            position: "fixed",
            left: "-6000px",
            top: "0",
            pointerEvents: "none",
          }}
        >
          <TemplateComponent
            ref={exportRef}
            product={product}
            logoUrl={logoUrl}
            businessName={businessName}
          />
        </div>
      )}
    </div>
  );
}
