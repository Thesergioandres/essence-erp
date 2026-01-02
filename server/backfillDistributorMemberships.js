import dotenv from "dotenv";
import mongoose from "mongoose";
import Business from "./models/Business.js";
import Membership from "./models/Membership.js";
import User from "./models/User.js";

dotenv.config();

/**
 * Backfill memberships for distributors in a given business.
 * Resolves business by env BUSINESS_ID or BUSINESS_NAME (default "Essence").
 * Usage:
 *   BUSINESS_NAME="Essence" node backfillDistributorMemberships.js
 *   BUSINESS_ID="<id>" node backfillDistributorMemberships.js
 */
async function main() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/essence";
  const businessNameArg =
    getArgValue("--business") || process.env.BUSINESS_NAME;
  const businessIdArg = getArgValue("--businessId") || process.env.BUSINESS_ID;
  const fallbackName = businessNameArg || "Essence";

  await mongoose.connect(mongoUri);
  console.log("✅ Conectado a Mongo");

  const businessId =
    businessIdArg || (await resolveBusinessIdByName(fallbackName));
  if (!businessId) {
    console.error(
      "❌ No encontré el negocio. Pasa BUSINESS_ID o BUSINESS_NAME explicito."
    );
    process.exit(1);
  }

  console.log(`🔗 Usando businessId=${businessId}`);

  const distributors = await User.find({ role: "distribuidor" }).select(
    "_id name email active"
  );
  console.log(`👥 Distribuidores encontrados: ${distributors.length}`);

  let created = 0;
  let skipped = 0;

  for (const d of distributors) {
    const exists = await Membership.findOne({
      user: d._id,
      business: businessId,
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    await Membership.create({
      user: d._id,
      business: businessId,
      role: "distribuidor",
      status: "active",
    });
    created += 1;
    console.log(`➕ Membership creado para ${d.name || d.email}`);
  }

  console.log(
    `🎉 Backfill listo. Nuevos=${created}, ya existían=${skipped}, total=${distributors.length}`
  );

  await mongoose.disconnect();
  process.exit(0);
}

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

async function resolveBusinessIdByName(name) {
  const business = await Business.findOne({ name }).select("_id name");
  if (!business) {
    console.error(`⚠️  No encontré negocio con nombre: ${name}`);
    const available = await Business.find().select("_id name");
    console.error("Negocios disponibles:");
    available.forEach((b) => console.error(`- ${b.name} (${b._id})`));
    return null;
  }
  return business._id;
}

main().catch((err) => {
  console.error("❌ Error en backfill:", err);
  process.exit(1);
});
