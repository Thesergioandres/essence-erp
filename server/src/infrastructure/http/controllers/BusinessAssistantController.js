import crypto from "crypto";
import { getBusinessAssistantQueue } from "../../../../jobs/businessAssistant.queue.js";
import { BusinessAssistantPersistenceUseCase } from "../../../application/use-cases/repository-gateways/BusinessAssistantPersistenceUseCase.js";

const repository = new BusinessAssistantPersistenceUseCase();
const directJobs = new Map();

export class BusinessAssistantController {
  async getConfig(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const config = await repository.getOrCreateConfig(businessId);
      res.json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateConfig(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const config = await repository.updateConfig(businessId, req.body);
      res.json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async generateRecommendations(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { horizonDays, recentDays, startDate, endDate, force } = req.query;

      const result = await repository.generateRecommendations(businessId, {
        horizonDays: horizonDays ? parseInt(horizonDays) : undefined,
        recentDays: recentDays ? parseInt(recentDays) : undefined,
        startDate,
        endDate,
        force: force === "1" || force === "true",
      });

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createRecommendationsJob(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const params = req.body || {};
      const queue = getBusinessAssistantQueue();

      if (!queue) {
        const result = await repository.generateRecommendations(
          businessId,
          params,
        );
        const jobId = `direct-${crypto.randomUUID()}`;
        directJobs.set(jobId, { status: "completed", result });

        return res.json({
          success: true,
          message: "Recomendaciones generadas",
          jobId,
        });
      }

      const job = await queue.add("business-assistant", {
        businessId,
        params,
      });

      return res.json({
        success: true,
        message: "Job de recomendaciones creado",
        jobId: job.id,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRecommendationsJob(req, res) {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({ success: false, message: "Falta jobId" });
      }

      if (directJobs.has(jobId)) {
        return res.json(directJobs.get(jobId));
      }

      const queue = getBusinessAssistantQueue();
      if (!queue) {
        return res.status(404).json({
          success: false,
          message: "Job no encontrado",
        });
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job no encontrado",
        });
      }

      const state = await job.getState();
      const response = {
        status:
          state === "completed"
            ? "completed"
            : state === "failed"
              ? "failed"
              : state === "active"
                ? "processing"
                : "pending",
        progress: job.progress || 0,
        result: state === "completed" ? job.returnvalue : undefined,
        error: state === "failed" ? job.failedReason : undefined,
      };

      return res.json(response);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async askAssistant(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const { question } = req.body;
      if (!question) {
        return res
          .status(400)
          .json({ success: false, message: "Falta la pregunta" });
      }

      const response = await repository.askAssistant(businessId, question);
      res.json({ success: true, data: { answer: response } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get latest analysis - fetches real recommendations from DB
  async getLatestAnalysis(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const latest = await repository.getLatestRecommendations(businessId);

      if (!latest) {
        return res.json({
          success: true,
          data: {
            status: "pending",
            message: "No hay análisis previos. Por favor genera uno nuevo.",
            lastAnalysis: null,
            recommendations: [],
            generatedAt: null,
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...latest,
          status: "completed",
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get strategic analysis - fetches real AI SWOT analysis from DB
  async getStrategicAnalysis(req, res) {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const latest = await repository.getLatestStrategicAnalysis(businessId);

      if (!latest) {
        return res.json({
          success: true,
          data: {
            analysis: null,
            status: "pending",
            message: "Análisis estratégico pendiente. Haz clic en 'Analizar con IA' para generarlo.",
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...latest,
          status: "completed",
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Generate strategic analysis - manual trigger for AI analysis
  async handleGenerateStrategicAnalysis(req, res) {
    try {
      const businessId = req.businessId;
      const userId = req.userId; // Asumimos que el middleware de auth inyecta el userId
      
      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const result = await repository.generateStrategicAnalysis(businessId, userId);

      res.json({
        success: true,
        message: "Análisis estratégico generado exitosamente",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
