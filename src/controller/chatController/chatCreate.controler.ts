import type { Request, Response } from "express";
import chatService from "../../service/chat/chat.service";

const createChatController = catchAsync(async (req: Request, res: Response) => {
  const { sessionId, content } = req.body;

  const { code, message } = await chatService({ sessionId, content });

  handleResponse(res, code, message);
});

export default createChatController
