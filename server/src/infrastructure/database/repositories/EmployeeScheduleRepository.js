import mongoose from "mongoose";
import { employeeRoleQuery } from "../../../utils/roleAliases.js";
import Branch from "../models/Branch.js";
import EmployeeSchedule, {
  DAY_INDEX_BY_NAME,
  DAY_NAME_BY_INDEX,
  DAY_OF_WEEK_VALUES,
  SCHEDULE_STATUSES,
} from "../models/EmployeeSchedule.js";
import Membership from "../models/Membership.js";
import checkAvailabilitySlot from "./utils/checkAvailability.js";

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ADMIN_ROLES = new Set(["admin", "super_admin", "god"]);
const TRANSACTION_UNSUPPORTED_PATTERNS = [
  "Transaction numbers are only allowed",
  "Transaction is not supported",
  "replica set member",
  "not a mongos",
];

const normalizeDayName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeDayOfWeek = (value) => {
  if (Number.isInteger(value) && value >= 0 && value <= 6) {
    return value;
  }

  const normalizedText = normalizeDayName(value);

  if (/^[0-6]$/.test(normalizedText)) {
    return Number(normalizedText);
  }

  if (normalizedText in DAY_INDEX_BY_NAME) {
    return DAY_INDEX_BY_NAME[normalizedText];
  }

  return null;
};

const normalizeStatus = (value) => {
  const status = String(value || "available")
    .trim()
    .toLowerCase();

  if (SCHEDULE_STATUSES.includes(status)) {
    return status;
  }

  return null;
};

const toMinutes = (value) => {
  const match = String(value || "")
    .trim()
    .match(HH_MM_PATTERN);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour * 60 + minute;
};

const toDayLabel = (dayOfWeek) => {
  const dayName = DAY_NAME_BY_INDEX[dayOfWeek] || "dia";
  return `${dayName.charAt(0).toUpperCase()}${dayName.slice(1)}`;
};

const normalizePersistedEntry = (entry) => {
  const dayOfWeek = normalizeDayOfWeek(entry.dayOfWeek ?? entry.day);
  const resolvedDayOfWeek = dayOfWeek === null ? 0 : dayOfWeek;

  return {
    ...entry,
    dayOfWeek: resolvedDayOfWeek,
    day: DAY_NAME_BY_INDEX[resolvedDayOfWeek],
    status: normalizeStatus(entry.status) || "available",
  };
};

const sortSchedules = (schedules = []) =>
  [...schedules].sort((left, right) => {
    const dayDiff =
      (Number.isInteger(left.dayOfWeek) ? left.dayOfWeek : 999) -
      (Number.isInteger(right.dayOfWeek) ? right.dayOfWeek : 999);

    if (dayDiff !== 0) {
      return dayDiff;
    }

    return String(left.startTime).localeCompare(String(right.startTime));
  });

const validateNoOverlaps = (entries = []) => {
  const groupedByDay = new Map();

  for (const entry of entries) {
    const currentDayEntries = groupedByDay.get(entry.dayOfWeek) || [];
    currentDayEntries.push(entry);
    groupedByDay.set(entry.dayOfWeek, currentDayEntries);
  }

  for (const [dayOfWeek, dayEntries] of groupedByDay.entries()) {
    const sortedEntries = [...dayEntries].sort(
      (left, right) => left.startMinutes - right.startMinutes,
    );

    for (let index = 1; index < sortedEntries.length; index += 1) {
      const previousEntry = sortedEntries[index - 1];
      const currentEntry = sortedEntries[index];

      if (previousEntry.endMinutes > currentEntry.startMinutes) {
        const error = new Error(
          `Solapamiento detectado en ${toDayLabel(dayOfWeek)} entre ${previousEntry.startTime}-${previousEntry.endTime} y ${currentEntry.startTime}-${currentEntry.endTime}`,
        );
        error.statusCode = 400;
        throw error;
      }
    }
  }
};

const normalizeEntry = (entry, index) => {
  if (!entry || typeof entry !== "object") {
    const error = new Error(
      `Entrada de horario invalida en posicion ${index + 1}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const dayOfWeek = normalizeDayOfWeek(entry.dayOfWeek ?? entry.day);
  const day = dayOfWeek === null ? "" : DAY_NAME_BY_INDEX[dayOfWeek];
  const startTime = String(entry.startTime || "").trim();
  const endTime = String(entry.endTime || "").trim();
  const sedeId = String(entry.sedeId || "").trim();
  const status = normalizeStatus(entry.status || "available");

  if (dayOfWeek === null) {
    const error = new Error(`Dia invalido en posicion ${index + 1}`);
    error.statusCode = 400;
    throw error;
  }

  if (!status) {
    const error = new Error(`Estado invalido en posicion ${index + 1}`);
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.isValidObjectId(sedeId)) {
    const error = new Error(`Sede invalida en posicion ${index + 1}`);
    error.statusCode = 400;
    throw error;
  }

  if (!HH_MM_PATTERN.test(startTime) || !HH_MM_PATTERN.test(endTime)) {
    const error = new Error(
      `Formato de hora invalido en posicion ${index + 1}. Usa HH:mm`,
    );
    error.statusCode = 400;
    throw error;
  }

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes
  ) {
    const error = new Error(
      `Rango horario invalido en posicion ${index + 1}. startTime debe ser menor que endTime`,
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    dayOfWeek,
    day,
    sedeId,
    startTime,
    endTime,
    status,
    startMinutes,
    endMinutes,
  };
};

const isTransactionUnsupportedError = (error) => {
  const message = String(error?.message || "");
  return TRANSACTION_UNSUPPORTED_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
};

const buildScope = (businessId, requesterRole) => {
  if (requesterRole === "god") {
    return {};
  }

  return { business: businessId };
};

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

const sortEmployees = (employees = []) =>
  [...employees].sort((left, right) =>
    String(left.name || "").localeCompare(String(right.name || "")),
  );

const listEmployeesForBranch = async ({
  businessId,
  requesterRole,
  sedeId,
}) => {
  const membershipFilter = {
    ...buildScope(businessId, requesterRole),
    role: employeeRoleQuery,
    status: "active",
  };

  if (sedeId) {
    const sedeObjectId = toObjectId(sedeId);
    membershipFilter.$or = [
      { allowedBranches: { $exists: false } },
      { allowedBranches: { $size: 0 } },
      { allowedBranches: sedeObjectId },
    ];
  }

  const memberships = await Membership.find(membershipFilter)
    .populate("user", "name email")
    .lean();

  const uniqueEmployees = new Map();

  for (const membership of memberships) {
    const user = membership?.user;
    if (!user?._id) {
      continue;
    }

    const employeeId = String(user._id);

    if (!uniqueEmployees.has(employeeId)) {
      uniqueEmployees.set(employeeId, {
        _id: employeeId,
        name: user.name || "Colaborador",
        email: user.email || "",
      });
    }
  }

  return sortEmployees(Array.from(uniqueEmployees.values()));
};

class EmployeeScheduleRepository {
  async validateEmployeeScope(
    employeeId,
    businessId,
    requesterRole,
    session = null,
  ) {
    if (requesterRole === "god") {
      return;
    }

    const membership = await Membership.findOne({
      business: businessId,
      user: employeeId,
      role: employeeRoleQuery,
      status: "active",
    }).session(session);

    if (!membership) {
      const error = new Error("Empleado no encontrado en este negocio");
      error.statusCode = 404;
      throw error;
    }
  }

  async validateBranchScope(sedeId, businessId, requesterRole, session = null) {
    if (requesterRole === "god") {
      return;
    }

    const branch = await Branch.findOne({
      _id: sedeId,
      business: businessId,
    })
      .select("_id")
      .session(session)
      .lean();

    if (!branch) {
      const error = new Error("La sede no pertenece a este negocio");
      error.statusCode = 404;
      throw error;
    }
  }

  async listByEmployee({ businessId, employeeId, requesterRole }) {
    await this.validateEmployeeScope(employeeId, businessId, requesterRole);

    const persistedSchedules = await EmployeeSchedule.find({
      ...buildScope(businessId, requesterRole),
      employeeId,
    })
      .populate("employeeId", "name email")
      .populate("sedeId", "name")
      .lean();

    const schedules = persistedSchedules.map((schedule) =>
      normalizePersistedEntry(schedule),
    );

    return sortSchedules(schedules);
  }

  async replaceEmployeeAvailability({
    businessId,
    employeeId,
    requesterRole,
    entries,
  }) {
    if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
      const error = new Error("employeeId invalido");
      error.statusCode = 400;
      throw error;
    }

    await this.validateEmployeeScope(employeeId, businessId, requesterRole);

    const normalizedEntries = (Array.isArray(entries) ? entries : []).map(
      (entry, index) => normalizeEntry(entry, index),
    );

    validateNoOverlaps(normalizedEntries);

    const uniqueBranchIds = [
      ...new Set(normalizedEntries.map((entry) => entry.sedeId)),
    ];
    for (const sedeId of uniqueBranchIds) {
      await this.validateBranchScope(sedeId, businessId, requesterRole);
    }

    const writeSchedules = async (session = null) => {
      const scope = {
        ...buildScope(businessId, requesterRole),
        employeeId,
      };

      if (session) {
        await EmployeeSchedule.deleteMany(scope).session(session);
      } else {
        await EmployeeSchedule.deleteMany(scope);
      }

      if (normalizedEntries.length === 0) {
        return [];
      }

      const docs = normalizedEntries.map((entry) => ({
        business: businessId,
        employeeId,
        sedeId: entry.sedeId,
        dayOfWeek: entry.dayOfWeek,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        status: entry.status,
      }));

      if (session) {
        await EmployeeSchedule.insertMany(docs, { session });
      } else {
        await EmployeeSchedule.insertMany(docs);
      }

      return docs;
    };

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await writeSchedules(session);
      await session.commitTransaction();
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      if (isTransactionUnsupportedError(error)) {
        await writeSchedules();
      } else {
        throw error;
      }
    } finally {
      session.endSession();
    }

    return this.listByEmployee({ businessId, employeeId, requesterRole });
  }

  async getBranchOverview({
    businessId,
    requesterRole,
    sedeId = null,
    day = null,
  }) {
    if (sedeId) {
      await this.validateBranchScope(sedeId, businessId, requesterRole);
    }

    const normalizedDay =
      day !== null && day !== undefined && String(day).trim() !== ""
        ? normalizeDayOfWeek(day)
        : null;

    if (normalizedDay === null && day !== null && day !== undefined) {
      const error = new Error("Dia invalido");
      error.statusCode = 400;
      throw error;
    }

    const filter = {
      ...buildScope(businessId, requesterRole),
      ...(sedeId ? { sedeId } : {}),
    };

    if (normalizedDay !== null) {
      const legacyDayName = DAY_NAME_BY_INDEX[normalizedDay];
      filter.$or = [{ dayOfWeek: normalizedDay }, { day: legacyDayName }];
    }

    const persistedSchedules = await EmployeeSchedule.find(filter)
      .populate("employeeId", "name email")
      .populate("sedeId", "name")
      .lean();

    const schedules = persistedSchedules.map((schedule) =>
      normalizePersistedEntry(schedule),
    );

    const sortedSchedules = sortSchedules(schedules);

    const groupedByDay = DAY_OF_WEEK_VALUES.reduce(
      (accumulator, currentDay) => {
        accumulator[currentDay] = sortedSchedules.filter(
          (schedule) => schedule.dayOfWeek === currentDay,
        );
        return accumulator;
      },
      {},
    );

    const employees = await listEmployeesForBranch({
      businessId,
      requesterRole,
      sedeId,
    });

    return {
      schedules: sortedSchedules,
      groupedByDay,
      total: sortedSchedules.length,
      employees,
    };
  }

  async checkAvailability({
    businessId,
    requesterRole,
    employeeId,
    day,
    timeRange,
  }) {
    await this.validateEmployeeScope(employeeId, businessId, requesterRole);

    return checkAvailabilitySlot(employeeId, day, timeRange, {
      businessId,
      requesterRole,
    });
  }

  async getAvailabilityBaseForCompensation({
    businessId,
    requesterRole,
    employeeId,
  }) {
    return this.listByEmployee({ businessId, requesterRole, employeeId });
  }

  async canManageEmployeeSchedule(requesterRole, requesterId, employeeId) {
    if (ADMIN_ROLES.has(requesterRole)) {
      return true;
    }

    return String(requesterId || "") === String(employeeId || "");
  }
}

export default new EmployeeScheduleRepository();
