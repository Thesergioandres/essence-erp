// Genera o propaga un requestId y lo expone en req/res
export const requestIdMiddleware = (req, res, next) => {
  const headerId =
    req.headers["x-request-id"] ||
    req.headers["x-requestid"] ||
    req.headers["x-correlation-id"];

  const reqId =
    headerId || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  req.reqId = reqId;
  res.locals.requestId = reqId;
  res.setHeader("x-request-id", reqId);

  next();
};

// Inserta requestId en las respuestas JSON de objetos simples
export const withResponseRequestId = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      body !== null
    ) {
      if (!Object.prototype.hasOwnProperty.call(body, "requestId")) {
        body.requestId = req.reqId || res.locals.requestId;
      }
    }
    return originalJson(body);
  };

  next();
};
