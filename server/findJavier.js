import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("No MONGODB_URI or MONGO_URI set");
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(uri);
    const users = await User.find({ name: /javier/i })
      .select("name email role status active subscriptionExpiresAt createdAt")
      .lean();

    console.log(`Found ${users.length} users matching "javier"`);
    if (users.length) {
      console.table(
        users.map((u) => ({
          id: u._id?.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          active: u.active,
          subscriptionExpiresAt: u.subscriptionExpiresAt,
          createdAt: u.createdAt,
        }))
      );
    }
  } catch (err) {
    console.error("Query error:", err?.message || err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
