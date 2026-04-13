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

const decodeTokenPayload = (authorizationHeader) => {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const token = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.split(" ")[1]
    : null;

  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
};

const resolvePreAuthContext = (req) => {
  const tokenPayload = decodeTokenPayload(req.headers.authorization);

  const userId =
    req.user?.id ||
    req.user?._id ||
    tokenPayload?.id ||
    tokenPayload?.userId ||
    undefined;

  const businessId =
    req.businessId ||
    req.headers["x-business-id"] ||
    req.query?.businessId ||
    req.params?.businessId ||
    req.body?.businessId ||
    tokenPayload?.businessId ||
    undefined;

  return { userId, businessId };
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  let responseFinished = false;
  const preAuthContext = resolvePreAuthContext(req);

  logApiInfo({
    message: `${req.method} ${req.path}`,
    module: "http",
    requestId: req.reqId,
    businessId: preAuthContext.businessId,
    userId: preAuthContext.userId,
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
        businessId: preAuthContext.businessId,
        userId: preAuthContext.userId,
      });
    } catch (e) {
      logApiWarn({
        message: "Body no serializable",
        module: "http",
        requestId: req.reqId,
        businessId: preAuthContext.businessId,
        userId: preAuthContext.userId,
      });
    }
  }

  res.on("finish", () => {
    responseFinished = true;
    const duration = Date.now() - start;
    logApiInfo({
      message: `RES ${res.statusCode} ${req.method} ${req.path} (${duration}ms)`,
      module: "http",
      requestId: req.reqId,
      businessId: req.businessId || preAuthContext.businessId,
      userId: req.user?.id || req.user?._id || preAuthContext.userId,
    });
  });

  res.on("close", () => {
    if (responseFinished || res.writableEnded || res.headersSent) {
      return;
    }

    const duration = Date.now() - start;
    logApiWarn({
      message: `RES ABORT ${req.method} ${req.path} (${duration}ms)`,
      module: "http",
      requestId: req.reqId,
      businessId: req.businessId || preAuthContext.businessId,
      userId: req.user?.id || req.user?._id || preAuthContext.userId,
    });
  });

  next();
};
