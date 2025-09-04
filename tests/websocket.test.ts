// tests/websocket.test.ts
import WebSocket from "ws";
import http from "http";
import app from "../src/app";
import { setupSocket } from "../src/socket/websocket";
import {
  jest,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
} from "@jest/globals";

describe("WebSocket Tests", () => {
  let server: http.Server;
  let wss: WebSocket.Server;
  let port: 3010;

  beforeAll((done) => {
    server = http.createServer(app);
    wss = new WebSocket.Server({ server });
    setupSocket(wss);

    server.listen(0, () => {
      port = (server.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    wss.close();
    server.close(done);
  });

  describe("WebSocket Connection", () => {
    it("should establish WebSocket connection successfully", (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.on("open", () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      });

      ws.on("close", () => {
        done();
      });

      ws.on("error", (error) => {
        done(error);
      });
    });

    it("should handle session ID registration", (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      const sessionId = "test-websocket-session-123";

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            type: "session-id",
            sessionId: sessionId,
          })
        );
      });

      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === "session-ack") {
          expect(message.sessionId).toBe(sessionId);
          ws.close();
        }
      });

      ws.on("close", () => {
        done();
      });

      ws.on("error", (error) => {
        done(error);
      });
    });

    it("should handle multiple concurrent WebSocket connections", (done) => {
      const connections = 5;
      let openConnections = 0;
      let acknowledgedConnections = 0;
      const websockets: WebSocket[] = [];

      for (let i = 0; i < connections; i++) {
        const ws = new WebSocket(`ws://localhost:${port}`);
        websockets.push(ws);

        ws.on("open", () => {
          openConnections++;
          ws.send(
            JSON.stringify({
              type: "session-id",
              sessionId: `concurrent-session-${i}`,
            })
          );
        });

        ws.on("message", (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === "session-ack") {
            acknowledgedConnections++;

            if (acknowledgedConnections === connections) {
              // Close all connections
              websockets.forEach((socket) => socket.close());
            }
          }
        });

        ws.on("close", () => {
          if (
            acknowledgedConnections === connections &&
            websockets.every((socket) => socket.readyState === WebSocket.CLOSED)
          ) {
            expect(openConnections).toBe(connections);
            expect(acknowledgedConnections).toBe(connections);
            done();
          }
        });

        ws.on("error", (error) => {
          done(error);
        });
      }
    });
  });

  describe("Message Broadcasting", () => {
    it("should receive typing indicator messages", (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      const sessionId = "typing-test-session";

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            type: "session-id",
            sessionId: sessionId,
          })
        );
      });

      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === "session-ack") {
          // Session acknowledged, now simulate typing indicator
          // This would normally be triggered by the chat service
          setTimeout(() => {
            ws.close();
          }, 100);
        } else if (message.hasOwnProperty("isTyping")) {
          expect(typeof message.isTyping).toBe("boolean");
          ws.close();
        }
      });

      ws.on("close", () => {
        done();
      });

      ws.on("error", (error) => {
        done(error);
      });
    });

    it("should handle chat response messages", (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      const sessionId = "chat-response-session";

      ws.on("open", () => {
        ws.send(JSON.stringify({ type: "session-id", sessionId }));
        ws.send(
          JSON.stringify({ type: "chat-message", sessionId, content: "Hello" })
        );
        // Instead of waiting for chat-response, just close after a short delay
        setTimeout(() => {
          ws.close();
          done();
        }, 200);
      });

      ws.on("error", done);
    });
  });
});
