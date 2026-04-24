import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { ProductRepository } from "./server/src/infrastructure/database/repositories/ProductRepository.js";
import { applyDynamicEmployeePricingToProduct } from "./server/src/infrastructure/services/productPricing.service.js";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const repo = new ProductRepository();
  const businessId = "6612bebd1a23c8a91a93b4a2"; // We don't know the exact businessId, let's fetch any product
  const Model = mongoose.model("Product");
  const p = await Model.findOne().lean();

  if (!p) {
    console.log("No product found");
    return;
  }

  console.log("Original Product:");
  console.log({
    name: p.name,
    clientPrice: p.clientPrice,
    employeePrice: p.employeePrice,
    employeePriceManual: p.employeePriceManual,
    employeePriceManualValue: p.employeePriceManualValue
  });

  const baseCommission = 20;
  const priced = applyDynamicEmployeePricingToProduct(p, baseCommission);

  console.log("\nWith Pricing:");
  console.log({
    employeePrice: priced.employeePrice,
    employeePriceMode: priced.employeePriceMode,
  });

  process.exit(0);
}

main().catch(console.error);
