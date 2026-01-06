import { Worker } from "bullmq";
import { getRedisClient } from "../config/redis.js";
import { generateBusinessAssistantRecommendations } from "../controllers/businessAssistant.controller.js";
import {
  logWorkerError,
  logWorkerJobFinished,
  logWorkerJobStarted,
} from "../utils/logger.js";

let worker;

const getConnection = () => {
  if (!process.env.REDIS_URL) return null;
  return process.env.REDIS_URL;
};

export const startBusinessAssistantWorker = () => {
  if (worker) return worker;

  const connection = getConnection();
  if (!connection) return null;

  worker = new Worker(
    "business-assistant",
    async (job) => {
      const { params, businessId } = job.data || {};

      logWorkerJobStarted({
        jobName: "business-assistant",
        jobId: job.id,
        businessId,
      });

      try {
        const result = await generateBusinessAssistantRecommendations({
          businessId,
          ...params,
          redis: getRedisClient(),
          bypassCache: true,
        });

        logWorkerJobFinished({
          jobName: "business-assistant",
          jobId: job.id,
          businessId,
          success: true,
        });

        return result;
      } catch (error) {
        logWorkerError({
          jobName: "business-assistant",
          jobId: job.id,
          businessId,
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    logWorkerError({
      jobName: "business-assistant",
      jobId: job?.id,
      message: err?.message || "Job failed",
      stack: err?.stack,
    });
  });

  worker.on("completed", (job) => {
    logWorkerJobFinished({
      jobName: "business-assistant",
      jobId: job?.id,
      success: true,
    });
  });

  return worker;
};
