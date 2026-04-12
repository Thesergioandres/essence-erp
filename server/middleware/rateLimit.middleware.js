import { createHash } from "crypto";
import rateLimit from "express-rate-limit";
import { logApiWarn } from "../utils/logger.js";

// Helper para generar keys con soporte IPv6
const ipKeyGenerator = (req) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  // Normalizar IPv6
  return ip.replace(/^::ffff:/, "");
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getBearerToken = (req) => {
  const authorization = req.headers?.authorization;
  if (typeof authorization !== "string") {
    return "";
  }

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
};

const tokenFingerprint = (req) => {
  const token = getBearerToken(req);
  if (!token) {
    return "";
  }

  return createHash("sha256").update(token).digest("hex").slice(0, 16);
};

const AUTH_WINDOW_MS = toPositiveInt(
  process.env.RATE_LIMIT_AUTH_WINDOW_MS,
  15 * 60 * 1000,
);
const AUTH_MAX = toPositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 10);

const API_WINDOW_MS = toPositiveInt(
  process.env.RATE_LIMIT_API_WINDOW_MS,
  15 * 60 * 1000,
);
const API_MAX = toPositiveInt(process.env.RATE_LIMIT_API_MAX, 300);

const UPLOAD_WINDOW_MS = toPositiveInt(
  process.env.RATE_LIMIT_UPLOAD_WINDOW_MS,
  60 * 60 * 1000,
);
const UPLOAD_MAX = toPositiveInt(process.env.RATE_LIMIT_UPLOAD_MAX, 100);

const REGISTER_WINDOW_MS = toPositiveInt(
  process.env.RATE_LIMIT_REGISTER_WINDOW_MS,
  60 * 60 * 1000,
);
const REGISTER_MAX = toPositiveInt(process.env.RATE_LIMIT_REGISTER_MAX, 10);

const SENSITIVE_WINDOW_MS = toPositiveInt(
  process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS,
  5 * 60 * 1000,
);
const SENSITIVE_MAX = toPositiveInt(process.env.RATE_LIMIT_SENSITIVE_MAX, 40);

/**
 * Rate Limiter para endpoints de autenticación
 * Más restrictivo para prevenir ataques de fuerza bruta
 */
export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  message: {
    message:
      "Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.",
    code: "RATE_LIMIT_AUTH",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Omitir rate limiting en tests
    return process.env.NODE_ENV === "test";
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
  windowMs: API_WINDOW_MS,
  max: API_MAX,
  message: {
    message: "Demasiadas solicitudes. Intenta de nuevo en un momento.",
    code: "RATE_LIMIT_API",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Omitir rate limiting en tests
    return process.env.NODE_ENV === "test";
  },
  keyGenerator: (req) => {
    const ipKey = ipKeyGenerator(req);
    const tokenKey = tokenFingerprint(req);
    return tokenKey ? `${ipKey}-${tokenKey}` : ipKey;
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
});

/**
 * Rate Limiter para uploads
 * Muy restrictivo por el tamaño de las peticiones
 */
export const uploadLimiter = rateLimit({
  windowMs: UPLOAD_WINDOW_MS,
  max: UPLOAD_MAX,
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
  windowMs: REGISTER_WINDOW_MS,
  max: REGISTER_MAX,
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
  windowMs: SENSITIVE_WINDOW_MS,
  max: SENSITIVE_MAX,
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
