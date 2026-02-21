import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
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
  icon: ComponentType<{ className?: string }>;
  markdown: string;
};

const sections: ManualSection[] = [
  {
    id: "inicio",
    title: "Inicio",
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

  return (
    <div className="bg-app-base min-h-screen px-3 py-6 sm:px-5 md:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px,1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:sticky lg:top-24 lg:h-fit">
          <h1 className="mb-3 text-lg font-semibold text-white">
            📘 Manual de Usuario
          </h1>
          <nav className="space-y-2">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = section.id === activeId;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "border border-fuchsia-400/40 bg-fuchsia-500/20 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.title}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.article
              key={activeSection.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="prose prose-invert prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 max-w-none"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeSection.markdown}
              </ReactMarkdown>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
