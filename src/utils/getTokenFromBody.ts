import jwt from "jsonwebtoken";
import { config } from "../config";

const jwtSecret = config.jwt.secret;

const getIdFromString = async (token: string) => {
  try {
    const decodedToken = jwt.verify(token, jwtSecret) as any;
    const userId = decodedToken.id;

    if (!userId) {
      return null;
    } else {
      return userId;
    }
  } catch (error) {
    return error;
  }
};

export default getIdFromString;
