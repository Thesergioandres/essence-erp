import DemoModeTour from "./DemoModeTour";
import { demoData } from "./demo-data";

export default function DemoPage() {
  const buildSparkline = (values: number[]) => {
    if (!values.length) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1 || 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const weeklySalesPoints = buildSparkline(demoData.growthCharts.weeklySales);
  const revenuePoints = buildSparkline(demoData.growthCharts.revenueCop);
  const marginPoints = buildSparkline(demoData.growthCharts.marginPct);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <DemoModeTour />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header className="bg-linear-to-br rounded-3xl border border-white/10 from-slate-950 via-slate-900/90 to-slate-900/70 p-6 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.7)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
            Modo demo interactivo
          </p>
          <h1 className="mt-4 text-4xl font-bold text-white">
            Impulsa tus ventas.
            <span className="block text-fuchsia-200">Organiza tu negocio.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Vista demo con datos reales de {demoData.persona.name}. Explora el
            tablero, inventario y sugerencias inteligentes sin iniciar sesion.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
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
        </header>

        <section
          id="demo-dashboard"
          className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.7)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Dashboard
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Resultados que se ven en minutos
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Ventas semanales, margen y alertas clave en un solo panel.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-300 sm:min-w-[320px]">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Ventas semanales</span>
                  <span>
                    {demoData.growthCharts.weeklySales[0]} →
                    {demoData.growthCharts.weeklySales.at(-1)}
                  </span>
                </div>
                <svg viewBox="0 0 100 100" className="mt-2 h-16 w-full">
                  <polyline
                    fill="none"
                    stroke="rgba(52, 211, 153, 0.9)"
                    strokeWidth="3"
                    points={weeklySalesPoints}
                  />
                </svg>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Ingresos (COP)</span>
                  <span>
                    {demoData.growthCharts.revenueCop[0].toLocaleString(
                      "es-CO"
                    )}{" "}
                    →
                    {demoData.growthCharts.revenueCop
                      .at(-1)
                      ?.toLocaleString("es-CO")}
                  </span>
                </div>
                <svg viewBox="0 0 100 100" className="mt-2 h-16 w-full">
                  <polyline
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.9)"
                    strokeWidth="3"
                    points={revenuePoints}
                  />
                </svg>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Margen %</span>
                  <span>
                    {demoData.growthCharts.marginPct[0]}% →
                    {demoData.growthCharts.marginPct.at(-1)}%
                  </span>
                </div>
                <svg viewBox="0 0 100 100" className="mt-2 h-16 w-full">
                  <polyline
                    fill="none"
                    stroke="rgba(217, 70, 239, 0.9)"
                    strokeWidth="3"
                    points={marginPoints}
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section
          id="demo-global-inventory"
          className="bg-linear-to-br rounded-3xl border border-white/10 from-slate-950 via-slate-900/90 to-slate-900/70 p-6 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.7)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                Inventario global
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Stock en vivo con alertas reales
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Producto destacado: {demoData.featuredProduct.name}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 text-center">
              <p className="text-xs text-slate-400">Unidades disponibles</p>
              <p className="text-3xl font-semibold text-white">
                {demoData.featuredProduct.stock}
              </p>
            </div>
          </div>
        </section>

        <section
          id="demo-gamification"
          className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.7)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-200">
            Gamificacion
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Motiva al equipo y sube tus margenes
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Retos semanales, metas por producto y ranking en tiempo real.
          </p>
        </section>

        <section
          id="demo-business-assistant"
          className="bg-linear-to-br rounded-3xl border border-white/10 from-slate-950 via-slate-900/90 to-slate-900/70 p-6 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.7)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
            Business Assistant
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Sugerencias que venden por ti
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Recomendaciones para reponer, ajustar precios y lanzar promos con
            impacto real.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            {demoData.highlights.map(item => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
