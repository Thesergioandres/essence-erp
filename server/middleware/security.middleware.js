/**
 * Middleware de seguridad HTTP headers
 * Implementa cabeceras de seguridad recomendadas
 */
export const securityHeaders = (_req, res, next) => {
  // Prevenir clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevenir MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Habilitar XSS filter del navegador
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Política de referrer
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Política de permisos
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  // Content Security Policy básica (ajustar según necesidad)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:"
    );
  }

  // Strict Transport Security (solo en producción con HTTPS)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
};

/**
 * Middleware para sanitizar headers de request
 */
export const sanitizeHeaders = (req, _res, next) => {
  // Remover headers potencialmente peligrosos
  delete req.headers["x-powered-by"];

  // Validar x-business-id si existe
  const businessId = req.headers["x-business-id"];
  if (businessId && !/^[a-f0-9]{24}$/i.test(businessId)) {
    req.headers["x-business-id"] = undefined;
  }

  next();
};

/**
 * Middleware para logging de requests sospechosos
 */
export const suspiciousRequestDetector = (req, _res, next) => {
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS básico
    /javascript:/gi, // XSS en URLs
    /on\w+=/gi, // Event handlers
    /union.*select/gi, // SQL injection
    /\$where/gi, // NoSQL injection
    /\$regex/gi, // NoSQL regex injection
  ];

  const checkValue = (value, key) => {
    if (typeof value !== "string") return false;
    return suspiciousPatterns.some((pattern) => {
      if (pattern.test(value)) {
        console.warn(
          `[SECURITY] Suspicious pattern in ${key}:`,
          value.slice(0, 100)
        );
        return true;
      }
      return false;
    });
  };

  // Revisar query params
  for (const [key, value] of Object.entries(req.query)) {
    if (checkValue(value, `query.${key}`)) {
      req.query[key] = "";
    }
  }

  // Revisar body (strings)
  if (req.body && typeof req.body === "object") {
    const sanitizeObject = (obj, path = "body") => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string" && checkValue(value, `${path}.${key}`)) {
          obj[key] = value.replace(/<[^>]*>/g, ""); // Strip HTML tags
        } else if (typeof value === "object" && value !== null) {
          sanitizeObject(value, `${path}.${key}`);
        }
      }
    };
    sanitizeObject(req.body);
  }

  next();
};
