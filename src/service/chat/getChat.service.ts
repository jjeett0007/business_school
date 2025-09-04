import { ChatSession, type ChatSessionDocument } from "../../model";

const getChatHistory = async (sessionId: string, query: any) => {
  try {
    const chatHistory = await ChatSession.findOne({ sessionId });
    if (!chatHistory) {
      return {
        code: 404,
        message: "Chat session not found",
        data: null,
      };
    }

    return {
      code: 200,
      message: "Chat session found",
      data: chatHistory,
    };
  } catch (error) {
    throw error;
  }
};

export default getChatHistory;