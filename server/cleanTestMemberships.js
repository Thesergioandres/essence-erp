import dotenv from "dotenv";
import mongoose from "mongoose";
import Membership from "./models/Membership.js";
import User from "./models/User.js";

dotenv.config();

async function main() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/essence";
  const businessId = process.env.BUSINESS_ID;
  if (!businessId) {
    console.error("❌ Define BUSINESS_ID para limpiar memberships");
    process.exit(1);
  }

  const testNames = ["Prueba", "prueb2", "Test", "prueba"];

  await mongoose.connect(mongoUri);
  console.log("✅ Conectado a Mongo");
  console.log(`🔗 Limpiando businessId=${businessId}`);

  const users = await User.find({
    name: { $in: testNames },
    role: "distribuidor",
  }).select("_id name email");
  if (!users.length) {
    console.log("No hay usuarios de prueba para eliminar");
    await mongoose.disconnect();
    process.exit(0);
  }

  const userIds = users.map((u) => u._id);
  const res = await Membership.deleteMany({
    business: businessId,
    user: { $in: userIds },
  });

  users.forEach((u) =>
    console.log(`🧹 Eliminado membership de ${u.name} (${u.email})`)
  );
  console.log(`➡️ Eliminados: ${res.deletedCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error limpiando memberships de prueba:", err);
  process.exit(1);
});
