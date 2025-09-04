import getAllEscalationService from "../../service/escalationervice/getAllEscalation.service";
import type { Request, Response } from "express";

const getAllEscalationController = catchAsync(
  async (req: Request, res: Response) => {
    const { code, message } = await getAllEscalationService(req.query);

    handleResponse(res, code, message);
  }
);


export default getAllEscalationController;