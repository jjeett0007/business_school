# Business Analysis School AI Chat Support System

This project is a Node.js TypeScript backend application built using an MVC (Model-View-Controller) architecture with Express.js. It provides an AI-powered chat support system with seamless human escalation capabilities for the Business Analysis School.

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the provided `.env.sample` to `.env` and update the values:

```bash
cp .env.sample .env
```

Update the following variables in `.env`:

```env

NODE_ENV=dev
PORT=3010
SALT=10

MONGODB_USERNAME=username
MONGODB_PASSWORD=password
MONGODB_DATABASE=dbstore
MONGODB_URL=databaseurl

OPENAI_API_KEY

```

### 4. Run the Application

**Development Mode** (with auto-reload):

```bash
npm run dev
```

**Production Build**:

```bash
npm run build
npm start
```

The backend will start on http://localhost:3000.

---

## 🏗️ Architecture Overview

The application follows a layered MVC architecture for clean separation of concerns:

| Layer              | Components                                                                 | Responsibility                                                                 |
|--------------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Presentation Layer | Express routes & controllers                                              | Handle incoming HTTP requests, validate inputs, return responses.             |
| Business Logic     | Service modules (chat.service.ts, createEscalation.service.ts, etc.)      | Implement core features such as AI processing and escalation logic.           |
| Data Layer         | Mongoose models (chat.model.ts, escalation.model.ts)                      | Define schemas and handle MongoDB data persistence.                           |
| Real-time Layer    | WebSocket integration (websocket.ts)                                      | Instant message delivery and typing indicators.                               |
| AI Integration     | OpenAI GPT integration (chat.service.ts)                                  | Generate dynamic responses from a knowledge base, detect escalation cases.    |
| Utility & Middleware| Configuration, validation, error handling, email sending.                | Supportive cross-cutting concerns.                                            |

### File/Folder Highlights

- `src/server.ts` — Application entry point.
- `src/app.ts` — Express app setup, middleware, CORS, JSON parsing.
- `src/config/index.ts` — Centralized configuration with validation.
- `src/model/` — Mongoose schemas (chat sessions and escalations).
- `src/controller/` — Request handlers for chat and escalation.
- `src/service/` — Core business logic, including AI chat processing.
- `src/route/` — API routes (v1/chat, v1/escalation).
- `src/socket/websocket.ts` — WebSocket events for live chat.
- `src/lib/smtp.ts` — Email setup for human escalation notifications.
- `src/utils/` — Shared utilities (async handler, API response helpers, etc.).

This design supports scalability, maintainability, and clear feature ownership.

---

## 🤖 AI Integration Approach

The chat system integrates OpenAI GPT to handle automated student support. The integration approach:

### Knowledge Grounding

The AI is provided with a static knowledge base via the system prompt, including:

- Business Analysis programs
- Payment options
- Career outcomes

This keeps responses accurate and relevant to the school's offerings.

### Session-Aware Conversation

Each user chat session is persisted in MongoDB (ChatSession model) with all messages. This history is passed back to GPT with each new message so it maintains context and continuity.

### Fallback / Escalation Logic

If GPT is not confident or receives a query outside the predefined scope, it replies with a special trigger phrase ("Escalate to human support.").

The system then:

- Presents a contact form to the user.
- Stores escalation data (Escalation model) with user info and session reference.
- Notifies the support team via email for human follow-up.

### API Integration

The backend uses the official OpenAI Node.js SDK (`openai` package) to call the `chat.completions.create` endpoint, with typed parameters and robust error handling.

### Future-Ready

The architecture allows easy swapping of models (e.g., GPT-4 → GPT-4o → Gemini) and expansion of the knowledge base to a database-driven approach.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: OpenAI API (ChatGPT)
- **Real-time**: WebSocket (`ws` library)
- **Validation**: Joi
- **Build Tool**: Rollup

---

## ✅ Conclusion

With this setup, the system delivers fast, accurate AI support for students while guaranteeing a smooth human handoff whenever AI can't resolve a query — combining scalability, professionalism, and great user experience.