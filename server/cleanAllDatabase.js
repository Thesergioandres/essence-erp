import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const cleanDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB\n");

    console.log("═══════════════════════════════════════════════════");
    console.log("⚠️  LIMPIEZA COMPLETA DE BASE DE DATOS");
    console.log("═══════════════════════════════════════════════════\n");

    // Obtener todas las colecciones
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log(`🗑️  Eliminando ${collections.length} colecciones...\n`);

    let totalDeleted = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      try {
        const result = await mongoose.connection.db
          .collection(collectionName)
          .deleteMany({});

        if (result.deletedCount > 0) {
          console.log(
            `   ✅ ${collectionName}: ${result.deletedCount} documentos eliminados`
          );
          totalDeleted += result.deletedCount;
        } else {
          console.log(`   ⚪ ${collectionName}: ya estaba vacía`);
        }
      } catch (error) {
        console.log(`   ❌ ${collectionName}: Error - ${error.message}`);
      }
    }

    console.log("\n═══════════════════════════════════════════════════");
    console.log(`✅ LIMPIEZA COMPLETADA`);
    console.log(`   Total documentos eliminados: ${totalDeleted}`);
    console.log("═══════════════════════════════════════════════════\n");

    console.log("📋 La base de datos ahora está completamente vacía.");
    console.log(
      "💡 Puedes empezar de cero registrando usuarios desde el frontend.\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

cleanDatabase();
