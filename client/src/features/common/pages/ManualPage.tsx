import { AnimatePresence, m as motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Package,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { type ComponentType, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ManualSection = {
  id: string;
  title: string;
  description: string;
  readingTime: string;
  icon: ComponentType<{ className?: string }>;
  markdown: string;
};

const sections: ManualSection[] = [
  {
    id: "inicio",
    title: "Inicio",
    description: "Panorama general de la plataforma y objetivos operativos.",
    readingTime: "3 min",
    icon: BookOpen,
    markdown: `## ¿Qué es Essence ERP?

Essence ERP es una plataforma para centralizar **ventas, inventario, garantías, comisiones y análisis** en un solo sistema.

### Objetivos principales

- Evitar fugas de margen por precios desactualizados o decisiones tardías.
- Coordinar operación entre bodega, sedes y distribuidores.
- Dar trazabilidad completa de cada venta y cada ajuste.

### Resultado esperado

Un flujo operativo más rápido, con menos errores manuales y mejor control financiero.
`,
  },
  {
    id: "ventas",
    title: "Ventas",
    description: "Registro correcto de ventas, crédito y conciliación diaria.",
    readingTime: "4 min",
    icon: ShoppingCart,
    markdown: `## Cómo registrar ventas y créditos

### Venta estándar

1. Selecciona producto y cantidad.
2. Verifica origen de stock.
3. Confirma precio, costos adicionales y método de pago.
4. Guarda la venta.

### Venta a crédito / fiado

- La venta queda registrada y asociada al cliente.
- El estado de pago define el impacto en indicadores de caja.
- La confirmación posterior del pago actualiza los KPIs monetarios.

### Buenas prácticas

- Confirmar método de pago correctamente.
- Evitar duplicar ventas por recargas de pantalla.
- Revisar historial de ventas para conciliación de cierre.
`,
  },
  {
    id: "garantias",
    title: "Garantías",
    description: "Flujos de upsell, refund y control administrativo.",
    readingTime: "4 min",
    icon: ShieldCheck,
    markdown: `## Proceso detallado (Upsell / Refund)

### Flujo base

1. Buscar venta original.
2. Seleccionar ítem defectuoso y cantidad.
3. Elegir producto y origen de reemplazo.
4. Confirmar resolución.

### Escenarios

- **Mismo precio:** no hay cobro adicional ni devolución.
- **Upsell:** reemplazo más caro, se genera diferencia a cobrar.
- **Refund:** reemplazo más barato, se calcula devolución.

### Control administrativo

El panel de defectuosos permite aprobar/rechazar y dejar trazabilidad de notas y ajustes.
`,
  },
  {
    id: "inventario",
    title: "Inventario",
    description: "Diferencias entre bodega, sedes y distribuidores.",
    readingTime: "3 min",
    icon: Package,
    markdown: `## Entender Bodega vs Sedes

### Jerarquía de stock

- **Bodega Central:** stock principal de negocio.
- **Sedes:** stock operativo local por sucursal.
- **Distribuidores:** stock asignado por usuario.

### Regla clave

Toda salida de inventario debe descontarse de su **origen real** para evitar descuadres.

### Recomendación operativa

- Monitorear quiebres de stock diariamente.
- Validar transferencias al cierre de jornada.
- Mantener recepción de mercancía al día para no distorsionar costos.
`,
  },
  {
    id: "faq",
    title: "Preguntas Frecuentes",
    description: "Respuestas rápidas para dudas comunes de operación.",
    readingTime: "2 min",
    icon: HelpCircle,
    markdown: `## Preguntas Frecuentes

### ¿Por qué no veo ciertos módulos?
Depende de los **features habilitados** en tu negocio y de tu rol.

### ¿Por qué no puedo usar bodega en garantías?
El acceso se controla por permisos y contexto de usuario.

### ¿Cómo sé si un precio está actualizado?
Revisa la **Lista de Precios** (admin) o el **Catálogo de Precios** (distribuidor).

### ¿Qué hago si una venta quedó mal registrada?
Solicita ajuste con soporte/admin y valida impacto en inventario y reportes.
`,
  },
];

export default function ManualPage() {
  const [activeId, setActiveId] = useState(sections[0].id);

  const activeSection = useMemo(
    () => sections.find(section => section.id === activeId) || sections[0],
    [activeId]
  );

  const activeIndex = sections.findIndex(section => section.id === activeId);
  const progressPercentage = Math.round(
    ((activeIndex + 1) / sections.length) * 100
  );
  const isFirstSection = activeIndex <= 0;
  const isLastSection = activeIndex >= sections.length - 1;

  const goToRelativeSection = (direction: -1 | 1) => {
    const targetIndex = activeIndex + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    setActiveId(sections[targetIndex].id);
  };

  return (
    <div className="bg-app-base min-h-screen px-3 py-6 text-gray-100 sm:px-5 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="bg-linear-to-br overflow-hidden rounded-3xl border border-fuchsia-400/35 from-fuchsia-500/20 via-slate-900/70 to-slate-900/40 p-5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-100">
                Centro de ayuda
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                📘 Manual de Usuario
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-100 sm:text-base">
                Guía práctica para operar Essence ERP con menos errores y más
                control en ventas, inventario y garantías.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-gray-100">
                  {sections.length} secciones
                </span>
                <span className="rounded-full border border-fuchsia-300/35 bg-fuchsia-500/15 px-3 py-1 text-fuchsia-100">
                  Paso {activeIndex + 1} de {sections.length}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-gray-100">
                  {activeSection.readingTime} aprox.
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-slate-900/70 px-4 py-3 text-sm text-gray-100">
              <p className="font-medium text-white">Progreso de lectura</p>
              <p className="mt-1">{progressPercentage}% completado</p>
              <div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-fuchsia-400 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
          <aside className="rounded-2xl border border-white/15 bg-slate-900/70 p-3 lg:sticky lg:top-24 lg:h-fit">
            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.18em] text-fuchsia-100">
                Secciones
              </p>
              <p className="mt-1 text-xs text-gray-200">
                Selecciona un tema para ver la guía paso a paso.
              </p>
            </div>
            <nav className="space-y-2">
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = section.id === activeId;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveId(section.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      isActive
                        ? "border-fuchsia-300/50 bg-fuchsia-500/25 text-white"
                        : "border-transparent text-gray-100 hover:border-white/15 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 rounded-lg p-2 ${
                          isActive ? "bg-fuchsia-400/20" : "bg-white/5"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0">
                        <p className="font-semibold">{section.title}</p>
                        <p className="mt-1 text-xs text-gray-200">
                          {section.description}
                        </p>
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-fuchsia-100">
                          {section.readingTime}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="rounded-3xl border border-white/15 bg-slate-900/70 p-5 sm:p-7 lg:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-300">
                  Sección activa
                </p>
                <h2 className="text-xl font-semibold text-white">
                  {activeSection.title}
                </h2>
              </div>
              <span className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-100">
                {activeSection.readingTime}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.article
                key={activeSection.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="prose prose-invert prose-headings:mb-3 prose-headings:font-semibold prose-headings:text-white prose-h2:text-2xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-gray-100 prose-strong:text-white prose-em:text-fuchsia-100 prose-ul:text-gray-100 prose-ol:text-gray-100 prose-li:text-gray-100 prose-li:marker:text-fuchsia-300 prose-a:text-fuchsia-200 prose-a:no-underline hover:prose-a:text-fuchsia-100 prose-code:text-fuchsia-100 prose-pre:border prose-pre:border-white/15 prose-pre:bg-black/40 prose-blockquote:border-fuchsia-300/40 prose-blockquote:text-gray-100 max-w-none"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeSection.markdown}
                </ReactMarkdown>
              </motion.article>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => goToRelativeSection(-1)}
                disabled={isFirstSection}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <p className="text-xs text-gray-300">
                Tip: usa el menú lateral para saltar entre temas.
              </p>

              <button
                type="button"
                onClick={() => goToRelativeSection(1)}
                disabled={isLastSection}
                className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/20 px-4 py-2 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
