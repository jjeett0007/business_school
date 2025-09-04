import express from "express";
const router = express.Router();
import { getChatSessionByIdController, createChatController } from "../../controller/chatController/index.controller";
import { chatCreateValidation, sessionIdParamsValidation } from "../../validation/global.validation";
import validate from "../../middleware/validate";

router.route("/").post(validate(chatCreateValidation), createChatController)

router.route("/:sessionId").get(validate(sessionIdParamsValidation), getChatSessionByIdController);

export default router;
