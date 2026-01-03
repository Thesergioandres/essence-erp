import Business from "../models/Business.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";

// Resuelve el contexto de negocio a partir del header/query y valida membership
export const businessContext = async (req, res, next) => {
  try {
    const isTest = process.env.NODE_ENV === "test";
    const businessId = req.headers["x-business-id"] || req.query.businessId;
    if (isTest && !businessId) {
      req.business = null;
      req.businessId = null;
      req.membership = null;
      return next();
    }
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
    const isGod = req.user?.role === "god";
    let membership = null;
    if (!isSuperAdmin && !isGod) {
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

    // Si el creador (super admin) perdió acceso, bloquear a los distribuidores del negocio
    if (!isTest && membership?.role === "distribuidor" && !isGod) {
      // Resolver owner/admin principal: membership admin más antiguo o creador
      const primaryAdminMembership = await Membership.findOne({
        business: businessId,
        role: "admin",
        status: "active",
      })
        .sort({ createdAt: 1 })
        .lean();

      const ownerUserId = primaryAdminMembership?.user || business.createdBy;
      const owner = await User.findById(ownerUserId).select(
        "role status active subscriptionExpiresAt"
      );

      const ownerExpired =
        owner?.subscriptionExpiresAt &&
        new Date(owner.subscriptionExpiresAt).getTime() < Date.now();

      const ownerInactive =
        !owner || !owner.active || owner.status !== "active" || ownerExpired;

      if (ownerInactive) {
        return res.status(403).json({
          message:
            "Acceso deshabilitado: el administrador del negocio no tiene acceso activo",
          code: "owner_inactive",
          subscriptionExpiresAt: owner?.subscriptionExpiresAt || null,
        });
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
    const isGod = req.user?.role === "god";
    if (options.scope === "system") {
      return isSuperAdmin
        ? next()
        : res.status(403).json({ message: "Solo super administradores" });
    }

    if ((isSuperAdmin || isGod) && roles.includes("super_admin")) {
      return next();
    }

    const membershipRole = req.membership?.role;
    const userRole = req.user?.role;
    const effectiveRole = isGod ? "super_admin" : membershipRole || userRole;

    if (roles.includes(effectiveRole)) {
      return next();
    }

    return res.status(403).json({ message: "Acceso denegado" });
  };
};

// Verifica que la feature esté activa para el negocio seleccionado
export const requireFeature = (featureKey) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === "test" && !req.business) return next();
    const isSuperAdmin = req.user?.role === "super_admin";
    const isGod = req.user?.role === "god";
    if (!req.business && (isSuperAdmin || isGod)) return next();

    if (isSuperAdmin || isGod) return next();

    const isEnabled = req.business?.config?.features?.[featureKey];
    // Si no está definido, asumir habilitado para no bloquear rutas por config incompleta
    if (isEnabled !== false) return next();

    return res
      .status(403)
      .json({ message: "Funcionalidad desactivada para este negocio" });
  };
};
