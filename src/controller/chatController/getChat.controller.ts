import type { Request, Response } from "express";

import getChatHistory from "../../service/chat/getChat.service"

const getChatSessionByIdController = catchAsync(async (req: Request, res: Response) => {
  const {sessionId} = req.params;

  if (!sessionId) {
    return handleResponse(res, 400, "Session ID is required", null);
  }

  const { code, message, data } = await getChatHistory(sessionId, req.query);

  handleResponse(res, code, message, data);
});

export default getChatSessionByIdController
