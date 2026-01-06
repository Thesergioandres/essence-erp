import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Business from "./models/Business.js";
import Credit from "./models/Credit.js";
import Customer from "./models/Customer.js";
import Membership from "./models/Membership.js";
import Product from "./models/Product.js";
import Sale from "./models/Sale.js";
import User from "./models/User.js";

dotenv.config();

const checkLogin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB");

    // Estadísticas de todas las colecciones
    console.log("\n📊 ESTADÍSTICAS DE LA BASE DE DATOS\n");

    const userCount = await User.countDocuments();
    const businessCount = await Business.countDocuments();
    const productCount = await Product.countDocuments();
    const saleCount = await Sale.countDocuments();
    const customerCount = await Customer.countDocuments();
    const creditCount = await Credit.countDocuments();
    const membershipCount = await Membership.countDocuments();

    console.log(`👥 Usuarios: ${userCount}`);
    console.log(`🏢 Negocios: ${businessCount}`);
    console.log(`📦 Productos: ${productCount}`);
    console.log(`💰 Ventas: ${saleCount}`);
    console.log(`👤 Clientes: ${customerCount}`);
    console.log(`💳 Créditos: ${creditCount}`);
    console.log(`🔗 Membresías: ${membershipCount}`);

    // Verificar TODOS los usuarios sin límite y con fechas
    console.log("\n📋 TODOS LOS USUARIOS (sin límite):");
    const allUsers = await User.find({})
      .select("email name role status active createdAt")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\nTotal encontrado: ${allUsers.length} usuarios\n`);
    allUsers.forEach((u, i) => {
      const createdDate = new Date(u.createdAt).toLocaleString("es-ES");
      console.log(`${i + 1}. ${u.email} (${u.role}) - Creado: ${createdDate}`);
    });

    // Verificar fechas de ventas para ver si hay datos antiguos
    if (saleCount > 0) {
      const oldestSale = await Sale.findOne({})
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean();
      const newestSale = await Sale.findOne({})
        .sort({ createdAt: -1 })
        .select("createdAt")
        .lean();

      if (oldestSale && newestSale) {
        console.log("\n📅 Rango de fechas de las ventas:");
        console.log(
          `   Más antigua: ${new Date(oldestSale.createdAt).toLocaleString(
            "es-ES"
          )}`
        );
        console.log(
          `   Más reciente: ${new Date(newestSale.createdAt).toLocaleString(
            "es-ES"
          )}`
        );
      }
    }

    // Verificar usuario específico
    const testEmail = "serguito2003@gmail.com";
    const testPassword = "Serra_1707";

    console.log(`\n\n🔍 Buscando usuario: ${testEmail}`);
    const user = await User.findOne({ email: testEmail });

    if (!user) {
      console.log("❌ Usuario NO existe en la base de datos");

      if (businessCount > 0) {
        console.log("\n🏢 Todos los negocios:");
        const businesses = await Business.find({})
          .select("name status createdAt")
          .populate("createdBy", "email name")
          .sort({ createdAt: -1 })
          .lean();
        businesses.forEach((b, i) => {
          const createdDate = new Date(b.createdAt).toLocaleString("es-ES");
          console.log(
            `${i + 1}. ${b.name} - Creado: ${createdDate} por ${
              b.createdBy?.email || "N/A"
            }`
          );
        });
      }
    } else {
      console.log("✅ Usuario encontrado");
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Activo: ${user.active}`);

      // Probar contraseña
      console.log(`\n🔐 Probando contraseña...`);
      const passwordMatch = await bcrypt.compare(testPassword, user.password);

      if (passwordMatch) {
        console.log("✅ Contraseña CORRECTA - El login debería funcionar");
      } else {
        console.log("❌ Contraseña INCORRECTA - Por eso falla con 401");
        console.log(
          "   La contraseña en la BD no coincide con la que estás usando"
        );
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

checkLogin();
