export type ScheduleDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ScheduleEntryInput {
  sedeId: string;
  day: ScheduleDay;
  startTime: string;
  endTime: string;
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
  day: ScheduleDay;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleOverviewResponse {
  schedules: EmployeeScheduleEntry[];
  groupedByDay: Record<ScheduleDay, EmployeeScheduleEntry[]>;
  total: number;
}
