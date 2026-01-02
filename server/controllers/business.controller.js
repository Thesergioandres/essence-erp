import Business from "../models/Business.js";
import Membership from "../models/Membership.js";

export const createBusiness = async (req, res) => {
  try {
    const {
      name,
      description,
      features,
      contactEmail,
      contactPhone,
      contactWhatsapp,
      contactLocation,
    } = req.body;

    const exists = await Business.findOne({ name });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Ya existe un negocio con ese nombre" });
    }

    const business = await Business.create({
      name,
      description,
      contactEmail,
      contactPhone,
      contactWhatsapp,
      contactLocation,
      config: { features: { ...(features || {}) } },
      createdBy: req.user.id,
    });

    // Asignar al creador como admin del negocio
    await Membership.create({
      user: req.user.id,
      business: business._id,
      role: "admin",
      status: "active",
    });

    res.status(201).json({ business });
  } catch (error) {
    console.error("createBusiness error", error);
    res
      .status(500)
      .json({ message: "Error creando negocio", error: error.message });
  }
};

export const listBusinesses = async (_req, res) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 }).lean();
    res.json({ businesses });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listando negocios", error: error.message });
  }
};

export const getBusinessDetail = async (req, res) => {
  try {
    const business = req.business;
    const members = await Membership.find({ business: business._id })
      .populate("user", "name email role active")
      .lean();

    res.json({ business, members });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo negocio", error: error.message });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const business = req.business;
    const {
      name,
      description,
      contactEmail,
      contactPhone,
      contactWhatsapp,
      contactLocation,
      logoUrl,
      logoPublicId,
    } = req.body;

    if (name) business.name = name;
    if (description !== undefined) business.description = description;
    if (contactEmail !== undefined) business.contactEmail = contactEmail;
    if (contactPhone !== undefined) business.contactPhone = contactPhone;
    if (contactWhatsapp !== undefined)
      business.contactWhatsapp = contactWhatsapp;
    if (contactLocation !== undefined)
      business.contactLocation = contactLocation;
    if (logoUrl !== undefined) business.logoUrl = logoUrl;
    if (logoPublicId !== undefined) business.logoPublicId = logoPublicId;

    await business.save();

    res.json({ business });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error actualizando negocio", error: error.message });
  }
};

export const updateBusinessFeatures = async (req, res) => {
  try {
    const { features } = req.body;
    if (!features || typeof features !== "object") {
      return res.status(400).json({ message: "features es requerido" });
    }

    const business = req.business;
    business.config.features = {
      ...(business.config?.features?.toObject?.() ||
        business.config?.features ||
        {}),
      ...features,
    };
    await business.save();

    res.json({ business });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error actualizando features", error: error.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ message: "userId y role son requeridos" });
    }

    const membership = await Membership.findOneAndUpdate(
      { user: userId, business: req.businessId },
      { role, status: "active" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ membership });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creando miembro", error: error.message });
  }
};

export const updateMember = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { role, status } = req.body;

    const membership = await Membership.findOneAndUpdate(
      { _id: membershipId, business: req.businessId },
      { ...(role ? { role } : {}), ...(status ? { status } : {}) },
      { new: true }
    );

    if (!membership) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json({ membership });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error actualizando miembro", error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const membership = await Membership.findOneAndDelete({
      _id: membershipId,
      business: req.businessId,
    });

    if (!membership) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json({ message: "Membresía eliminada" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error eliminando miembro", error: error.message });
  }
};

export const deleteBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findByIdAndDelete(businessId);
    if (!business) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    await Membership.deleteMany({ business: businessId });

    res.json({ message: "Negocio eliminado", businessId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error eliminando negocio", error: error.message });
  }
};

export const listMembers = async (req, res) => {
  try {
    const members = await Membership.find({ business: req.businessId })
      .populate("user", "name email role active")
      .lean();
    res.json({ members });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listando miembros", error: error.message });
  }
};

export const getMyMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.user.id,
      status: "active",
    })
      .populate(
        "business",
        "name description config status contactEmail contactPhone contactWhatsapp contactLocation metadata"
      )
      .lean();
    res.json({ memberships });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo membresías", error: error.message });
  }
};
