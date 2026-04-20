import mongoose from "mongoose";
import EmployeeSchedule, {
  DAY_INDEX_BY_NAME,
  DAY_NAME_BY_INDEX,
  SCHEDULE_STATUSES,
} from "../../models/EmployeeSchedule.js";

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (value) => {
  const match = String(value || "")
    .trim()
    .match(HH_MM_PATTERN);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
};

const normalizeDayOfWeek = (day) => {
  if (Number.isInteger(day) && day >= 0 && day <= 6) {
    return day;
  }

  const asText = String(day || "")
    .trim()
    .toLowerCase();

  if (asText in DAY_INDEX_BY_NAME) {
    return DAY_INDEX_BY_NAME[asText];
  }

  if (/^[0-6]$/.test(asText)) {
    return Number(asText);
  }

  return null;
};

const normalizeTimeRange = (timeRange) => {
  const startTime = String(timeRange?.startTime || "").trim();
  const endTime = String(timeRange?.endTime || "").trim();

  if (!HH_MM_PATTERN.test(startTime) || !HH_MM_PATTERN.test(endTime)) {
    const error = new Error("Rango horario invalido. Usa formato HH:mm");
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
      "Rango horario invalido. startTime debe ser menor que endTime",
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    startTime,
    endTime,
    startMinutes,
    endMinutes,
  };
};

const hasOverlap = (leftStart, leftEnd, rightStart, rightEnd) =>
  leftStart < rightEnd && rightStart < leftEnd;

const buildScope = (businessId, requesterRole) => {
  if (requesterRole === "god") {
    return {};
  }

  return { business: businessId };
};

export const checkAvailability = async (
  employeeId,
  day,
  timeRange,
  options = {},
) => {
  if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
    const error = new Error("employeeId invalido");
    error.statusCode = 400;
    throw error;
  }

  const dayOfWeek = normalizeDayOfWeek(day);
  if (dayOfWeek === null) {
    const error = new Error("Dia invalido");
    error.statusCode = 400;
    throw error;
  }

  const { startTime, endTime, startMinutes, endMinutes } =
    normalizeTimeRange(timeRange);

  const requesterRole = String(options.requesterRole || "").toLowerCase();
  const legacyDayName = DAY_NAME_BY_INDEX[dayOfWeek];

  const schedules = await EmployeeSchedule.find({
    ...buildScope(options.businessId, requesterRole),
    employeeId,
    $or: [{ dayOfWeek }, { day: legacyDayName }],
  })
    .select("startTime endTime status")
    .lean();

  let coveredByAvailability = false;
  let blockedByBooked = false;

  for (const block of schedules) {
    const blockStart = toMinutes(block.startTime);
    const blockEnd = toMinutes(block.endTime);

    if (blockStart === null || blockEnd === null) {
      continue;
    }

    const status = SCHEDULE_STATUSES.includes(block.status)
      ? block.status
      : "available";

    if (
      status === "booked" &&
      hasOverlap(startMinutes, endMinutes, blockStart, blockEnd)
    ) {
      blockedByBooked = true;
    }

    if (
      status === "available" &&
      blockStart <= startMinutes &&
      blockEnd >= endMinutes
    ) {
      coveredByAvailability = true;
    }
  }

  if (blockedByBooked) {
    return {
      available: false,
      reason: "blocked_by_booked_slot",
      dayOfWeek,
      startTime,
      endTime,
    };
  }

  if (!coveredByAvailability) {
    return {
      available: false,
      reason: "outside_available_slots",
      dayOfWeek,
      startTime,
      endTime,
    };
  }

  return {
    available: true,
    reason: null,
    dayOfWeek,
    startTime,
    endTime,
  };
};

export default checkAvailability;
