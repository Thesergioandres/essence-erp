import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error(
    "MONGODB_URI or MONGO_URI is required in environment variables"
  );
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(mongoUri);

    const admins = await User.find({ role: "super_admin" })
      .select("name email role status active subscriptionExpiresAt createdAt")
      .lean();

    console.log(`Found ${admins.length} super_admin users`);
    if (admins.length > 0) {
      console.table(
        admins.map((u) => ({
          id: u._id?.toString(),
          name: u.name,
          email: u.email,
          status: u.status,
          active: u.active,
          subscriptionExpiresAt: u.subscriptionExpiresAt,
          createdAt: u.createdAt,
        }))
      );
    }
  } catch (err) {
    console.error("Error listing super_admin users:", err?.message || err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
