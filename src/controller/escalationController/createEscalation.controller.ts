import type { Request, Response } from "express";
import createEscalationService from "../../service/escalationervice/createEscalation.service";

const createEscalationController = catchAsync(async (req: Request, res: Response) => {
  // Ai taken care of this
  // const { code, message } = await createEscalationService(req.body);

  handleResponse(res, 200, "Escalation created");
});

export default createEscalationController
