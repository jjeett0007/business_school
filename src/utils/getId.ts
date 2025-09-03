import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { config } from "../config";

const jwtSecret = config.jwt.secret;

const getId = async (req: any, res: any) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, jwtSecret) as any;
    const userId = decodedToken.id;

    if (!userId) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: "Invalid User",
      });
    } else {
      return userId;
    }
  } catch (error) {
    return "";
  }
};

export default getId;
