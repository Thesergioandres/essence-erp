import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

import mongoose from "mongoose";

import Business from "../src/infrastructure/database/models/Business.js";
import Membership from "../src/infrastructure/database/models/Membership.js";
import User from "../src/infrastructure/database/models/User.js";

async function rescueMemberships() {
  console.log("Iniciando rescate de membresías y relaciones Users <-> Businesses...");

  const uri = process.env.MONGO_URI || process.env.MONGO_URI_DEV_LOCAL || process.env.MONGO_URI_DEV;
  if (!uri) {
    console.error("Variable MONGO_URI no definida.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Conectado a la base de datos.");

    const businesses = await Business.find();
    console.log("Encontrados " + businesses.length + " negocios.");

    let fixedCount = 0;

    for (const business of businesses) {
      if (!business.createdBy) {
        console.warn("Negocio " + business.name + " no tiene 'createdBy'. Saltando.");
        continue;
      }

      const creatorId = business.createdBy;
      const user = await User.findById(creatorId);

      if (!user) continue;

      let properRole = "admin"; // Membership only supports admin, employee, etc.

      let membership = await Membership.findOne({
        business: business._id,
        user: creatorId,
      });

      if (!membership) {
        membership = await Membership.create({
          user: creatorId,
          business: business._id,
          role: properRole,
          status: "active",
        });
        console.log("[+] Membresía " + properRole + " creada para " + business.name + " (" + user.email + ")");
        fixedCount++;
      } else if (membership.role !== "admin") {
        membership.role = "admin";
        await membership.save();
        console.log("[+] Membresía para " + user.email + " en " + business.name + " actualizada a admin");
        fixedCount++;
      }

      if (!user.businesses) user.businesses = [];
      if (!user.businesses.includes(business._id)) {
        user.businesses.push(business._id);
        await user.save();
        console.log("[+] Negocio " + business.name + " añadido al usuario " + user.email);
        fixedCount++;
      }
    }

    console.log("Rescate finalizado. Se hicieron " + fixedCount + " correcciones.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    console.log("Desconectado de la BD.");
  }
}

rescueMemberships();
