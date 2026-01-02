import Redis from "ioredis";

let redisClient = null;

const initRedis = () => {
  try {
    const redisEnabled = process.env.ENABLE_REDIS_CACHE === "true";

    // Si está deshabilitado explícitamente o no hay URL, no iniciar
    if (!redisEnabled || !process.env.REDIS_URL) {
      console.log("ℹ️  Redis cache deshabilitado en este entorno");
      return null;
    }

    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis conectado exitosamente");
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
    });

    return redisClient;
  } catch (error) {
    console.error("❌ Error inicializando Redis:", error.message);
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = initRedis();
  }
  return redisClient;
};

export { getRedisClient, initRedis };
