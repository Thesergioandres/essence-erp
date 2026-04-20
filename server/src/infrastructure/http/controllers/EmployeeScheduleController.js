import employeeSchedulePersistenceUseCase from "../../../application/use-cases/repository-gateways/EmployeeSchedulePersistenceUseCase.js";

const resolveEntries = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.entries)) {
    return payload.entries;
  }

  return [];
};

class EmployeeScheduleController {
  async getMySchedule(req, res) {
    try {
      const data = await employeeSchedulePersistenceUseCase.listByEmployee({
        businessId: req.businessId,
        employeeId: req.user?.id,
        requesterRole: req.user?.role,
      });

      return res.json({ success: true, data });
    } catch (error) {
      const status = error.statusCode || 500;
      return res
        .status(status)
        .json({ success: false, message: error.message });
    }
  }

  async saveMySchedule(req, res) {
    try {
      const entries = resolveEntries(req.body);

      const data =
        await employeeSchedulePersistenceUseCase.replaceEmployeeAvailability({
          businessId: req.businessId,
          employeeId: req.user?.id,
          requesterRole: req.user?.role,
          entries,
        });

      return res.json({ success: true, data });
    } catch (error) {
      const status = error.statusCode || 500;
      return res
        .status(status)
        .json({ success: false, message: error.message });
    }
  }

  async saveMyAvailability(req, res) {
    return this.saveMySchedule(req, res);
  }

  async getEmployeeSchedule(req, res) {
    try {
      const data = await employeeSchedulePersistenceUseCase.listByEmployee({
        businessId: req.businessId,
        employeeId: req.params.employeeId,
        requesterRole: req.user?.role,
      });

      return res.json({ success: true, data });
    } catch (error) {
      const status = error.statusCode || 500;
      return res
        .status(status)
        .json({ success: false, message: error.message });
    }
  }

  async saveEmployeeSchedule(req, res) {
    try {
      const entries = resolveEntries(req.body);

      const data =
        await employeeSchedulePersistenceUseCase.replaceEmployeeAvailability({
          businessId: req.businessId,
          employeeId: req.params.employeeId,
          requesterRole: req.user?.role,
          entries,
        });

      return res.json({ success: true, data });
    } catch (error) {
      const status = error.statusCode || 500;
      return res
        .status(status)
        .json({ success: false, message: error.message });
    }
  }

  async getBranchOverview(req, res) {
    try {
      const { sedeId, day } = req.query;
      const data = await employeeSchedulePersistenceUseCase.getBranchOverview({
        businessId: req.businessId,
        requesterRole: req.user?.role,
        sedeId: sedeId ? String(sedeId) : null,
        day: day ? String(day) : null,
      });

      return res.json({ success: true, data });
    } catch (error) {
      const status = error.statusCode || 500;
      return res
        .status(status)
        .json({ success: false, message: error.message });
    }
  }
}

export default new EmployeeScheduleController();
