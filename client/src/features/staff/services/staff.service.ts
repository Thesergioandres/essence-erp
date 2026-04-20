import type { User } from "../../auth/types/auth.types";
import { businessService } from "../../business/services";
import { employeeService } from "../../employees/services";
import type { StaffMemberRow } from "../types/staff.types";

const DEFAULT_BASE_COMMISSION = 20;

const resolveEntityId = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed && trimmed !== "[object Object]" ? trimmed : "";
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const candidate = value as {
    _id?: unknown;
    id?: unknown;
    $oid?: unknown;
  };

  return (
    resolveEntityId(candidate._id) ||
    resolveEntityId(candidate.id) ||
    resolveEntityId(candidate.$oid) ||
    ""
  );
};

const normalizeRate = (value: unknown, fallback = DEFAULT_BASE_COMMISSION) => {
  const candidate = Number(value);
  if (!Number.isFinite(candidate)) {
    return fallback;
  }

  return Math.max(0, Math.min(95, candidate));
};

const normalizeMembershipUser = (value: unknown): User | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as User;
};

const sortRows = (rows: StaffMemberRow[]) => {
  const roleRank: Record<string, number> = {
    admin: 0,
    super_admin: 0,
    employee: 1,
    viewer: 2,
  };

  return [...rows].sort((left, right) => {
    const leftRank = roleRank[left.role] ?? 99;
    const rightRank = roleRank[right.role] ?? 99;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.name.localeCompare(right.name, "es", {
      sensitivity: "base",
    });
  });
};

export const staffService = {
  async getUnifiedStaff(businessId: string): Promise<StaffMemberRow[]> {
    const [membersResponse, employeesResponse] = await Promise.all([
      businessService.listMembers(businessId),
      employeeService.getAll({ limit: 500 }),
    ]);

    const rowsByEmployeeId = new Map<string, StaffMemberRow>();

    for (const member of membersResponse.members || []) {
      const membershipUser = normalizeMembershipUser(member.user);
      const employeeId = resolveEntityId(membershipUser?._id || member.user);

      if (!employeeId) {
        continue;
      }

      rowsByEmployeeId.set(employeeId, {
        membershipId: member._id || null,
        employeeId,
        name: membershipUser?.name || "Sin nombre",
        email: membershipUser?.email || "",
        role: String(member.role || membershipUser?.role || "employee"),
        status: String(member.status || membershipUser?.status || "active"),
        active: membershipUser?.active !== false,
        phone: membershipUser?.phone,
        baseCommissionPercentage: normalizeRate(
          membershipUser?.baseCommissionPercentage
        ),
        fixedCommissionOnly: Boolean(membershipUser?.fixedCommissionOnly),
        isCommissionFixed: Boolean(membershipUser?.isCommissionFixed),
        customCommissionRate:
          membershipUser?.customCommissionRate === null ||
          membershipUser?.customCommissionRate === undefined
            ? null
            : normalizeRate(membershipUser.customCommissionRate, 0),
        permissions: member.permissions,
        source: "team",
        rawUser: membershipUser || undefined,
      });
    }

    for (const employee of employeesResponse.data || []) {
      const employeeId = resolveEntityId(employee?._id);

      if (!employeeId) {
        continue;
      }

      const existing = rowsByEmployeeId.get(employeeId);

      if (existing) {
        rowsByEmployeeId.set(employeeId, {
          ...existing,
          name: employee.name || existing.name,
          email: employee.email || existing.email,
          phone: employee.phone || existing.phone,
          active: employee.active !== false,
          status: employee.status || existing.status,
          baseCommissionPercentage: normalizeRate(
            employee.baseCommissionPercentage,
            existing.baseCommissionPercentage
          ),
          fixedCommissionOnly: Boolean(
            employee.fixedCommissionOnly ?? existing.fixedCommissionOnly
          ),
          isCommissionFixed: Boolean(
            employee.isCommissionFixed ?? existing.isCommissionFixed
          ),
          customCommissionRate:
            employee.customCommissionRate === null ||
            employee.customCommissionRate === undefined
              ? existing.customCommissionRate
              : normalizeRate(employee.customCommissionRate, 0),
          source: "merged",
          rawUser: employee,
        });
        continue;
      }

      rowsByEmployeeId.set(employeeId, {
        membershipId: null,
        employeeId,
        name: employee.name || "Sin nombre",
        email: employee.email || "",
        role: String(employee.role || "employee"),
        status: String(employee.status || "active"),
        active: employee.active !== false,
        phone: employee.phone,
        baseCommissionPercentage: normalizeRate(
          employee.baseCommissionPercentage
        ),
        fixedCommissionOnly: Boolean(employee.fixedCommissionOnly),
        isCommissionFixed: Boolean(employee.isCommissionFixed),
        customCommissionRate:
          employee.customCommissionRate === null ||
          employee.customCommissionRate === undefined
            ? null
            : normalizeRate(employee.customCommissionRate, 0),
        source: "employees",
        rawUser: employee,
      });
    }

    return sortRows(Array.from(rowsByEmployeeId.values()));
  },

  async updateBaseCommissionPercentage(
    employeeId: string,
    baseCommissionPercentage: number
  ): Promise<number> {
    const payload = await employeeService.updateBaseCommissionPercentage(
      employeeId,
      baseCommissionPercentage
    );

    return normalizeRate(payload.baseCommissionPercentage);
  },
};
