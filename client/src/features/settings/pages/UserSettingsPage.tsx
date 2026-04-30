import { Link } from "react-router-dom";
import { 
  User as UserIcon, 
  Users, 
  Sparkles, 
  Shield, 
  ChevronRight,
  Settings,
  Mail,
  Smartphone,
  Info
} from "lucide-react";
import { m } from "framer-motion";
import Footer from "../../../components/Footer";
import Navbar from "../../../components/Navbar";
import {
    MOTION_MODE_OPTIONS,
    useMotionProfile,
} from "../../../shared/config/motion.config";
import { useSession } from "../../../hooks/useSession";

export default function UserSettings() {
  const { mode, motionProfile, setMotionMode } = useMotionProfile();
  const { user } = useSession();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="bg-linear-to-br min-h-screen from-gray-950 via-purple-950/10 to-gray-950 text-gray-200">
      <Navbar />
      
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <m.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-bold tracking-widest uppercase">Preferencias</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
            Ajustes de Usuario
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl leading-relaxed">
            Personaliza tu experiencia en Essence ERP y gestiona los accesos de tu equipo desde un solo lugar.
          </p>
        </m.div>

        <m.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Profile & Info */}
          <div className="lg:col-span-1 space-y-6">
            <m.div 
              variants={itemVariants}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-purple-500/30"
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition-all group-hover:bg-purple-500/20" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {user?.name || "Usuario"}
                    </h3>
                    <p className="text-sm text-purple-400 font-medium capitalize">
                      {user?.role || "Sin rol"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className="truncate">{user?.email || "No disponible"}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>ID: {user?._id?.slice(-8).toUpperCase() || "---"}</span>
                  </div>
                </div>

                <button className="mt-8 w-full rounded-xl bg-white/5 border border-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95">
                  Editar Perfil
                </button>
              </div>
            </m.div>

            <m.div 
              variants={itemVariants}
              className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4 text-blue-300">
                <Info className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed">
                  Tus ajustes se sincronizan automáticamente en todos tus dispositivos.
                </p>
              </div>
            </m.div>
          </div>

          {/* Right Column: Settings Sections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Team Management */}
            <m.section variants={itemVariants} className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-400" />
                Gestión de Equipo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/admin/employees"
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-purple-500/50 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-white">Empleados</span>
                      <span className="text-xs text-gray-400">Administra tu staff actual</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <div
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/2 p-5 cursor-not-allowed opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/20 text-gray-400">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="block text-lg font-bold text-gray-300">Roles</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-400">Soon</span>
                      </div>
                      <span className="text-xs text-gray-500">Gestión avanzada de permisos</span>
                    </div>
                  </div>
                </div>
              </div>
            </m.section>

            {/* Interface Settings */}
            <m.section variants={itemVariants} className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                Experiencia Visual
              </h2>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white">Intensidad de Animaciones</h3>
                  <p className="mt-2 text-gray-400 text-sm">
                    Ajusta la respuesta visual de la plataforma según tu preferencia de velocidad y fluidez.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MOTION_MODE_OPTIONS.map(option => {
                    const isActive = mode === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setMotionMode(option.value)}
                        className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500 ${
                          isActive
                            ? "border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                            : "border-white/5 bg-white/2 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        {isActive && (
                          <m.div 
                            layoutId="active-bg"
                            className="absolute inset-0 bg-cyan-500/10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-base font-bold ${isActive ? 'text-cyan-400' : 'text-gray-300'}`}>
                              {option.label}
                            </span>
                            {isActive && <Sparkles className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center gap-4 rounded-xl bg-black/40 border border-white/5 px-5 py-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      <span>Métricas de Rendimiento Actual</span>
                      <span className="text-cyan-500/70">Optimizado</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Rutas</span>
                        <span className="text-sm font-mono text-cyan-400">{motionProfile.routeDuration.toFixed(2)}s</span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Vistas</span>
                        <span className="text-sm font-mono text-cyan-400">{motionProfile.viewDuration.toFixed(2)}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </m.section>
          </div>
        </m.div>
      </main>

      <Footer />
    </div>
  );
}
