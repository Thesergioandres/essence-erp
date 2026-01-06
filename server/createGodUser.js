import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Branch from "./models/Branch.js";
import Business from "./models/Business.js";
import Category from "./models/Category.js";
import Credit from "./models/Credit.js";
import Customer from "./models/Customer.js";
import DistributorStats from "./models/DistributorStats.js";
import Expense from "./models/Expense.js";
import Membership from "./models/Membership.js";
import Product from "./models/Product.js";
import Promotion from "./models/Promotion.js";
import Provider from "./models/Provider.js";
import Sale from "./models/Sale.js";
import Stock from "./models/Stock.js";
import User from "./models/User.js";

dotenv.config();

const createGodAndCheckData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB\n");

    // PARTE 1: VERIFICACIÓN COMPLETA DE DATOS
    console.log("═══════════════════════════════════════════════════");
    console.log("📊 ANÁLISIS COMPLETO DE LA BASE DE DATOS");
    console.log("═══════════════════════════════════════════════════\n");

    // Contar todo
    const counts = {
      users: await User.countDocuments(),
      businesses: await Business.countDocuments(),
      products: await Product.countDocuments(),
      sales: await Sale.countDocuments(),
      customers: await Customer.countDocuments(),
      credits: await Credit.countDocuments(),
      memberships: await Membership.countDocuments(),
      categories: await Category.countDocuments(),
      stock: await Stock.countDocuments(),
      providers: await Provider.countDocuments(),
      promotions: await Promotion.countDocuments(),
      branches: await Branch.countDocuments(),
      expenses: await Expense.countDocuments(),
      distributorStats: await DistributorStats.countDocuments(),
    };

    console.log("📈 Conteo General:");
    Object.entries(counts).forEach(([key, value]) => {
      const icon =
        value > 0
          ? "✅"
          : key === "users" || key === "businesses"
          ? "❌"
          : "⚪";
      console.log(`   ${icon} ${key}: ${value}`);
    });

    // Análisis detallado por negocio
    if (counts.businesses > 0) {
      console.log("\n🏢 ANÁLISIS POR NEGOCIO:\n");
      const businesses = await Business.find({})
        .populate("createdBy", "email name role")
        .sort({ createdAt: 1 })
        .lean();

      for (const [index, biz] of businesses.entries()) {
        console.log(`${index + 1}. 🏢 ${biz.name}`);
        console.log(`   ID: ${biz._id}`);
        console.log(
          `   Creado: ${new Date(biz.createdAt).toLocaleString("es-ES")}`
        );
        console.log(
          `   Creador: ${biz.createdBy?.email || "N/A"} (${
            biz.createdBy?.role || "N/A"
          })`
        );
        console.log(`   Status: ${biz.status}`);

        // Datos relacionados con este negocio
        const bizData = {
          products: await Product.countDocuments({ business: biz._id }),
          sales: await Sale.countDocuments({ business: biz._id }),
          customers: await Customer.countDocuments({ business: biz._id }),
          credits: await Credit.countDocuments({ business: biz._id }),
          memberships: await Membership.countDocuments({ business: biz._id }),
          categories: await Category.countDocuments({ business: biz._id }),
          stock: await Stock.countDocuments({ business: biz._id }),
          providers: await Provider.countDocuments({ business: biz._id }),
          promotions: await Promotion.countDocuments({ business: biz._id }),
          branches: await Branch.countDocuments({ business: biz._id }),
          expenses: await Expense.countDocuments({ business: biz._id }),
        };

        console.log(`   Datos asociados:`);
        Object.entries(bizData).forEach(([key, value]) => {
          if (value > 0) {
            console.log(`      • ${key}: ${value}`);
          }
        });

        // Membresías de este negocio
        const members = await Membership.find({ business: biz._id })
          .populate("user", "email name role")
          .lean();

        if (members.length > 0) {
          console.log(`   Miembros (${members.length}):`);
          members.forEach((m) => {
            console.log(
              `      • ${m.user?.email || "N/A"} - ${m.role} (${m.status})`
            );
          });
        }

        console.log("");
      }
    } else {
      console.log("\n❌ NO HAY NEGOCIOS EN LA BASE DE DATOS");
    }

    // Verificar ventas huérfanas (sin negocio válido)
    if (counts.sales > 0) {
      const salesWithBusiness = await Sale.aggregate([
        {
          $lookup: {
            from: "businesses",
            localField: "business",
            foreignField: "_id",
            as: "businessData",
          },
        },
        {
          $group: {
            _id: {
              hasValidBusiness: { $gt: [{ $size: "$businessData" }, 0] },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      console.log("\n💰 ANÁLISIS DE VENTAS:");
      salesWithBusiness.forEach((group) => {
        if (group._id.hasValidBusiness) {
          console.log(`   ✅ Ventas con negocio válido: ${group.count}`);
        } else {
          console.log(`   ⚠️  Ventas HUÉRFANAS (sin negocio): ${group.count}`);
        }
      });

      const oldestSale = await Sale.findOne({})
        .sort({ createdAt: 1 })
        .select("createdAt business")
        .populate("business", "name")
        .lean();
      const newestSale = await Sale.findOne({})
        .sort({ createdAt: -1 })
        .select("createdAt business")
        .populate("business", "name")
        .lean();

      console.log(
        `   Venta más antigua: ${new Date(oldestSale.createdAt).toLocaleString(
          "es-ES"
        )}`
      );
      console.log(
        `                      Negocio: ${
          oldestSale.business?.name || "N/A (HUÉRFANA)"
        }`
      );
      console.log(
        `   Venta más reciente: ${new Date(newestSale.createdAt).toLocaleString(
          "es-ES"
        )}`
      );
      console.log(
        `                       Negocio: ${
          newestSale.business?.name || "N/A (HUÉRFANA)"
        }`
      );
    }

    // PARTE 2: CREAR USUARIO GOD
    console.log("\n═══════════════════════════════════════════════════");
    console.log("👤 CREACIÓN DE USUARIO GOD");
    console.log("═══════════════════════════════════════════════════\n");

    const email = "serguito2003@gmail.com";
    const password = "Serra_1707";
    const name = "Sergio (GOD)";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`⚠️  Usuario ${email} ya existe`);
      console.log(`   Rol actual: ${existingUser.role}`);
      console.log(`   Status: ${existingUser.status}`);
      console.log(
        "\n❓ ¿Deseas actualizar el rol a 'god'? (el script no lo hace automáticamente)"
      );
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const godUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "god",
        status: "active",
        active: true,
      });

      console.log("✅ Usuario GOD creado exitosamente!");
      console.log(`   Email: ${godUser.email}`);
      console.log(`   Nombre: ${godUser.name}`);
      console.log(`   Rol: ${godUser.role}`);
      console.log(`   Status: ${godUser.status}`);
      console.log(`   Password: ${password}`);
      console.log("\n🔑 Ya puedes hacer login con estas credenciales");
    }

    // RESUMEN FINAL
    console.log("\n═══════════════════════════════════════════════════");
    console.log("📝 RESUMEN");
    console.log("═══════════════════════════════════════════════════\n");

    if (counts.businesses === 0) {
      console.log("❌ La base de datos de NEGOCIOS está VACÍA");
      console.log("   Todos los negocios anteriores se perdieron");
    } else {
      console.log(`✅ Hay ${counts.businesses} negocio(s) con datos asociados`);
    }

    if (counts.sales > 0 && counts.businesses === 0) {
      console.log(
        `⚠️  Hay ${counts.sales} ventas pero NO tienen negocio asociado`
      );
      console.log(
        "   Las ventas quedaron huérfanas después de borrar negocios"
      );
    }

    console.log("");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

createGodAndCheckData();
