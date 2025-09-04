import { Escalation, ChatSession } from "../../model";

const getEscalationBySessionIdService = async (sessionId: string) => {
  try {
    const escalation = await Escalation.findOne({ sessionId });
    if (!escalation) {
      return {
        code: 404,
        message: "No escalation found for this session",
        data: null,
      };
    }

    const session = await ChatSession.findOne({ sessionId: escalation.sessionId });

    return {
      code: 200,
      message: "Escalation found",
      data: { escalation, session },
    };
  } catch (error) {
    throw error;
  }
};

export default getEscalationBySessionIdService
