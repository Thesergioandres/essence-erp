import rateLimit from "express-rate-limit";
import { logApiWarn } from "../utils/logger.js";

// Helper para generar keys con soporte IPv6
const ipKeyGenerator = (req) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  // Normalizar IPv6
  return ip.replace(/^::ffff:/, "");
};

const isTestEnvironment = () => process.env.NODE_ENV === "test";
const isDevelopmentEnvironment = () => process.env.NODE_ENV === "development";

const resolveRateLimitMax = (
  envVarName,
  fallbackProduction,
  fallbackDevelopment,
) => {
  const rawValue = Number(process.env[envVarName]);
  if (Number.isFinite(rawValue) && rawValue > 0) {
    return Math.floor(rawValue);
  }

  return isDevelopmentEnvironment() ? fallbackDevelopment : fallbackProduction;
};

const resolveRateLimitWindowMs = (envVarName, fallbackValue) => {
  const rawValue = Number(process.env[envVarName]);
  if (Number.isFinite(rawValue) && rawValue > 0) {
    return Math.floor(rawValue);
  }

  return fallbackValue;
};

const resolveRequestBusinessId = (req) => {
  const rawBusinessId = req.headers["x-business-id"] || req.query?.businessId;

  if (Array.isArray(rawBusinessId)) {
    return rawBusinessId[0] || "global";
  }

  return String(rawBusinessId || "global");
};

const resolveTokenFingerprint = (req) => {
  const authorization = String(req.headers.authorization || "");
  if (!authorization.startsWith("Bearer ")) {
    return "anonymous";
  }

  // Fingerprint corto para separar sesiones detrás de la misma IP/proxy.
  return authorization.slice(-16);
};

const buildApiLimiterKey = (req) => {
  const ip = ipKeyGenerator(req);
  const businessId = resolveRequestBusinessId(req);
  const tokenFingerprint = resolveTokenFingerprint(req);
  return `${ip}-${businessId}-${tokenFingerprint}`;
};

/**
 * Rate Limiter para endpoints de autenticación
 * Más restrictivo para prevenir ataques de fuerza bruta
 */
export const authLimiter = rateLimit({
  windowMs: resolveRateLimitWindowMs(
    "AUTH_RATE_LIMIT_WINDOW_MS",
    45 * 60 * 1000,
  ), // 45 minutos (x3)
  max: resolveRateLimitMax("AUTH_RATE_LIMIT_MAX", 45, 135),
  message: {
    message:
      "Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.",
    code: "RATE_LIMIT_AUTH",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Omitir rate limiting en tests
    return isTestEnvironment();
  },
  handler: (req, res, next, options) => {
    logApiWarn({
      message: "Rate limit exceeded - auth",
      module: "rateLimit",
      requestId: req.reqId,
      extra: {
        ip: req.ip,
        path: req.path,
        method: req.method,
      },
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // Usar helper de IPv6 + email si está disponible
    const email = req.body?.email || "";
    return email ? `${ipKeyGenerator(req)}-${email}` : ipKeyGenerator(req);
  },
});

/**
 * Rate Limiter general para API
 * Menos restrictivo, para uso normal
 */
export const apiLimiter = rateLimit({
  windowMs: resolveRateLimitWindowMs("API_RATE_LIMIT_WINDOW_MS", 3 * 60 * 1000), // 3 minutos (x3)
  max: resolveRateLimitMax("API_RATE_LIMIT_MAX", 1620, 10800),
  message: {
    message: "Demasiadas solicitudes. Intenta de nuevo en un momento.",
    code: "RATE_LIMIT_API",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Omitir rate limiting en tests
    return isTestEnvironment();
  },
  handler: (req, res, next, options) => {
    logApiWarn({
      message: "Rate limit exceeded - api",
      module: "rateLimit",
      requestId: req.reqId,
      extra: {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
      },
    });
    res.status(429).json(options.message);
  },
  keyGenerator: buildApiLimiterKey,
});

/**
 * Rate Limiter para uploads
 * Muy restrictivo por el tamaño de las peticiones
 */
export const uploadLimiter = rateLimit({
  windowMs: 3 * 60 * 60 * 1000, // 3 horas (x3)
  max: 360, // 360 uploads por ventana (x3)
  message: {
    message: "Límite de uploads alcanzado. Intenta de nuevo más tarde.",
    code: "RATE_LIMIT_UPLOAD",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logApiWarn({
      message: "Rate limit exceeded - upload",
      module: "rateLimit",
      requestId: req.reqId,
      extra: {
        ip: req.ip,
        userId: req.user?.id,
      },
    });
    res.status(429).json(options.message);
  },
});

/**
 * Rate Limiter para registro de usuarios
 * Previene creación masiva de cuentas
 */
export const registerLimiter = rateLimit({
  windowMs: 3 * 60 * 60 * 1000, // 3 horas (x3)
  max: 36, // 36 registros por ventana por IP (x3)
  message: {
    message: "Demasiados registros desde esta IP. Intenta de nuevo más tarde.",
    code: "RATE_LIMIT_REGISTER",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logApiWarn({
      message: "Rate limit exceeded - register",
      module: "rateLimit",
      requestId: req.reqId,
      extra: {
        ip: req.ip,
        email: req.body?.email,
      },
    });
    res.status(429).json(options.message);
  },
});

/**
 * Rate Limiter para endpoints sensibles (GOD panel, etc.)
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos (x3)
  max: 150, // 150 requests por ventana (x3)
  message: {
    message: "Acceso restringido temporalmente por exceso de solicitudes.",
    code: "RATE_LIMIT_SENSITIVE",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logApiWarn({
      message: "Rate limit exceeded - sensitive",
      module: "rateLimit",
      requestId: req.reqId,
      extra: {
        ip: req.ip,
        path: req.path,
        userId: req.user?.id,
      },
    });
    res.status(429).json(options.message);
  },
});
