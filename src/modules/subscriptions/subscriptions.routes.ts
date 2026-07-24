import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate, zodValidateQuery } from "../../../framework/middleware/zodValidate.js";
import {
  createSubscriptionDemandSchema,
  processSubscriptionDemandSchema,
  listSubscriptionDemandsSchema,
  listSubscriptionsSchema,
} from "./subscriptions.validator.js";

const router = Router();

// --- Subscription Demands ---

router.post(
  "/demands",
  verifyAccessToken,
  zodValidate(createSubscriptionDemandSchema),
  subscriptionsController.createDemand,
);

router.get(
  "/demands",
  verifyAccessToken,
  checkPermission("subscriptions.view"),
  zodValidateQuery(listSubscriptionDemandsSchema),
  subscriptionsController.listDemands,
);

router.patch(
  "/demands/:id",
  verifyAccessToken,
  checkPermission("subscriptions.approve"),
  zodValidate(processSubscriptionDemandSchema),
  subscriptionsController.processDemand,
);

// --- Subscriptions ---

router.get(
  "/current",
  verifyAccessToken,
  subscriptionsController.getCurrent,
);

router.get(
  "/",
  verifyAccessToken,
  checkPermission("subscriptions.view"),
  zodValidateQuery(listSubscriptionsSchema),
  subscriptionsController.listSubscriptions,
);

export default router;
