// src/services/chat.service.ts
import OpenAI from "openai";
import { ChatSession, type ChatSessionDocument } from "../../model";
import { config } from "../../config";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index";

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
You are Coursly, a warm, friendly, empathetic support assistant for Business Analysis School.

All of your responses must be valid JSON objects with exactly two fields:
- "reply": string
- "needsEscalation": boolean

If the user explicitly asks to speak with a human, agent, representative, or real person, 
always return JSON with "needsEscalation": true, and craft a "reply" asking the user to fill out
their name, email, and message to the human advisor. You can phrase this in diverse natural ways,
so it does not repeat the same English sentence every time, but it must clearly request these fields.

All responses must be valid JSON objects with exactly two fields:
- "reply": string
- "needsEscalation": boolean

If the user intends to speak with a human advisor, agent, or representative (regardless of how they phrase it), 
always set "needsEscalation": true. Craft the "reply" naturally to ask the user for their name, email, and message for the human advisor. 
You can vary the wording every time, but the meaning should be clear.

For other questions, answer using only the data available through the tools.

Never output anything that is not a valid JSON object.

+ finally if in same conversation user still request to speak to a representative, human assistant, officials, support team, let "needEscalation" be "true" always or tell them 
+ if they havent filled the previous form filled they should do so, or tell them the support team has receive their message and will get back to you as soon as possible
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
        "Escalates the conversation to a human advisor when the user explicitly requests it.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Optional reason why the user requested escalation.",
          },
        },
        required: ["reply", "needsEscalation"],
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
];

// tool function: handle escalation request

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

  escalateToHuman: () => ({
    reply:
      "You requested to speak to a human advisor. Escalating this conversation now.",
    needsEscalation: true,
  }),

  askUserName: () => ({
    reply: "Hi there! Before we get started, may I know your name?",
    needsEscalation: false,
  }),
};

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const chatService = async (data: ChatServiceData) => {
  const { sessionId, content } = data;

  try {
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

       
        // Run the tool on the backend
        const result = (toolData as any)[fnName] ?? { error: "Unknown tool" };

        // 3. Send follow-up completion with tool result
        const followUpMessages: ChatCompletionMessageParam[] = [
          ...gptMessages,
          {
            role: "assistant",
            tool_call_id: toolCall.id,
            name: fnName,
            content: JSON.stringify(result),
          } as any, // cast because TS doesn't know 'tool' role yet
        ];

        console.log(followUpMessages);

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
        replyData = JSON.parse(
          (message.tool_calls[0] as any).function.arguments
        );
      } catch {
        replyData = {
          reply: "Error parsing tool call.",
          needsEscalation: true,
        };
      }
    }

    // 5. Save assistant reply
    await sessions.updateSession(session, "assistant", replyData.reply);

    return {
      code: 200,
      message: "Chat processed successfully",
      data: replyData,
    };
  } catch (error: any) {
    throw new Error(`Chat service error: ${error.message}`);
  }
};

export default chatService;
