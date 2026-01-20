import dotenv from "dotenv";
import mongoose from "mongoose";
import DefectiveProduct from "./models/DefectiveProduct.js";
import Product from "./models/Product.js";

dotenv.config();

const fixDefectiveBusiness = async () => {
  try {
    // Usar la URI correcta (MONGODB_URI para producción)
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/essence";
    console.log(
      "Conectando a:",
      mongoUri.includes("mongodb+srv") ? "MongoDB Atlas" : "MongoDB Local",
    );
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB");

    // Encontrar todos los productos defectuosos sin populate
    const allDefective = await DefectiveProduct.find({}).lean();

    console.log(
      `\n📊 Total productos defectuosos en BD: ${allDefective.length}`,
    );

    // Agrupar por estado
    const byStatus = {};
    for (const def of allDefective) {
      byStatus[def.status || "sin-estado"] =
        (byStatus[def.status || "sin-estado"] || 0) + 1;
    }

    console.log("\nPor estado:");
    for (const [status, count] of Object.entries(byStatus)) {
      console.log(`  ${status}: ${count}`);
    }

    // Encontrar todos los productos defectuosos
    const defectiveProducts = await DefectiveProduct.find({}).lean();

    console.log(
      `\n📊 Total productos defectuosos: ${defectiveProducts.length}`,
    );

    // Mostrar estado actual
    const withBusiness = defectiveProducts.filter((d) => d.business);
    const withoutBusiness = defectiveProducts.filter((d) => !d.business);

    console.log(`✅ Con business: ${withBusiness.length}`);
    console.log(`❌ Sin business: ${withoutBusiness.length}`);

    if (withoutBusiness.length > 0) {
      console.log("\n🔧 Corrigiendo productos defectuosos sin business...");

      // Primero intentar encontrar un producto válido para obtener el business
      console.log("\nBuscando products para determinar business...");
      const sampleProduct = await Product.findOne({}).lean();
      if (sampleProduct) {
        console.log(`Producto ejemplo encontrado: ${sampleProduct._id}`);
        console.log(`Business: ${sampleProduct.business}`);
      }

      for (const defective of withoutBusiness) {
        let businessToAssign = null;

        // Obtener el productId
        const productId =
          typeof defective.product === "object"
            ? defective.product._id || defective.product
            : defective.product;

        console.log(`\nProcesando defective ${defective._id}...`);
        console.log(`  ProductId: ${productId}`);

        if (productId) {
          const product = await Product.findById(productId).lean();
          if (product) {
            console.log(`  Producto encontrado: ${product.name}`);
            businessToAssign = product.business;
            console.log(`  Business del producto: ${businessToAssign}`);
          } else {
            console.log(`  ⚠️ Producto no encontrado en BD`);
            // Usar el business del producto ejemplo
            if (sampleProduct && sampleProduct.business) {
              businessToAssign = sampleProduct.business;
              console.log(
                `  Usando business del primer producto: ${businessToAssign}`,
              );
            }
          }
        }

        if (businessToAssign) {
          await DefectiveProduct.updateOne(
            { _id: defective._id },
            { $set: { business: businessToAssign } },
          );
          console.log(
            `  ✓ Actualizado ${defective._id} con business ${businessToAssign}`,
          );
        } else {
          console.log(
            `  ⚠️ No se pudo determinar business para ${defective._id}`,
          );
          console.log(`     Product ID: ${productId}`);
          console.log(`     Reason: ${defective.reason}`);
          console.log(`     SaleGroupId: ${defective.saleGroupId}`);
        }
      }
    }

    // Verificar resultado
    const afterFix = await DefectiveProduct.find({});
    const fixedWithBusiness = afterFix.filter((d) => d.business);
    const fixedWithoutBusiness = afterFix.filter((d) => !d.business);

    console.log("\n✨ Resultado:");
    console.log(`✅ Con business: ${fixedWithBusiness.length}`);
    console.log(`❌ Sin business: ${fixedWithoutBusiness.length}`);

    // Mostrar estadísticas por business
    const byBusiness = {};
    for (const defective of afterFix) {
      const businessId = defective.business?.toString() || "sin-business";
      byBusiness[businessId] = (byBusiness[businessId] || 0) + 1;
    }

    console.log("\n📊 Por business:");
    for (const [businessId, count] of Object.entries(byBusiness)) {
      console.log(`  ${businessId}: ${count} productos defectuosos`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixDefectiveBusiness();
