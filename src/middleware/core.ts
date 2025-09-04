import type { Request, Response, NextFunction } from "express";


const verifyAPI = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { version } = req.params;

    if (version == "v1") {
      next();
      return;
    }

    return res
      .status(401)
      .json({
        success: false,
        error: `Invalid API version v${version}, Refer to the Documentation for more information.`,
      });
  } catch (error) {
    onAPIinvalid(req, res);
  }
};

const APIVerified = (req: Request, res: Response) => {
  return res
    .status(200)
    .json({
      success: true,
      message: "Welcome 🚀",
    });
};

const onAPIinvalid = (req: Request, res: Response) => {
  return res
    .status(401)
    .json({
      success: false,
      error: `Invalid use of API, Refer to the Documentation for more information.`,
    });
};

export { verifyAPI, onAPIinvalid, APIVerified };
