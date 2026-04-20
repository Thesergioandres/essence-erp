import mongoose from "mongoose";

export const DAYS_OF_WEEK = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const DAY_OF_WEEK_VALUES = Object.freeze(
  DAYS_OF_WEEK.map((_, index) => index),
);

export const DAY_NAME_BY_INDEX = Object.freeze(
  DAYS_OF_WEEK.reduce((accumulator, dayName, index) => {
    accumulator[index] = dayName;
    return accumulator;
  }, {}),
);

export const DAY_INDEX_BY_NAME = Object.freeze(
  DAYS_OF_WEEK.reduce((accumulator, dayName, index) => {
    accumulator[dayName] = index;
    return accumulator;
  }, {}),
);

export const SCHEDULE_STATUSES = Object.freeze(["available", "booked"]);

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const employeeScheduleSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sedeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      enum: DAY_OF_WEEK_VALUES,
      required: true,
      index: true,
    },
    day: {
      type: String,
      enum: DAYS_OF_WEEK,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: HH_MM_PATTERN,
    },
    endTime: {
      type: String,
      required: true,
      match: HH_MM_PATTERN,
    },
    status: {
      type: String,
      enum: SCHEDULE_STATUSES,
      default: "available",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

employeeScheduleSchema.pre("validate", function setDayName(next) {
  if (typeof this.dayOfWeek === "number") {
    this.day = DAY_NAME_BY_INDEX[this.dayOfWeek];
  }

  if (!this.status) {
    this.status = "available";
  }

  next();
});

employeeScheduleSchema.index(
  {
    business: 1,
    employeeId: 1,
    dayOfWeek: 1,
    startTime: 1,
    endTime: 1,
  },
  { unique: true },
);

employeeScheduleSchema.index({
  business: 1,
  sedeId: 1,
  dayOfWeek: 1,
  startTime: 1,
});

export default mongoose.models.EmployeeSchedule ||
  mongoose.model("EmployeeSchedule", employeeScheduleSchema);
