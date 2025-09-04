import express from "express";
const router = express.Router();
import {
  createEscalationController,
  getAllEscalationController,
  getEscaltionBySessionIdController
} from "../../controller/escalationController/index.controller";
import { escalationValidation, sessionIdParamsValidation } from "../../validation/global.validation";
import validate from "../../middleware/validate";

router
  .route("/")
  .post(validate(escalationValidation), createEscalationController)
  .get(getAllEscalationController);

  router.route("/:sessionId").get(validate(sessionIdParamsValidation), getEscaltionBySessionIdController);

export default router;
