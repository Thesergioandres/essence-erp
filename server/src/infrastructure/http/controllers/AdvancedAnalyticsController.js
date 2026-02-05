import { AdvancedAnalyticsRepository } from "../../database/repositories/AdvancedAnalyticsRepository.js";

const repository = new AdvancedAnalyticsRepository();

export class AdvancedAnalyticsController {
  async getSalesSummary(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const summary = await repository.getSalesSummary(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getFinancialKPIs(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const kpis = await repository.getFinancialKPIs(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data: kpis });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSalesFunnel(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const funnel = await repository.getSalesFunnel(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data: funnel });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSalesTimeline(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate, groupBy } = req.query;
      const timeline = await repository.getSalesTimeline(
        businessId,
        startDate,
        endDate,
        groupBy || "day",
      );
      res.json({ success: true, data: timeline });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getComparativeAnalysis(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const analysis = await repository.getComparativeAnalysis(businessId);
      res.json({ success: true, data: analysis });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTopProducts(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate, limit } = req.query;
      const topProducts = await repository.getTopProducts(
        businessId,
        startDate,
        endDate,
        limit ? parseInt(limit) : 10,
      );
      res.json({ success: true, data: topProducts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDistributorPerformance(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const performance = await repository.getDistributorPerformance(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data: performance });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getInventoryStatus(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const status = await repository.getInventoryStatus(businessId);
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCreditsSummary(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const summary = await repository.getCreditsSummary(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getExpensesSummary(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const summary = await repository.getExpensesSummary(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSalesByCategory(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const data = await repository.getSalesByCategory(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProductRotation(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { days } = req.query;
      const data = await repository.getProductRotation(
        businessId,
        parseInt(days) || 30,
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDistributorRankings(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { startDate, endDate } = req.query;
      const data = await repository.getDistributorRankings(
        businessId,
        startDate,
        endDate,
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getLowStockVisual(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const data = await repository.getLowStockVisual(businessId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
