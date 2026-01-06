import { logApiInfo, logApiWarn } from "../utils/logger.js";

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
      const bodyStr =
        typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body || {});
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
