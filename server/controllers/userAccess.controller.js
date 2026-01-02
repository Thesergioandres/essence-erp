import User from "../models/User.js";

const addDuration = (baseDate, { days = 0, months = 0, years = 0 }) => {
  const date = new Date(baseDate || Date.now());
  if (years) date.setFullYear(date.getFullYear() + Number(years));
  if (months) date.setMonth(date.getMonth() + Number(months));
  if (days) date.setDate(date.getDate() + Number(days));
  return date;
};

export const listUsers = async (_req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

export const activateUser = async (req, res) => {
  const { id } = req.params;
  const { days = 30, months = 0, years = 0 } = req.body || {};
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  user.status = "active";
  user.active = true;
  user.subscriptionExpiresAt = addDuration(Date.now(), { days, months, years });
  user.pausedRemainingMs = 0;
  await user.save();
  res.json({ success: true, user });
};

export const suspendUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  user.status = "suspended";
  user.active = false;
  await user.save();
  res.json({ success: true, user });
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  await user.deleteOne();
  res.json({ success: true });
};

export const extendSubscription = async (req, res) => {
  const { id } = req.params;
  const { days = 0, months = 0, years = 0 } = req.body || {};
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  const base =
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date()
      ? user.subscriptionExpiresAt
      : Date.now();
  user.subscriptionExpiresAt = addDuration(base, { days, months, years });
  user.status = "active";
  user.active = true;
  await user.save();
  res.json({ success: true, user });
};

export const pauseSubscription = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (user.status !== "active") {
    return res
      .status(400)
      .json({ message: "Solo se puede pausar desde estado active" });
  }
  if (!user.subscriptionExpiresAt) {
    return res
      .status(400)
      .json({ message: "El usuario no tiene suscripción activa" });
  }

  const remaining = new Date(user.subscriptionExpiresAt).getTime() - Date.now();
  user.pausedRemainingMs = Math.max(0, remaining);
  user.subscriptionExpiresAt = null;
  user.status = "paused";
  user.active = false;
  await user.save();
  res.json({ success: true, user });
};

export const resumeSubscription = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (user.status !== "paused") {
    return res
      .status(400)
      .json({ message: "Solo se puede reanudar desde estado paused" });
  }

  const remaining = user.pausedRemainingMs || 0;
  const expiresAt = new Date(Date.now() + remaining);
  user.subscriptionExpiresAt = expiresAt;
  user.pausedRemainingMs = 0;
  user.status = "active";
  user.active = true;
  await user.save();
  res.json({ success: true, user });
};
