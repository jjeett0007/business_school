import express from "express";
const router = express.Router();
import {createEscalationController} from "../../controller/escalationController/index.controller";
import { escalationValidation } from "../../validation/global.validation";
import validate from "../../middleware/validate";

router.route("/").post(validate(escalationValidation), createEscalationController)

export default router;