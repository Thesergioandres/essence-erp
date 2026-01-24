import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Configurar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const optimizeIndexes = async () => {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado.");

    const db = mongoose.connection.db;
    const collection = db.collection("sales");

    // Listar índices actuales
    const indexes = await collection.indexes();
    console.log(`📊 Índices actuales (${indexes.length}):`);
    indexes.forEach((idx) =>
      console.log(` - ${idx.name}:`, JSON.stringify(idx.key)),
    );

    // Índices a eliminar
    const redundantIndexes = [
      { key: { saleDate: -1 }, name: "saleDate_-1" },
      {
        key: { paymentStatus: 1, saleDate: -1 },
        name: "paymentStatus_1_saleDate_-1",
      },
    ];

    // Verificar duplicidad en paymentMethod (paymentMethod_1 vs paymentMethodCode_1)
    // Conservaremos paymentMethodCode si ambos existen, o paymentMethod si solo existe ese.
    // La estrategia es ver si existen ambos y sugerir/eliminar uno.
    // El prompt pide: "Detecta si existe duplicidad en paymentMethod y borra el menos eficiente."
    // paymentMethod es ObjectId, paymentMethodCode es String. El código es más rápido para filtros de texto exacto.
    // Asumiremos que paymentMethodCode es preferible si el frontend usa códigos.

    const hasPaymentMethod = indexes.find(
      (i) => i.key.paymentMethod === 1 && Object.keys(i.key).length === 1,
    );
    const hasPaymentMethodCode = indexes.find(
      (i) => i.key.paymentMethodCode === 1 && Object.keys(i.key).length === 1,
    );

    if (hasPaymentMethod && hasPaymentMethodCode) {
      console.log(
        "⚠️ Detectada duplicidad: paymentMethod y paymentMethodCode. Eliminando paymentMethod (ObjectId)...",
      );
      redundantIndexes.push({
        key: { paymentMethod: 1 },
        name: hasPaymentMethod.name,
      });
    }

    // Proceso de eliminación
    for (const target of redundantIndexes) {
      const exists = indexes.find((idx) => {
        // Coincidencia exacta de claves
        return JSON.stringify(idx.key) === JSON.stringify(target.key);
      });

      if (exists) {
        console.log(`🗑️ Eliminando índice redundante: ${exists.name}...`);
        await collection.dropIndex(exists.name);
        console.log("✅ Índice eliminado.");
      } else {
        console.log(
          `ℹ️ Índice ${target.name} no encontrado (ya estaba limpio).`,
        );
      }
    }

    console.log("🎉 Optimización de índices completada.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Desconectado.");
    process.exit(0);
  }
};

optimizeIndexes();
