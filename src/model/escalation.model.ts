// src/models/escalation.model.ts
import { Schema, model, Document } from "mongoose";

export interface EscalationDocument extends Document {
  sessionId: string;     // link to the chat session
  name: string;          // user's name
  email: string;         // user's email
  message: string;      // optional extra message from the user
  status?: "open" | "in-progress" | "closed";
  createdAt?: Date;
  updatedAt?: Date;
}

const EscalationSchema = new Schema<EscalationDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

export const Escalation = model<EscalationDocument>(
  "Escalation",
  EscalationSchema
);
