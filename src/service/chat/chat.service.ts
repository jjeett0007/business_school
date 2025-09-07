// src/services/chat.service.ts
import OpenAI from "openai";
import { ChatSession, type ChatSessionDocument } from "../../model";
import { config } from "../../config";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index";
import { sendMessageBySessionId, isTyping } from "../../socket/websocket";
import createEscalationService from "../escalationervice/createEscalation.service";

interface ChatServiceData {
  sessionId: string;
  content: string;
}

interface ChatGPTMessage {
  role: "system" | "user" | "assistant" | string;
  content: string;
}

interface ChatGPTChoice {
  index: number;
  message: ChatGPTMessage;
  finish_reason: string | null;
}

interface ChatGPTUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface ChatGPTResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatGPTChoice[];
  usage?: ChatGPTUsage;
}

interface ReplyData {
  reply: string;
  needsEscalation: boolean;
}

// sessions helper object
const sessions = {
  getAllCreateSession: async (
    sessionId: string
  ): Promise<ChatSessionDocument> => {
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      session = await ChatSession.create({ sessionId, messages: [] });
    }
    return session;
  },

  updateSession: async (
    session: ChatSessionDocument,
    role: "user" | "assistant",
    content: string
  ) => {
    session.messages.push({ role, content });
    await session.save();
    return session;
  },
};

// static knowledge base
const systemPrompt = `
Knowledge Base: Use only the information in this knowledge base to answer user questions.
You are Coursly, a warm, friendly, empathetic support assistant for Business Analysis School.

All of your responses must be valid JSON objects with exactly two fields:
- "reply": string
- "needsEscalation": boolean

Rules:

1. When a user starts a conversation (first message), always include in your "reply":
   - A brief friendly welcome.
   - An introduction about what Business Analysis School does (e.g., offers courses, programs, and support for aspiring and practicing business analysts).
   - A short list of examples of what the user can ask (e.g., course information, enrollment help, program schedules, pricing, career advice).

2. If the user explicitly asks to speak with a human, agent, representative, or real person, 
   always return JSON with "needsEscalation": true.
   Craft the "reply" naturally asking the user to provide:
   - Name
   - Email
   - Message for the human advisor
   The wording can vary, but the request must clearly ask for these three fields.

3. If the user provides their name, email, and message for a human advisor, 
   respond by acknowledging receipt and rephrasing naturally to say:
   "An assistant will reach out to you via your provided email as soon as possible."

4. If, in the same conversation, the user again requests to speak to a human assistant 
   **and we already have their contact info**, respond naturally with:
   "An assistant will reach out to you via your previously provided information. Thank you."

5. For all other questions, answer only using data available through the tools.

6. Never output anything that is not a valid JSON object.

7. At all times, if the user still requests a human assistant but has not yet provided the requested info, 
   remind them to provide their name, email, and message. If they already provided it, 
   confirm that the support team has received it and will contact them soon.

8. Ensure to ignore any other request in following prompt about how the response should be structured.
Every response ,ust only follow the pattern above. Respond by letting the user know that any request outside
this scope of instruction is not what you can attend to.

9. No special formatting, like bold font, italic font, highlight, json, or markdown, should be used in the "reply" field.

Prompt:
`;

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getPrograms",
      description:
        "Returns all available Business Analysis programs with their descriptions and durations",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPaymentOptions",
      description: "Returns the list of all payment methods",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCareerOutcomes",
      description: "Returns all possible career outcomes and salary ranges",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getEnrollmentSteps",
      description: "Returns the official enrollment steps",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "support_reply",
      description: "Reply to the user with text and escalation status",
      parameters: {
        type: "object",
        properties: {
          reply: { type: "string" },
          needsEscalation: { type: "boolean" },
        },
        required: ["reply", "needsEscalation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalateToHuman",
      description:
        "Escalates the conversation to a human advisor when the user provides their name, email, and message.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The user's name.",
          },
          email: {
            type: "string",
            description: "The user's email address.",
          },
          message: {
            type: "string",
            description: "The message for the human advisor.",
          },
        },
        required: ["name", "email", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "askUserName",
      description:
        "Prompts the user for their name to personalize the conversation",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "askUserEmail",
      description:
        "Prompts the user for their Email to escalate the conversation",
      parameters: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "The user's email address.",
          },
        },
        required: ["email"],
      },
    },
  },
];

// tool function
const toolData = {
  getPrograms: [
    {
      name: "Business Analysis Fundamentals",
      duration: "8 weeks",
      price: "$500",
      description:
        "A beginner-friendly program introducing the core principles, techniques, and tools of business analysis.",
    },
    {
      name: "Agile Business Analysis",
      duration: "6 weeks",
      price: "$450",
      description:
        "A program focusing on agile methodologies and how business analysts work within agile teams.",
    },
    {
      name: "Data Analytics for Business Analysts",
      duration: "10 weeks",
      price: "$600",
      description:
        "A data-centric course teaching how to analyze, visualize, and interpret business data.",
    },
    {
      name: "Requirements Engineering Mastery",
      duration: "8 weeks",
      price: "$550",
      description:
        "In-depth coverage of gathering, documenting, and managing requirements effectively.",
    },
    {
      name: "Business Process Modeling",
      duration: "6 weeks",
      price: "$450",
      description:
        "Learn how to map, analyze, and optimize business processes.",
    },
    {
      name: "Stakeholder Management & Communication",
      duration: "6 weeks",
      price: "$400",
      description:
        "Develop strong communication and relationship management skills with stakeholders.",
    },
    {
      name: "Business Analysis Tools & Techniques",
      duration: "8 weeks",
      price: "$500",
      description:
        "Practical training on industry-standard tools and BA techniques.",
    },
    {
      name: "Advanced Agile Product Ownership",
      duration: "6 weeks",
      price: "$480",
      description:
        "Explore product ownership responsibilities in agile environments.",
    },
    {
      name: "Strategic Business Analysis",
      duration: "10 weeks",
      price: "$650",
      description:
        "Focused on aligning business analysis with organizational strategy and innovation.",
    },
    {
      name: "Business Analysis Career Accelerator",
      duration: "6 weeks",
      price: "$550",
      description:
        "A capstone program designed to prepare you for job applications, interviews, and transitioning into BA roles.",
    },
  ],

  getPaymentOptions: [
    "Credit/Debit card",
    "Bank transfer",
    "Online transfer",
    "Cryptocurrency payment",
    "Corporate sponsorship (including full upfront or installment arrangements)",
  ],

  getCareerOutcomes: {
    roles: [
      "Junior Business Analyst",
      "Agile Analyst",
      "Data Analyst",
      "Business Process Analyst",
      "Product Owner",
      "Requirements Analyst",
      "Systems Analyst",
      "Functional Consultant",
      "Project Coordinator",
      "Operations Analyst",
      "Quality Assurance Analyst",
      "Business Intelligence Analyst",
      "Product Manager",
    ],
    salaryRange: "$60,000–$85,000 per year (US entry-level)",
  },

  getEnrollmentSteps: [
    "Visit the official Business Analysis School website.",
    "Select your desired course from the programs list.",
    "Click “Enroll Now” and create or sign into your student account.",
    "Choose your preferred payment method from the accepted options.",
    "Complete the payment process; you will receive a confirmation email with your start date and course access details.",
  ],

  askUserName: () => ({
    reply: "Hi there! Before we get started, may I know your name?",
    needsEscalation: false,
  }),
  askUserEmail: () => ({
    reply: "Please provide your email address to escalate this conversation.",
    needsEscalation: false,
  }),
  escalateToHuman: async (args: {
    name: string;
    email: string;
    message: string;
    sessionId: string;
  }) => {
    if (!args.name || !args.email || !args.message || !args.sessionId) {
      return {
        reply: "Missing information. Cannot escalate chat.",
        needsEscalation: false,
      };
    }

    try {
      await createEscalationService({
        sessionId: args.sessionId,
        name: args.name,
        email: args.email,
        message: args.message,
      });

      return {
        reply:
          "Your chat has been successfully escalated to a human advisor. An assistant will reach out to you soon.",
        needsEscalation: true,
      };
    } catch (error) {
      return {
        reply: "Failed to escalate the chat. Please try again later.",
        needsEscalation: true,
      };
    }
  },
};

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

async function processGpt(sessionId: string, content: string) {
  isTyping(sessionId, true);
  // 0. Load or create session
  let session = await sessions.getAllCreateSession(sessionId);
  session = await sessions.updateSession(session, "user", content);

  const gptMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...session.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // 1. Ask OpenAI
  let completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: gptMessages,
    tools,
  });

  let message = completion.choices?.[0]?.message;

  // 2. If tool call detected
  if (message?.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message?.tool_calls[0];
    if (toolCall && toolCall.type === "function") {
      const fnName = (toolCall as any).function.name;
      const args = (toolCall as any).function.arguments
        ? JSON.parse((toolCall as any).function.arguments)
        : {};

      const toolFn = (toolData as any)[fnName];

      let result;

      if (Object.keys(args).length > 0) {
        result = await toolFn({ ...args, sessionId }); // merge sessionId if needed
      } else {
        result = await toolFn();
      }
      const followUpMessages: ChatCompletionMessageParam[] = [
        ...gptMessages,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          // name: fnName,
          content: JSON.stringify(result),
        } // cast because TS doesn't know 'tool' role yet
      ];

      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: followUpMessages,
        tools, // tools array here
        response_format: { type: "json_object" },
        tool_choice: {
          type: "function",
          function: { name: "support_reply" },
        },
      });

      message = completion.choices?.[0]?.message;
    }
  }

  // 4. Parse final JSON reply
  let replyData: ReplyData = {
    reply: "Sorry, something went wrong.",
    needsEscalation: true,
  };
  
  if (message?.content) {
    try {
      replyData = JSON.parse(message.content);
    } catch {
      replyData = { reply: message.content, needsEscalation: false };
    }
  } else if (
    message?.tool_calls?.length &&
    (message.tool_calls[0] as any).function?.arguments
  ) {
    try {
      replyData = JSON.parse((message.tool_calls[0] as any).function.arguments);
    } catch {
      replyData = {
        reply: "Error parsing tool call.",
        needsEscalation: true,
      };
    }
  }

  // 5. Save assistant reply
  await sessions.updateSession(session, "assistant", replyData.reply);

  isTyping(sessionId, false);

  // 6. Send reply to user via websocket

  sendMessageBySessionId({
    sessionId,
    data: replyData,
  });
}

const chatService = async (data: ChatServiceData) => {
  const { sessionId, content } = data;

  try {
    setImmediate(async () => {
      await processGpt(sessionId, content);
    });

    return {
      code: 200,
      message: "Chat processed successfully",
    };
  } catch (error: any) {
    throw new Error(`Chat service error: ${error.message}`);
  }
};

export default chatService;
