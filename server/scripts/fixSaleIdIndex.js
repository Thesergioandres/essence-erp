import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Falta MONGODB_URI en el entorno");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const collection = mongoose.connection.collection("sales");

  try {
    const indexes = await collection.indexes();
    const hasLegacy = indexes.some((idx) => idx.name === "saleId_1");
    if (hasLegacy) {
      console.log("🔧 Eliminando índice global saleId_1 ...");
      await collection.dropIndex("saleId_1");
    } else {
      console.log("ℹ️ No se encontró índice saleId_1");
    }
  } catch (err) {
    console.error(
      "⚠️ Error al eliminar índice saleId_1 (puede no existir):",
      err.message
    );
  }

  try {
    console.log(
      "🧱 Creando índice único por negocio { business: 1, saleId: 1 }..."
    );
    await collection.createIndex({ business: 1, saleId: 1 }, { unique: true });
    console.log("✅ Índice compuesto creado/validado");
  } catch (err) {
    console.error("❌ Error creando índice compuesto:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run().catch((err) => {
  console.error("❌ Error general:", err);
  process.exit(1);
});
