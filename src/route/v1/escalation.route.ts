import express from "express";
const router = express.Router();
import {
  createEscalationController,
  getAllEscalationController,
} from "../../controller/escalationController/index.controller";
import { escalationValidation } from "../../validation/global.validation";
import validate from "../../middleware/validate";

router
  .route("/")
  .post(validate(escalationValidation), createEscalationController)
  .get(getAllEscalationController);

export default router;
