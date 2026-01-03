import Branch from "../models/Branch.js";

const resolveBusinessId = (req) =>
  req?.businessId || req?.headers?.["x-business-id"] || req?.query?.businessId;

const ensureWarehouseBranch = async (businessId) => {
  let branch = await Branch.findOne({
    business: businessId,
    isWarehouse: true,
  });

  if (!branch) {
    branch = await Branch.findOne({ business: businessId, name: "Bodega" });
    if (branch && !branch.isWarehouse) {
      branch.isWarehouse = true;
      await branch.save();
    }
  }

  if (!branch) {
    branch = await Branch.create({
      business: businessId,
      name: "Bodega",
      isWarehouse: true,
      active: true,
    });
  }

  return branch;
};

export const createBranch = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const {
      name,
      address,
      contactName,
      contactPhone,
      contactEmail,
      timezone,
      config,
    } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ message: "El nombre de la sede es obligatorio" });
    }

    const branch = await Branch.create({
      business: businessId,
      name: name.trim(),
      address,
      contactName,
      contactPhone,
      contactEmail,
      timezone: timezone || "America/Bogota",
      config: config || {},
    });

    res.status(201).json({ branch });
  } catch (error) {
    console.error("createBranch error", error);
    res.status(500).json({ message: "No se pudo crear la sede" });
  }
};

export const listBranches = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    await ensureWarehouseBranch(businessId);

    const branches = await Branch.find({ business: businessId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: branches });
  } catch (error) {
    console.error("listBranches error", error);
    res.status(500).json({ message: "No se pudieron obtener las sedes" });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const updates = {};
    const {
      name,
      address,
      contactName,
      contactPhone,
      contactEmail,
      timezone,
      config,
      active,
    } = req.body;
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (contactName !== undefined) updates.contactName = contactName;
    if (contactPhone !== undefined) updates.contactPhone = contactPhone;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (timezone !== undefined) updates.timezone = timezone;
    if (config !== undefined) updates.config = config;
    if (active !== undefined) updates.active = active;

    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      updates,
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }

    res.json({ branch });
  } catch (error) {
    console.error("updateBranch error", error);
    res.status(500).json({ message: "No se pudo actualizar la sede" });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const branch = await Branch.findOneAndDelete({
      _id: req.params.id,
      business: businessId,
    });

    if (!branch) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }

    res.json({ message: "Sede eliminada" });
  } catch (error) {
    console.error("deleteBranch error", error);
    res.status(500).json({ message: "No se pudo eliminar la sede" });
  }
};
