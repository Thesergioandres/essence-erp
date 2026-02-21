import { logApiInfo, logApiWarn } from "../utils/logger.js";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "refreshToken",
  "authorization",
  "jwt",
  "secret",
  "apiKey",
  "mongodb_uri",
  "mongo_uri",
];

const isSensitiveKey = (key) => {
  const normalized = String(key || "").toLowerCase();
  return SENSITIVE_KEYS.some((candidate) =>
    normalized.includes(candidate.toLowerCase()),
  );
};

const redactSensitiveData = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, current]) => {
      acc[key] = isSensitiveKey(key)
        ? "[REDACTED]"
        : redactSensitiveData(current);
      return acc;
    }, {});
  }

  return value;
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  logApiInfo({
    message: `${req.method} ${req.path}`,
    module: "http",
    requestId: req.reqId,
    businessId: req.businessId,
    userId: req.user?.id || req.user?._id,
    extra: { origin: req.headers.origin || "n/a" },
  });

  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    try {
      const sanitizedBody = redactSensitiveData(req.body || {});
      const bodyStr =
        typeof sanitizedBody === "string"
          ? sanitizedBody
          : JSON.stringify(sanitizedBody);
      logApiInfo({
        message: `Body ${bodyStr.substring(0, 500)}`,
        module: "http",
        requestId: req.reqId,
        businessId: req.businessId,
        userId: req.user?.id || req.user?._id,
      });
    } catch (e) {
      logApiWarn({
        message: "Body no serializable",
        module: "http",
        requestId: req.reqId,
        businessId: req.businessId,
        userId: req.user?.id || req.user?._id,
      });
    }
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    logApiInfo({
      message: `RES ${res.statusCode} ${req.method} ${req.path} (${duration}ms)`,
      module: "http",
      requestId: req.reqId,
      businessId: req.businessId,
      userId: req.user?.id || req.user?._id,
    });
  });

  res.on("close", () => {
    const duration = Date.now() - start;
    logApiWarn({
      message: `RES ABORT ${req.method} ${req.path} (${duration}ms)`,
      module: "http",
      requestId: req.reqId,
      businessId: req.businessId,
      userId: req.user?.id || req.user?._id,
    });
  });

  next();
};
