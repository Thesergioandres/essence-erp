import { NotificationPersistenceUseCase } from "../repository-gateways/NotificationPersistenceUseCase.js";
import GetNotificationHistoryUseCase from "./GetNotificationHistoryUseCase.js";
import GetPendingNotificationsUseCase from "./GetPendingNotificationsUseCase.js";
import MarkAllAsViewedUseCase from "./MarkAllAsViewedUseCase.js";
import MarkAsViewedUseCase from "./MarkAsViewedUseCase.js";
import SendNotificationUseCase from "./SendNotificationUseCase.js";

const notificationRepository = new NotificationPersistenceUseCase();

export const notificationUseCases = {
  sendNotificationUseCase: new SendNotificationUseCase(notificationRepository),
  getPendingNotificationsUseCase: new GetPendingNotificationsUseCase(
    notificationRepository,
  ),
  markAllAsViewedUseCase: new MarkAllAsViewedUseCase(notificationRepository),
  markAsViewedUseCase: new MarkAsViewedUseCase(notificationRepository),
  getNotificationHistoryUseCase: new GetNotificationHistoryUseCase(
    notificationRepository,
  ),
};

export default notificationUseCases;
