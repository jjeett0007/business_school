// src/models/chat.model.ts
import { Schema, model, Document } from "mongoose";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

export interface ChatSessionDocument extends Document {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Define a schema for chat messages
const ChatMessageSchema = new Schema<ChatMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

// Define a schema for chat sessions
const ChatSessionSchema = new Schema<ChatSessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const ChatSession = model<ChatSessionDocument>(
  "ChatSession",
  ChatSessionSchema
);
