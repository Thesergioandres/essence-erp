import AuditLog from "../models/AuditLog.js";
import Segment from "../models/Segment.js";

const resolveBusinessId = (req) =>
  req.businessId || req.headers["x-business-id"] || req.query.businessId;

const recordAudit = async (req, entity, action, oldValues) => {
  try {
    await AuditLog.create({
      business: entity.business,
      user: req.user?._id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      userRole: req.user?.role,
      action,
      module: "clients",
      description: `${action} ${entity.name}`,
      entityType: "Segment",
      entityId: entity._id,
      entityName: entity.name,
      oldValues: oldValues || undefined,
      newValues: entity,
    });
  } catch (error) {
    console.error("audit log segment error", error?.message);
  }
};

export const createSegment = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const payload = req.body || {};
    if (!payload.name) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }
    if (!payload.key) {
      return res.status(400).json({ message: "La clave es obligatoria" });
    }

    const segment = await Segment.create({
      ...payload,
      name: payload.name?.trim(),
      key: payload.key?.trim().toLowerCase(),
      business: businessId,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await recordAudit(req, segment, "segment_created");

    res.status(201).json({ segment });
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: "La clave del segmento ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const listSegments = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const segments = await Segment.find({ business: businessId }).sort({
      createdAt: -1,
    });
    res.json({ segments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSegmentById = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const segment = await Segment.findOne({
      _id: req.params.id,
      business: businessId,
    });

    if (!segment) {
      return res.status(404).json({ message: "Segmento no encontrado" });
    }

    res.json({ segment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSegment = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const segment = await Segment.findOne({
      _id: req.params.id,
      business: businessId,
    });

    if (!segment) {
      return res.status(404).json({ message: "Segmento no encontrado" });
    }

    const oldValues = segment.toObject();
    const updatable = ["name", "key", "description", "rules", "metadata"];

    for (const field of updatable) {
      if (field in req.body) {
        segment[field] =
          field === "key"
            ? req.body[field]?.trim().toLowerCase()
            : req.body[field];
      }
    }

    segment.updatedBy = req.user?._id;
    await segment.save();

    await recordAudit(req, segment, "segment_updated", oldValues);

    res.json({ segment });
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: "La clave del segmento ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteSegment = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const segment = await Segment.findOne({
      _id: req.params.id,
      business: businessId,
    });

    if (!segment) {
      return res.status(404).json({ message: "Segmento no encontrado" });
    }

    const oldValues = segment.toObject();
    await segment.deleteOne();

    await recordAudit(
      req,
      { ...segment, business: businessId },
      "segment_deleted",
      oldValues
    );

    res.json({ message: "Segmento eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
