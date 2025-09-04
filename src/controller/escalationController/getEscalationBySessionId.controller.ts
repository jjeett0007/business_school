import getEscalationBySessionIdService from "../../service/escalationervice/getEscalationBySessionId.service";
import type { Request, Response } from "express";

const getEscaltionBySessionIdController = catchAsync(
  async (req: Request, res: Response) => {
    const {sessionId} = req.params

    if (!sessionId) {
      return handleResponse(res, 400, "Session ID is required");
    }

    const { code, message, data } = await getEscalationBySessionIdService(sessionId);

    handleResponse(res, code, message, data);
  }
);


export default getEscaltionBySessionIdController;