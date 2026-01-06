import { logApiError } from "../utils/logger.js";

/**
 * Clase de error personalizada para la API
 */
export class ApiError extends Error {
  constructor(message, status = 500, code = null, module = "unknown") {
    super(message);
    this.status = status;
    this.code = code;
    this.module = module;
    this.name = "ApiError";
  }

  static badRequest(message, code = "BAD_REQUEST") {
    return new ApiError(message, 400, code, "validation");
  }

  static unauthorized(message = "No autorizado", code = "UNAUTHORIZED") {
    return new ApiError(message, 401, code, "auth");
  }

  static forbidden(message = "Acceso denegado", code = "FORBIDDEN") {
    return new ApiError(message, 403, code, "auth");
  }

  static notFound(message = "Recurso no encontrado", code = "NOT_FOUND") {
    return new ApiError(message, 404, code, "resource");
  }

  static conflict(message, code = "CONFLICT") {
    return new ApiError(message, 409, code, "resource");
  }

  static internal(message = "Error interno del servidor", code = "INTERNAL") {
    return new ApiError(message, 500, code, "system");
  }
}

/**
 * Middleware central de manejo de errores
 */
export const errorHandler = (err, req, res, _next) => {
  // Determinar status y mensaje
  let status = err?.status || err?.statusCode || 500;
  let message = err?.message || "Error interno del servidor";
  let code = err?.code || "UNKNOWN_ERROR";

  // Manejar errores específicos de Mongoose
  if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.name === "CastError" && err.kind === "ObjectId") {
    status = 400;
    code = "INVALID_ID";
    message = "ID inválido";
  } else if (err.code === 11000) {
    status = 409;
    code = "DUPLICATE_KEY";
    const field = Object.keys(err.keyPattern || {})[0] || "campo";
    message = `${field} ya existe`;
  } else if (err.name === "JsonWebTokenError") {
    status = 401;
    code = "INVALID_TOKEN";
    message = "Token inválido";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    code = "TOKEN_EXPIRED";
    message = "Token expirado";
  }

  const requestId = req.reqId || res.locals.requestId || "no-id";
  const businessId = req.businessId || req.headers["x-business-id"];
  const userId = req.user?.id || req.user?._id;

  // Log solo errores 500+ o en desarrollo
  if (status >= 500 || process.env.NODE_ENV === "development") {
    logApiError({
      message,
      module: err?.module || "unknown",
      requestId,
      businessId,
      userId,
      stack: err?.stack,
      extra: { path: req.path, method: req.method, status, code },
    });
  }

  res.status(status).json({
    success: false,
    message,
    code,
    requestId,
    ...(process.env.NODE_ENV === "development" && { stack: err?.stack }),
  });
};

/**
 * Wrapper para controladores async (evita try/catch repetitivo)
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
