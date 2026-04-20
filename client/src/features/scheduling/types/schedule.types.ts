export type ScheduleDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleStatus = "available" | "booked";

export interface ScheduleEntryInput {
  sedeId: string;
  dayOfWeek: ScheduleDayOfWeek;
  startTime: string;
  endTime: string;
  status?: ScheduleStatus;
}

export interface ScheduleEmployeeRef {
  _id: string;
  name: string;
  email?: string;
}

export interface ScheduleBranchRef {
  _id: string;
  name: string;
}

export interface EmployeeScheduleEntry {
  _id: string;
  employeeId: ScheduleEmployeeRef | string;
  sedeId: ScheduleBranchRef | string;
  dayOfWeek: ScheduleDayOfWeek;
  day?: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleOverviewEmployee {
  _id: string;
  name: string;
  email?: string;
}

export interface ScheduleOverviewResponse {
  schedules: EmployeeScheduleEntry[];
  groupedByDay: Record<string, EmployeeScheduleEntry[]>;
  total: number;
  employees?: ScheduleOverviewEmployee[];
}
