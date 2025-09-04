import { Document } from "mongoose";

export interface responseData {
  code: number;
  message: string;
  data?: any;
  error?: any;
}
