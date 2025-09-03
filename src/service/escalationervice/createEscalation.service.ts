import { Escalation, type EscalationDocument } from "../../model";

const createEscalationService = async (data: EscalationDocument) => {
  try {
    const existingEscalation = await Escalation.findOne({
      sessionId: data.sessionId,
    });
    if (existingEscalation) {
      return {
        code: 400,
        message: "An escalation for this session already exists",
      };
    }
    await Escalation.create(data);
    return {
      code: 200,
      message: "successfully escalated the chat",
    };
  } catch (error) {
    throw error;
  }
};

export default createEscalationService;
