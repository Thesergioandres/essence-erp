import Business from "../models/Business.js";
import Membership from "../models/Membership.js";

// Resuelve el contexto de negocio a partir del header/query y valida membership
export const businessContext = async (req, res, next) => {
  try {
    const businessId = req.headers["x-business-id"] || req.query.businessId;
    // Incluso super_admin debe indicar el negocio explícitamente
    if (!businessId) {
      return res
        .status(400)
        .json({ message: "Falta el identificador de negocio (x-business-id)" });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    const isSuperAdmin = req.user?.role === "super_admin";
    let membership = null;
    if (!isSuperAdmin) {
      membership = await Membership.findOne({
        business: businessId,
        user: req.user?.id,
        status: "active",
      });

      if (!membership) {
        return res
          .status(403)
          .json({ message: "No tienes acceso a este negocio" });
      }
    }

    req.business = business;
    req.businessId = businessId;
    req.membership = membership;
    next();
  } catch (error) {
    console.error("businessContext error", error);
    res
      .status(500)
      .json({ message: "Error resolviendo negocio", error: error.message });
  }
};

// Verifica roles considerando super admin y rol por membership
export const requireRole = (roles = [], options = {}) => {
  return (req, res, next) => {
    const isSuperAdmin = req.user?.role === "super_admin";
    if (options.scope === "system") {
      return isSuperAdmin
        ? next()
        : res.status(403).json({ message: "Solo super administradores" });
    }

    if (isSuperAdmin && roles.includes("super_admin")) {
      return next();
    }

    const membershipRole = req.membership?.role;
    const userRole = req.user?.role;
    const effectiveRole = membershipRole || userRole;

    if (roles.includes(effectiveRole)) {
      return next();
    }

    return res.status(403).json({ message: "Acceso denegado" });
  };
};

// Verifica que la feature esté activa para el negocio seleccionado
export const requireFeature = (featureKey) => {
  return (req, res, next) => {
    const isSuperAdmin = req.user?.role === "super_admin";
    if (!req.business && isSuperAdmin) return next();

    const isEnabled = req.business?.config?.features?.[featureKey];
    if (isEnabled) return next();

    return res
      .status(403)
      .json({ message: "Funcionalidad desactivada para este negocio" });
  };
};
