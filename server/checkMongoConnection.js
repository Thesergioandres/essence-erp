import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const redactedUri = uri?.replace(/\/\/([^:@]+):([^@]+)@/, "//***:***@");

const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 5,
};

async function run() {
  try {
    if (!uri) {
      throw new Error("MONGODB_URI no está definida");
    }

    console.log("🔎 Probando conexión a:", redactedUri);
    const conn = await mongoose.connect(uri, options);
    console.log("✅ Conectado a MongoDB host:", conn.connection.host);

    const ping = await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("✅ Ping:", ping);

    const salesCollection = mongoose.connection.db.collection("sales");
    const indexes = await salesCollection.indexes();
    console.log(`ℹ️ Índices de sales (${indexes.length}):`, indexes);

    const sample = await salesCollection.find().limit(3).toArray();
    console.log(
      `ℹ️ Muestras sales (${sample.length} docs):`,
      sample.map((d) => d._id)
    );
  } catch (err) {
    console.error("❌ Error en checkMongoConnection:", err?.message || err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Conexión cerrada");
    process.exit(0);
  }
}

run();
