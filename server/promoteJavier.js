import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("No MONGODB_URI or MONGO_URI set");
  process.exit(1);
}

const EMAIL = "javierantoniomedinacorrea@gmail.com";

async function main() {
  try {
    await mongoose.connect(uri);

    const user = await User.findOne({ email: EMAIL });
    if (!user) {
      console.error(`User with email ${EMAIL} not found`);
      return;
    }

    user.role = "super_admin";
    user.status = "pending";
    // keep current active flag to avoid blocking access if already enabled
    await user.save();

    console.log("User promoted to super_admin (pending):");
    console.table([
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        active: user.active,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        createdAt: user.createdAt,
      },
    ]);
  } catch (err) {
    console.error("Promotion error:", err?.message || err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
