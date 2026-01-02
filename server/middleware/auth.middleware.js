import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Proteger rutas - verificar JWT
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(" ")[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("🔑 Token decodificado:", decoded);

      // Obtener usuario del token (soportar tanto 'id' como 'userId')
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        console.log("❌ Token no contiene 'id' ni 'userId'");
        return res
          .status(401)
          .json({ message: "Token inválido: falta ID de usuario" });
      }

      const user = await User.findById(userId).select("-password");

      if (!user) {
        console.log("❌ Usuario no encontrado:", userId);
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      // Agregar información del usuario a req.user
      req.user = {
        userId: user._id.toString(),
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        active: user.active,
      };

      console.log(
        "✅ Usuario autenticado:",
        req.user.name,
        `(${req.user.role})`
      );

      next();
    } catch (error) {
      console.log("❌ Error en autenticación:", error.message);
      res.status(401).json({ message: "No autorizado, token inválido" });
    }
  } else {
    console.log("❌ No se proporcionó token");
    res.status(401).json({ message: "No autorizado, sin token" });
  }
};

// Verificar si es admin
export const admin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "super_admin")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Acceso denegado. Solo administradores" });
  }
};

// Verificar si es distribuidor
export const distributor = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "distribuidor" ||
      req.user.role === "admin" ||
      req.user.role === "super_admin")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Acceso denegado. Solo distribuidores" });
  }
};

// Verificar si es admin o distribuidor
export const adminOrDistributor = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" ||
      req.user.role === "distribuidor" ||
      req.user.role === "super_admin")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Acceso denegado" });
  }
};
