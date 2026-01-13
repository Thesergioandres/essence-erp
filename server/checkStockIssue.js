import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const checkStockIssue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB\n");

    const Product = mongoose.model(
      "Product",
      new mongoose.Schema({}, { strict: false })
    );
    const Branch = mongoose.model(
      "Branch",
      new mongoose.Schema({}, { strict: false })
    );
    const BranchStock = mongoose.model(
      "BranchStock",
      new mongoose.Schema({}, { strict: false })
    );

    // Buscar la sede "Bodega"
    const bodega = await Branch.findOne({ name: /bodega/i });

    if (!bodega) {
      console.log("❌ No se encontró la sede 'Bodega'");
      console.log("\nSedes disponibles:");
      const allBranches = await Branch.find({});
      allBranches.forEach((b) => {
        console.log(`  - ${b.name} (isWarehouse: ${b.isWarehouse})`);
      });
    } else {
      console.log(`✅ Sede encontrada: ${bodega.name}`);
      console.log(`   isWarehouse: ${bodega.isWarehouse}`);
      console.log(`   _id: ${bodega._id}\n`);
    }

    // Ver stock de productos
    console.log("📦 Stock de productos:\n");
    const products = await Product.find({})
      .limit(10)
      .sort({ warehouseStock: -1 });

    for (const product of products) {
      console.log(`${product.name}:`);
      console.log(`  totalStock: ${product.totalStock || 0}`);
      console.log(`  warehouseStock: ${product.warehouseStock || 0}`);

      // Ver stock en sedes
      if (bodega) {
        const branchStock = await BranchStock.findOne({
          branch: bodega._id,
          product: product._id,
        });
        console.log(`  Stock en Bodega: ${branchStock?.quantity || 0}`);
      }
      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

checkStockIssue();
