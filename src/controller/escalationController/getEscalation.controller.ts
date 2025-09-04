import getAllEscalationService from "../../service/escalationervice/getAllEscalation.service";
import type { Request, Response } from "express";

const getAllEscalationController = catchAsync(
  async (req: Request, res: Response) => {
    const { code, message, data } = await getAllEscalationService(req.query);

    handleResponse(res, code, message, data);
  }
);


export default getAllEscalationController;