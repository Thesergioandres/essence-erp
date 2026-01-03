import mongoose from "mongoose";
import Membership from "../models/Membership.js";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://sergio:sergio123@cluster0.ztdix.mongodb.net/essence?retryWrites=true&w=majority&appName=essence";

const businessId = process.argv[2];

if (!businessId) {
  console.error("Uso: node scripts/listDistributors.js <businessId>");
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);

  const results = await Membership.aggregate([
    {
      $match: {
        business: new mongoose.Types.ObjectId(businessId),
        role: "distribuidor",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        name: "$user.name",
        email: "$user.email",
        membershipStatus: "$status",
        userStatus: "$user.status",
        active: "$user.active",
        subscriptionExpiresAt: "$user.subscriptionExpiresAt",
      },
    },
  ]);

  if (!results.length) {
    console.log("Sin distribuidores para ese businessId");
  } else {
    console.log(JSON.stringify(results, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
