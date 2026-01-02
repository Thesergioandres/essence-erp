import { getRedisClient } from "../config/redis.js";

/**
 * Middleware de caché con Redis
 * @param {number} duration - Duración del caché en segundos
 * @param {string} keyPrefix - Prefijo para la clave de caché
 */
export const cacheMiddleware = (duration = 300, keyPrefix = "") => {
  return async (req, res, next) => {
    const redis = getRedisClient();

    // Si Redis no está disponible, continuar sin caché
    if (!redis) {
      return next();
    }

    try {
      // Generar clave única basada en URL y query params
      const businessKey =
        req.businessId || req.headers["x-business-id"] || "global";
      const key = `cache:${keyPrefix}:${businessKey}:${
        req.originalUrl || req.url
      }`;

      // Intentar obtener datos del caché
      const cachedData = await redis.get(key);

      if (cachedData) {
        console.log(`🚀 Cache HIT: ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`💾 Cache MISS: ${key}`);

      // Interceptar res.json para guardar en caché
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Guardar en caché solo respuestas exitosas
        if (res.statusCode === 200) {
          redis.setex(key, duration, JSON.stringify(data)).catch((err) => {
            console.error("Error guardando en caché:", err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Error en middleware de caché:", error);
      next();
    }
  };
};

/**
 * Invalidar caché por patrón
 * @param {string} pattern - Patrón de claves a invalidar (ej: "cache:products:*")
 */
export const invalidateCache = async (pattern) => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️  Invalidadas ${keys.length} claves de caché: ${pattern}`);
    }
  } catch (error) {
    console.error("Error invalidando caché:", error);
  }
};

/**
 * Limpiar todo el caché
 */
export const clearAllCache = async () => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.flushdb();
    console.log("🗑️  Caché completamente limpiado");
  } catch (error) {
    console.error("Error limpiando caché:", error);
  }
};
