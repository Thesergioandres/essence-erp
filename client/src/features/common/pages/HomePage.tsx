import Footer from "../../../components/Footer";
import Navbar from "../../../components/Navbar";

const modules = [
  {
    title: "Inventario inteligente: nunca mas una venta perdida",
    description:
      "Detecta quiebres antes de que ocurran, mueve stock rapido y recupera ingresos cada semana.",
    highlights: ["Alertas de quiebre", "Reposicion rapida", "Stock por canal"],
  },
  {
    title: "Ventas omnicanal: cobra mas, vende mas",
    description:
      "Mismo producto, multiples precios y reglas. Incrementa el ticket con ofertas precisas.",
    highlights: ["B2B y B2C", "Listas de precio", "Promos inteligentes"],
  },
  {
    title: "Catalogo distribuido: mas alcance sin mas esfuerzo",
    description:
      "Comparte catalogos en minutos, controla comisiones y acelera nuevos pedidos.",
    highlights: [
      "Catalogo compartible",
      "Comisiones claras",
      "Acceso controlado",
    ],
  },
  {
    title: "Finanzas y comisiones: mas margen, menos fugas",
    description:
      "Concilia pagos, comisiones y costos sin hojas de calculo. Protege tu margen.",
    highlights: ["Margen por SKU", "Pagos conciliados", "Cortes automaticos"],
  },
  {
    title: "Analitica accionable: decide con datos hoy",
    description:
      "Ve que se vende, que no, y donde. Prioriza el stock que si genera caja.",
    highlights: ["KPIs vivos", "Alertas de rotacion", "Exportables"],
  },
  {
    title: "Automatizaciones que bajan costos",
    description:
      "Procesos nocturnos para precios y stock. Menos errores, mas tiempo vendiendo.",
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
      "El catalogo compartido nos ahorro horas y subimos pedidos sin llamadas.",
    metric: "-35% tiempo operativo",
  },
  {
    name: "Marcela Ruiz",
    role: "Gerente de operaciones",
    quote:
      "La conciliacion de comisiones ahora es simple. Cerramos mes sin sorpresas.",
    metric: "+12% margen",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080910]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-3 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
                Impulsa ventas sin caos
              </p>
              <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
                Impulsa tus ventas.
                <span className="block text-fuchsia-200">
                  Organiza tu negocio.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-gray-300 sm:text-base">
                Controla inventario, precios y comisiones desde un solo tablero.
                Menos fugas, mas pedidos, mas margen.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/register"
                  className="rounded-full bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
                >
                  Solicitar demo
                </a>
                <a
                  href="/demo?demo=1"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("demo-mode", "1");
                    }
                  }}
                  className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20"
                >
                  🚀 Ver Demo Interactiva
                </a>
                <a
                  href="/login"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-gray-100 transition hover:border-fuchsia-300"
                >
                  Ver precios
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-purple-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-200">
                Resultados en vivo
              </p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200">
                  <span>Ventas recuperadas</span>
                  <span className="font-semibold text-white">+22%</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200">
                  <span>Tiempo operativo</span>
                  <span className="font-semibold text-white">-30%</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200">
                  <span>Margen protegido</span>
                  <span className="font-semibold text-white">+12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema / Solucion */}
      <section className="mx-auto max-w-7xl px-3 py-12 sm:px-5 sm:py-14 md:px-8 md:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">
              El problema
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Ventas perdidas, inventario en caos
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>Productos agotados sin aviso y clientes que se van.</li>
              <li>Precios distintos por canal sin control real.</li>
              <li>Comisiones y margenes que se van entre planillas.</li>
            </ul>
          </div>
          <div className="bg-linear-to-br rounded-2xl border border-white/10 from-fuchsia-500/15 via-transparent to-cyan-500/15 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              La solucion
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Un solo tablero que vende por ti
            </h2>
            <p className="mt-3 text-sm text-gray-300">
              Essence conecta inventario, ventas y comisiones en tiempo real. Te
              dice que reponer, que promocionar y donde ganar mas.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/register"
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white"
              >
                Solicitar demo
              </a>
              <a
                href="/login"
                className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold text-gray-100"
              >
                Ver precios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos ERP */}
      <section
        id="modulos"
        className="mx-auto max-w-7xl px-3 py-12 sm:px-5 sm:py-14 md:px-8 md:py-16"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-200">
              Modulos de venta
            </p>
            <h2 className="bg-linear-to-r from-purple-200 to-pink-200 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              Cada modulo empuja ingresos
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-400 sm:text-base">
              Diseñados para vender mas y gastar menos: desde inventario hasta
              promociones, todo trabaja para tu margen.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-100">
            Resultados medibles en 30 dias
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(mod => (
            <div
              key={mod.title}
              className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-purple-900/20 transition hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-purple-800/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-purple-200">
                    Módulo
                  </p>
                  <h3 className="text-xl font-semibold text-white">
                    {mod.title}
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-gray-200 group-hover:border-purple-300/50">
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
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-white/5 bg-[#0c0d15] py-12 sm:py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-3 sm:px-5 md:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Confianza real
              </p>
              <h2 className="bg-linear-to-r from-emerald-200 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                Negocios que venden mas con Essence
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-400 sm:text-base">
                Historias reales de equipos que ordenaron su operacion y
                recuperaron ingresos en semanas.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-200">
              Testimonios verificados
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {testimonials.map(item => (
              <div
                key={item.name}
                className="rounded-2xl border border-white/5 bg-white/5 p-5 text-left shadow-sm shadow-emerald-900/20"
              >
                <p className="text-sm text-gray-300">“{item.quote}”</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">{item.role}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {item.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience strip */}
      <section className="bg-linear-to-r border-t border-white/5 from-purple-900/30 via-transparent to-fuchsia-900/30 py-10 sm:py-12 md:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-8">
          <div className="text-left">
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
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 sm:gap-4">
            {[
              "Configura módulos",
              "Comparte catálogo",
              "Escala operaciones",
            ].map(item => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-gray-100 shadow-sm shadow-purple-900/30"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-3 py-10 sm:px-5 sm:py-12 md:px-8 md:py-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-xl shadow-fuchsia-900/20 sm:p-8">
          <h3 className="text-2xl font-semibold text-white">
            Empieza a vender mas esta semana
          </h3>
          <p className="mt-2 text-sm text-gray-300">
            Agenda una demo personalizada o revisa planes en segundos.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="/register"
              className="rounded-full bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
            >
              Solicitar demo
            </a>
            <a
              href="/login"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-gray-100 transition hover:border-fuchsia-300"
            >
              Ver precios
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
