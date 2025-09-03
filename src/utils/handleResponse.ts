import type { Response } from "express";

import statusCodeMap from "./statusCode";
import formatResponse from "./responseFormatter";

const handleResponse = (res: Response, code: number, message: string, data?: any) => {
  const statusCode = statusCodeMap[code] ?? 500;

  return res.status(statusCode).send(
    formatResponse({
      message: message,
      ...(data !== undefined ? { data } : {})
    })
  );
};

export default handleResponse;
