import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import EmployeeSchedule from "../../../src/infrastructure/database/models/EmployeeSchedule.js";
import "../../../src/infrastructure/database/models/User.js";
import EmployeeScheduleRepository from "../../../src/infrastructure/database/repositories/EmployeeScheduleRepository.js";
import { checkAvailability } from "../../../src/infrastructure/database/repositories/utils/checkAvailability.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("EmployeeScheduleRepository", () => {
  test("rechaza bloques solapados para el mismo empleado y dia", async () => {
    const businessId = new mongoose.Types.ObjectId().toString();
    const employeeId = new mongoose.Types.ObjectId().toString();
    const sedeId = new mongoose.Types.ObjectId().toString();

    let capturedError = null;

    try {
      await EmployeeScheduleRepository.replaceEmployeeAvailability({
        businessId,
        employeeId,
        requesterRole: "god",
        entries: [
          {
            dayOfWeek: 0,
            sedeId,
            startTime: "10:00",
            endTime: "14:00",
            status: "available",
          },
          {
            dayOfWeek: 0,
            sedeId,
            startTime: "13:00",
            endTime: "15:00",
            status: "available",
          },
        ],
      });
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeTruthy();
    expect(capturedError.statusCode).toBe(400);
    expect(capturedError.message).toContain("Solapamiento");
  });

  test("permite multiples bloques no solapados y conserva dayOfWeek/status", async () => {
    const businessId = new mongoose.Types.ObjectId().toString();
    const employeeId = new mongoose.Types.ObjectId().toString();
    const sedeId = new mongoose.Types.ObjectId().toString();

    const saved = await EmployeeScheduleRepository.replaceEmployeeAvailability({
      businessId,
      employeeId,
      requesterRole: "god",
      entries: [
        {
          dayOfWeek: 0,
          sedeId,
          startTime: "08:00",
          endTime: "10:00",
          status: "available",
        },
        {
          dayOfWeek: 0,
          sedeId,
          startTime: "14:00",
          endTime: "16:00",
          status: "available",
        },
      ],
    });

    expect(saved).toHaveLength(2);
    expect(saved[0].dayOfWeek).toBe(0);
    expect(saved[0].status).toBe("available");
    expect(saved[1].dayOfWeek).toBe(0);
    expect(saved[1].status).toBe("available");
  });
});

describe("checkAvailability utility", () => {
  test("marca no disponible si el rango cae en bloque booked o fuera de cobertura", async () => {
    const businessId = new mongoose.Types.ObjectId();
    const employeeId = new mongoose.Types.ObjectId();
    const sedeId = new mongoose.Types.ObjectId();

    await EmployeeSchedule.insertMany([
      {
        business: businessId,
        employeeId,
        sedeId,
        dayOfWeek: 0,
        startTime: "08:00",
        endTime: "12:00",
        status: "available",
      },
      {
        business: businessId,
        employeeId,
        sedeId,
        dayOfWeek: 0,
        startTime: "10:00",
        endTime: "11:00",
        status: "booked",
      },
    ]);

    const coveredSlot = await checkAvailability(
      employeeId.toString(),
      0,
      { startTime: "08:30", endTime: "09:30" },
      { businessId: businessId.toString(), requesterRole: "admin" },
    );

    const blockedSlot = await checkAvailability(
      employeeId.toString(),
      0,
      { startTime: "10:15", endTime: "10:45" },
      { businessId: businessId.toString(), requesterRole: "admin" },
    );

    const outsideSlot = await checkAvailability(
      employeeId.toString(),
      0,
      { startTime: "12:00", endTime: "13:00" },
      { businessId: businessId.toString(), requesterRole: "admin" },
    );

    expect(coveredSlot.available).toBe(true);
    expect(blockedSlot.available).toBe(false);
    expect(blockedSlot.reason).toBe("blocked_by_booked_slot");
    expect(outsideSlot.available).toBe(false);
    expect(outsideSlot.reason).toBe("outside_available_slots");
  });
});
