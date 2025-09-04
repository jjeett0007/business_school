# Business Analysis School AI Chat Support System

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

This project is a Node.js TypeScript backend application built using an MVC (Model-View-Controller) architecture with Express.js. It provides an AI-powered chat support system with seamless human escalation capabilities for the Business Analysis School.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Architecture Overview](#architecture-overview)
- [AI Integration Approach](#ai-integration-approach)
- [Technology Stack](#technology-stack)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Conclusion](#conclusion)

---

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js
- **MongoDB**: Version 5.0 or higher ([Installation Guide](https://docs.mongodb.com/manual/installation/))
- **Git**: For cloning the repository

Verify installations:

```bash
node --version
npm --version
mongod --version
git --version
```

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

MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_DATABASE=your_database
MONGODB_URL=your_mongodb_url

OPENAI_API_KEY=your_openai_api_key
```

**Note**: Ensure MongoDB is running and accessible at the specified URL. Obtain your OpenAI API key from [OpenAI Platform](https://platform.openai.com/).

### 4. Run the Application

**Development Mode** (with auto-reload):

```bash
npm run dev
```

**Test Mode** (with auto-reload):

```bash
npm test
```

**Production Build**:

```bash
npm run build
npm start
```

The backend will start on `http://localhost:3010`.

**Verification**: Open a browser and navigate to `http://localhost:3010/health` (assuming a health endpoint exists) or check the console for startup logs.

---

## 🏗️ Architecture Overview

The application follows a layered MVC architecture for clean separation of concerns:

| Layer              | Components                                                                 | Responsibility                                                                 |
|--------------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Presentation Layer | Express routes & controllers                                              | Handle incoming HTTP requests, validate inputs, return responses.             |
| Business Logic     | Service modules ([chat.service.ts](src/service/chat/chat.service.ts), [createEscalation.service.ts](src/service/escalationervice/createEscalation.service.ts), etc.) | Implement core features such as AI processing and escalation logic.           |
| Data Layer         | Mongoose models ([chat.model.ts](src/model/chat.model.ts), [escalation.model.ts](src/model/escalation.model.ts)) | Define schemas and handle MongoDB data persistence.                           |
| Real-time Layer    | WebSocket integration ([websocket.ts](src/socket/websocket.ts))           | Instant message delivery and typing indicators.                               |
| AI Integration     | OpenAI GPT integration ([chat.service.ts](src/service/chat/chat.service.ts)) | Generate dynamic responses from a knowledge base, detect escalation cases.    |
| Utility & Middleware| Configuration, validation, error handling, email sending.                | Supportive cross-cutting concerns.                                            |

### File/Folder Highlights

- [`src/server.ts`](src/server.ts) — Application entry point.
- [`src/app.ts`](src/app.ts) — Express app setup, middleware, CORS, JSON parsing.
- [`src/config/index.ts`](src/config/index.ts) — Centralized configuration with validation.
- [`src/model/`](src/model/) — Mongoose schemas (chat sessions and escalations).
- [`src/controller/`](src/controller/) — Request handlers for chat and escalation.
- [`src/service/`](src/service/) — Core business logic, including AI chat processing.
- [`src/route/`](src/route/) — API routes (v1/chat, v1/escalation).
- [`src/socket/websocket.ts`](src/socket/websocket.ts) — WebSocket events for live chat.
- [`src/lib/smtp.ts`](src/lib/smtp.ts) — Email setup for human escalation notifications.
- [`src/utils/`](src/utils/) — Shared utilities (async handler, API response helpers, etc.).

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

## 📚 API Documentation

Detailed API documentation is available in the [API Docs](./docs/api.md) (placeholder). Key endpoints include:

- `POST /api/v1/chat` — Send a chat message
- `GET /api/v1/escalation` — Retrieve escalations

For interactive API testing, use tools like Postman or Swagger UI.

---

## 🧪 Testing

Run tests using:

```bash
npm test
```

Tests include unit tests, integration tests, and performance tests located in the [`tests/`](tests/) directory.

---

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   - Change the `PORT` in `.env` to an available port (e.g., 3011).
   - Kill the process using the port: `npx kill-port 3010`

2. **MongoDB Connection Error**:
   - Ensure MongoDB is running: `mongod`
   - Verify connection string in `.env`.
   - Check firewall settings for MongoDB port (default 27017).

3. **OpenAI API Errors**:
   - Verify `OPENAI_API_KEY` is set correctly.
   - Check API quota and billing on [OpenAI Dashboard](https://platform.openai.com/).

4. **Build Errors**:
   - Ensure Node.js version is >= 18.0.0.
   - Clear node_modules: `rm -rf node_modules && npm install`

5. **WebSocket Issues**:
   - Ensure the client connects to the correct WebSocket URL (e.g., `ws://localhost:3010`).

If issues persist, check logs in the console or enable debug mode by setting `NODE_ENV=development`.


---

## ✅ Conclusion

With this setup, the system delivers fast, accurate AI support for students while guaranteeing a smooth human handoff whenever AI can't resolve a query — combining scalability, professionalism, and great user experience.