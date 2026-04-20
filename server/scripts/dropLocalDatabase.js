import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(SERVER_ROOT, ".env") });

const safeTrim = (value) =>
  typeof value === "string" ? value.trim().replace(/^"|"$/g, "") : "";

const resolveLocalMongoUri = () =>
  safeTrim(process.env.MONGO_URI_DEV_LOCAL) ||
  safeTrim(process.env.MONGO_URI_DEV) ||
  safeTrim(process.env.MONGODB_URI) ||
  "mongodb://127.0.0.1:27017/essence_local";

const ensureSafeLocalTarget = (uri) => {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("URI local invalida para reset de base de datos");
  }

  const protocol = (parsed.protocol || "").toLowerCase();
  if (protocol !== "mongodb:" && protocol !== "mongodb+srv:") {
    throw new Error("El script solo admite URIs mongodb/mongodb+srv");
  }

  const host = String(parsed.hostname || "").toLowerCase();
  const isLocalHost =
    host === "127.0.0.1" || host === "localhost" || host === "::1";

  if (!isLocalHost) {
    throw new Error(
      `Abortado por seguridad: host no local detectado (${host || "unknown"})`,
    );
  }

  const dbNameFromPath = String(parsed.pathname || "").replace(/^\/+/, "");
  const dbName = dbNameFromPath || "essence_local";

  if (
    !dbName.toLowerCase().includes("local") &&
    process.env.ALLOW_LOCAL_DB_DROP_NONLOCAL !== "true"
  ) {
    throw new Error(
      `Abortado por seguridad: base objetivo (${dbName}) no parece local.`,
    );
  }

  return { dbName };
};

const run = async () => {
  const mongoUri = resolveLocalMongoUri();
  const { dbName } = ensureSafeLocalTarget(mongoUri);

  try {
    await mongoose.connect(mongoUri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      maxPoolSize: 3,
    });

    await mongoose.connection.dropDatabase();
    console.log(`Base local eliminada correctamente: ${dbName}`);
  } catch (error) {
    console.error(`Error reseteando base local: ${error.message}`);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      // no-op
    }
  }
};

await run();
