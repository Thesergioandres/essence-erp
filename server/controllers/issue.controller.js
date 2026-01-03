import IssueReport from "../models/IssueReport.js";

const MAX_LOG_BYTES = 5 * 1024 * 1024; // 5 MB

const sanitizeLogs = (logsInput) => {
  if (!logsInput) return [];
  if (Array.isArray(logsInput)) {
    return logsInput
      .map((item) =>
        typeof item === "string" ? item : JSON.stringify(item, null, 2)
      )
      .filter(Boolean);
  }
  if (typeof logsInput === "string") return [logsInput];
  return [];
};

export const createIssue = async (req, res) => {
  try {
    const {
      message,
      stackTrace,
      logs: rawLogs,
      clientContext,
      screenshotUrl,
      screenshotPublicId,
    } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "El mensaje es obligatorio" });
    }

    const logs = sanitizeLogs(rawLogs);
    const totalBytes = Buffer.byteLength(logs.join("\n"), "utf8");
    if (totalBytes > MAX_LOG_BYTES) {
      return res
        .status(413)
        .json({ message: "El tamaño de los logs excede 5MB" });
    }

    const report = await IssueReport.create({
      user: req.user.id,
      role: req.user.role,
      message: message.trim(),
      stackTrace: typeof stackTrace === "string" ? stackTrace : undefined,
      logs,
      clientContext: {
        url: clientContext?.url,
        userAgent: clientContext?.userAgent,
        appVersion: clientContext?.appVersion,
        businessId: clientContext?.businessId,
      },
      screenshotUrl,
      screenshotPublicId,
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error("Error creando issue report", error);
    res.status(500).json({ message: "No se pudo crear el reporte" });
  }
};

export const listIssues = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ["open", "reviewing", "closed"].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    const [reports, total] = await Promise.all([
      IssueReport.find(filter)
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      IssueReport.countDocuments(filter),
    ]);

    res.json({
      data: reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error listando issues", error);
    res.status(500).json({ message: "No se pudieron obtener los reportes" });
  }
};

export const updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["open", "reviewing", "closed"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Estado inválido. Usa open/reviewing/closed" });
    }

    const report = await IssueReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("user", "name email role")
      .lean();

    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    res.json({ report });
  } catch (error) {
    console.error("Error actualizando issue", error);
    res.status(500).json({ message: "No se pudo actualizar el reporte" });
  }
};
