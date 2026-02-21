import { m as motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../../components/Footer";
import Navbar from "../../../components/Navbar";
import { Button } from "../../../shared/components/ui";
import { globalSettingsService } from "../services";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const liveResults = [
  { label: "Ventas recuperadas", value: "+22%", tone: "text-emerald-200" },
  { label: "Tiempo operativo", value: "-30%", tone: "text-cyan-200" },
  { label: "Margen protegido", value: "+12%", tone: "text-fuchsia-200" },
];

const painPoints = [
  "Productos agotados sin aviso y clientes que se van.",
  "Precios distintos por canal sin control real.",
  "Comisiones y márgenes que se pierden entre planillas.",
];

const solutionPoints = [
  "Inventario, ventas y comisiones sincronizados en tiempo real.",
  "Alertas accionables para reponer, promover y vender más rápido.",
  "Control de rentabilidad por producto, canal y equipo.",
];

const modules = [
  {
    title: "Inventario inteligente: nunca más una venta perdida",
    description:
      "Detecta quiebres antes de que ocurran, mueve stock rápido y recupera ingresos cada semana.",
    highlights: ["Alertas de quiebre", "Reposición rápida", "Stock por canal"],
  },
  {
    title: "Ventas omnicanal: cobra más, vende más",
    description:
      "Mismo producto, múltiples precios y reglas. Incrementa el ticket con ofertas precisas.",
    highlights: ["B2B y B2C", "Listas de precio", "Promos inteligentes"],
  },
  {
    title: "Catálogo distribuido: más alcance sin más esfuerzo",
    description:
      "Comparte catálogos en minutos, controla comisiones y acelera nuevos pedidos.",
    highlights: [
      "Catálogo compartible",
      "Comisiones claras",
      "Acceso controlado",
    ],
  },
  {
    title: "Finanzas y comisiones: más margen, menos fugas",
    description:
      "Concilia pagos, comisiones y costos sin hojas de cálculo. Protege tu margen.",
    highlights: ["Margen por SKU", "Pagos conciliados", "Cortes automáticos"],
  },
  {
    title: "Analítica accionable: decide con datos hoy",
    description:
      "Ve qué se vende, qué no, y dónde. Prioriza el stock que sí genera caja.",
    highlights: ["KPIs vivos", "Alertas de rotación", "Exportables"],
  },
  {
    title: "Automatizaciones que bajan costos",
    description:
      "Procesos nocturnos para precios y stock. Menos errores, más tiempo vendiendo.",
    highlights: ["Tareas nocturnas", "Reglas por canal", "APIs abiertas"],
  },
];

const testimonials = [
  {
    name: "Ana Gomez",
    role: "Dueña de tienda",
    quote:
      "En dos semanas dejamos de perder ventas por falta de stock. Ahora todo se ve claro.",
    metric: "+18% ventas",
  },
  {
    name: "Luis Perez",
    role: "Distribuidor",
    quote:
      "El catálogo compartido nos ahorró horas y subimos pedidos sin llamadas.",
    metric: "-35% tiempo operativo",
  },
  {
    name: "Marcela Ruiz",
    role: "Gerente de operaciones",
    quote:
      "La conciliación de comisiones ahora es simple. Cerramos mes sin sorpresas.",
    metric: "+12% margen",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [plans, setPlans] = useState<
    Array<{
      id: "starter" | "pro" | "enterprise";
      name: string;
      description?: string;
      monthlyPrice: number;
      yearlyPrice: number;
      currency: string;
      limits: { branches: number; distributors: number };
    }>
  >([]);

  useEffect(() => {
    globalSettingsService
      .getPublicSettings()
      .then(settings => {
        setMaintenanceMode(Boolean(settings.maintenanceMode));
        setPlans([
          settings.plans.starter,
          settings.plans.pro,
          settings.plans.enterprise,
        ]);
      })
      .catch(() => null);
  }, []);

  const pricingCards = useMemo(() => {
    if (plans.length > 0) return plans;
    return [
      {
        id: "starter" as const,
        name: "Starter",
        description: "Para negocios en etapa inicial",
        monthlyPrice: 19,
        yearlyPrice: 190,
        currency: "USD",
        limits: { branches: 1, distributors: 2 },
      },
      {
        id: "pro" as const,
        name: "Pro",
        description: "Para equipos que escalan ventas",
        monthlyPrice: 49,
        yearlyPrice: 490,
        currency: "USD",
        limits: { branches: 3, distributors: 10 },
      },
      {
        id: "enterprise" as const,
        name: "Enterprise",
        description: "Para operaciones multi-sede avanzadas",
        monthlyPrice: 99,
        yearlyPrice: 990,
        currency: "USD",
        limits: { branches: 10, distributors: 50 },
      },
    ];
  }, [plans]);

  const handleDemoClick = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("demo-mode", "1");
    }
    navigate("/demo?demo=1");
  };

  return (
    <div className="bg-app-base min-h-screen">
      <Navbar />

      {maintenanceMode && (
        <div className="border-y border-amber-300/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-100">
          Estamos en modo mantenimiento programado. Puedes explorar planes y
          solicitar acceso, pero algunos módulos pueden estar temporalmente
          limitados.
        </div>
      )}

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_45%)]" />
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="relative mx-auto max-w-7xl px-3 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24"
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr,0.85fr]">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
                Impulsa ventas sin caos
              </p>
              <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Impulsa tus ventas.
                <span className="block text-fuchsia-200">
                  Organiza tu negocio.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
                Controla inventario, precios y comisiones desde un solo tablero.
                Menos fugas, más pedidos, más margen.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="rounded-full bg-fuchsia-500 px-7 text-sm font-semibold text-white hover:bg-fuchsia-400"
                >
                  Solicitar demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoClick}
                  className="rounded-full border-emerald-400/50 bg-emerald-500/10 px-7 text-sm font-semibold text-emerald-200 hover:border-emerald-300 hover:bg-emerald-500/20"
                >
                  🚀 Ver Demo Interactiva
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={scrollToPricing}
                  className="rounded-full border-white/20 px-7 text-sm font-semibold text-gray-100 hover:border-fuchsia-300"
                >
                  Ver precios
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Implementación rápida",
                  "Panel unificado",
                  "Escalable por negocio",
                ].map(badge => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-purple-900/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-200">
                Resultados en vivo
              </p>
              <motion.div
                variants={staggerContainer}
                className="mt-4 grid gap-3"
              >
                {liveResults.map(item => (
                  <motion.div
                    key={item.label}
                    variants={fadeUp}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200"
                  >
                    <span>{item.label}</span>
                    <span className={`font-semibold ${item.tone}`}>
                      {item.value}
                    </span>
                  </motion.div>
                ))}
                <motion.div
                  variants={fadeUp}
                  className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 px-4 py-3 text-xs text-fuchsia-100"
                >
                  Monitorea resultados por canal en tiempo real y ajusta precio,
                  stock y comisiones sin esperar cierre mensual.
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <motion.section
        id="pricing"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-7xl px-3 py-12 sm:px-5 sm:py-14 md:px-8 md:py-16"
      >
        <motion.div variants={fadeUp} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-200">
            Planes SaaS
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Precios transparentes para crecer sin fricción
          </h2>
          <p className="mt-2 text-sm text-gray-300 sm:text-base">
            Elige el plan según tu operación y amplíalo cuando tu negocio lo
            necesite.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {pricingCards.map(plan => (
            <motion.div
              key={plan.id}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200">
                {plan.name}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {plan.currency} {plan.monthlyPrice}
                <span className="text-sm font-medium text-gray-300">/mes</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {plan.currency} {plan.yearlyPrice} /año
              </p>
              <p className="mt-3 text-sm text-gray-300">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-200">
                <li>• {plan.limits.branches} sedes incluidas</li>
                <li>• {plan.limits.distributors} distribuidores incluidos</li>
                <li>• Inventario, ventas y comisiones en tiempo real</li>
              </ul>
              <Button
                type="button"
                onClick={() => navigate("/register")}
                className="mt-5 w-full rounded-full bg-fuchsia-500 text-sm font-semibold text-white hover:bg-fuchsia-400"
              >
                Empezar con {plan.name}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto max-w-7xl px-3 py-12 sm:px-5 sm:py-14 md:px-8 md:py-16"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-rose-300/20 bg-rose-500/5 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">
              El problema
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Ventas perdidas, inventario en caos
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              {painPoints.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="bg-linear-to-br rounded-2xl border border-white/10 from-fuchsia-500/15 via-transparent to-cyan-500/15 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              La solución
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Un solo tablero que vende por ti
            </h2>
            <p className="mt-3 text-sm text-gray-300">
              Essence conecta inventario, ventas y comisiones en tiempo real. Te
              dice qué reponer, qué promocionar y dónde ganar más.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-200">
              {solutionPoints.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-300">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                size="sm"
                onClick={() => navigate("/register")}
                className="rounded-full bg-emerald-500 px-5 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                Solicitar demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={scrollToPricing}
                className="rounded-full border-white/20 px-5 text-xs font-semibold text-gray-100 hover:border-fuchsia-300"
              >
                Ver precios
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="modulos"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-7xl px-3 py-12 sm:px-5 sm:py-14 md:px-8 md:py-16"
      >
        <motion.div
          variants={fadeUp}
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-200">
              Módulos de venta
            </p>
            <h2 className="bg-linear-to-r from-purple-200 to-pink-200 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              Cada módulo empuja ingresos
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-300 sm:text-base">
              Diseñados para vender más y gastar menos: desde inventario hasta
              promociones, todo trabaja para tu margen.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-100">
            Resultados medibles en 30 días
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {modules.map((mod, index) => (
            <motion.div
              key={mod.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-purple-900/20 hover:border-purple-400/40 hover:shadow-purple-800/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-purple-200">
                    Módulo {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-xl font-semibold text-white">
                    {mod.title}
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-200 group-hover:border-purple-300/50">
                  Actívalo
                </span>
              </div>
              <p className="text-sm text-gray-300">{mod.description}</p>
              <div className="flex flex-wrap gap-2">
                {mod.highlights.map(item => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-gray-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="bg-app-elevated border-t border-white/5 py-12 sm:py-14 md:py-16"
      >
        <div className="mx-auto max-w-6xl px-3 sm:px-5 md:px-8">
          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Confianza real
              </p>
              <h2 className="bg-linear-to-r from-emerald-200 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                Negocios que venden más con Essence
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-300 sm:text-base">
                Historias reales de equipos que ordenaron su operación y
                recuperaron ingresos en semanas.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-200">
              Testimonios verificados
            </span>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {testimonials.map(item => (
              <motion.div
                key={item.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="rounded-2xl border border-white/5 bg-white/5 p-5 text-left shadow-sm shadow-emerald-900/20"
              >
                <p className="text-sm text-gray-300">“{item.quote}”</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-300">{item.role}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {item.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="bg-linear-to-r border-t border-white/5 from-purple-900/30 via-transparent to-fuchsia-900/30 py-10 sm:py-12 md:py-14"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-8">
          <motion.div variants={fadeUp} className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-100">
              Experiencia Essence
            </p>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              Entrega rápida, cambios seguros
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-gray-300 sm:text-base">
              Jobs nocturnos, controles de CORS y despliegues con Docker listos.
              Ajusta módulos por negocio sin romper producción.
            </p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 sm:gap-4"
          >
            {[
              "Configura módulos",
              "Comparte catálogo",
              "Escala operaciones",
            ].map(item => (
              <motion.div
                key={item}
                variants={fadeUp}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-gray-100 shadow-sm shadow-purple-900/30"
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mx-auto max-w-6xl px-3 py-10 sm:px-5 sm:py-12 md:px-8 md:py-14"
      >
        <div className="bg-linear-to-br rounded-3xl border border-fuchsia-300/20 from-fuchsia-500/10 via-white/5 to-cyan-500/10 p-6 text-center shadow-xl shadow-fuchsia-900/20 sm:p-8">
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">
            Empieza a vender más esta semana
          </h3>
          <p className="mt-2 text-sm text-gray-300 sm:text-base">
            Agenda una demo personalizada o revisa planes en segundos.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={() => navigate("/register")}
              className="rounded-full bg-fuchsia-500 px-6 text-sm font-semibold text-white hover:bg-fuchsia-400"
            >
              Solicitar demo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={scrollToPricing}
              className="rounded-full border-white/20 px-6 text-sm font-semibold text-gray-100 hover:border-fuchsia-300"
            >
              Ver precios
            </Button>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
