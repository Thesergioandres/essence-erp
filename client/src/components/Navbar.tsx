import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBrandLogo } from "../hooks/useBrandLogo";
import { Button } from "../shared/components/ui";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();

  return (
    <nav className="safe-top sticky top-0 z-50 border-b border-gray-700 bg-gray-900/95 backdrop-blur-lg">
      <div className="safe-x mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex min-h-14 items-center justify-between sm:min-h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center rounded-md"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src={brandLogo}
              alt="Essence ERP"
              className="h-16 w-auto sm:h-20"
              loading="lazy"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-3 md:flex lg:gap-4">
            <Link
              to="/"
              className="rounded-md text-sm text-gray-300 transition hover:text-purple-400 lg:text-base"
            >
              Inicio
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/manual")}
              className="rounded-lg border-cyan-500/60 bg-cyan-500/10 text-xs text-cyan-100 hover:bg-cyan-500/20 lg:text-sm"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              📘 Manual de Usuario
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="rounded-lg border-purple-500 text-xs text-purple-100 hover:bg-purple-500/10 lg:text-sm"
            >
              Iniciar sesión
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="-mr-2 rounded-md p-2 text-gray-300 hover:text-purple-400 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 28,
                mass: 0.55,
              }}
              className="overflow-hidden md:hidden"
            >
              <div className="space-y-1 pb-3 pt-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-lg px-3 py-3 text-base text-gray-300 transition hover:bg-purple-600/10 hover:text-purple-400 active:scale-[0.98]"
                >
                  Inicio
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/manual");
                  }}
                  className="mx-3 w-[calc(100%-1.5rem)] justify-center rounded-lg border-cyan-500/60 bg-cyan-500/10 text-base text-cyan-100 hover:bg-cyan-500/20"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  📘 Manual de Usuario
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="mx-3 w-[calc(100%-1.5rem)] justify-center rounded-lg border-purple-500 text-base text-purple-100 hover:bg-purple-500/10"
                >
                  Iniciar sesión
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
