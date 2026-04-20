import api from "../../../api/axios";
import type {
  EmployeeScheduleEntry,
  ScheduleEntryInput,
  ScheduleOverviewResponse,
} from "../types/schedule.types";

const normalizePayload = <T>(payload: unknown): T => {
  const wrapper = payload as { data?: T };
  return (wrapper?.data || payload) as T;
};

export const scheduleService = {
  async getMySchedule(): Promise<EmployeeScheduleEntry[]> {
    const response = await api.get("/schedules/me");
    return normalizePayload<EmployeeScheduleEntry[]>(response.data);
  },

  async saveAvailability(
    entries: ScheduleEntryInput[]
  ): Promise<EmployeeScheduleEntry[]> {
    const response = await api.post("/schedules/availability", { entries });
    return normalizePayload<EmployeeScheduleEntry[]>(response.data);
  },

  async saveMySchedule(
    entries: ScheduleEntryInput[]
  ): Promise<EmployeeScheduleEntry[]> {
    return scheduleService.saveAvailability(entries);
  },

  async getEmployeeSchedule(
    employeeId: string
  ): Promise<EmployeeScheduleEntry[]> {
    const response = await api.get(`/schedules/employee/${employeeId}`);
    return normalizePayload<EmployeeScheduleEntry[]>(response.data);
  },

  async saveEmployeeSchedule(
    employeeId: string,
    entries: ScheduleEntryInput[]
  ): Promise<EmployeeScheduleEntry[]> {
    const response = await api.put(`/schedules/employee/${employeeId}`, {
      entries,
    });
    return normalizePayload<EmployeeScheduleEntry[]>(response.data);
  },

  async getOverview(params?: {
    sedeId?: string;
    day?: string | number;
  }): Promise<ScheduleOverviewResponse> {
    const response = await api.get("/schedules/overview", { params });
    return normalizePayload<ScheduleOverviewResponse>(response.data);
  },
};
