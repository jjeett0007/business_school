import type { Request, Response } from "express";
import createEscalationService from "../../service/escalationervice/createEscalation.service";

const createEscalationController = catchAsync(async (req: Request, res: Response) => {
  const { code, message } = await createEscalationService(req.body);

  handleResponse(res, code, message);
});

export default createEscalationController
