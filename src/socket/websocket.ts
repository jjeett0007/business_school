import { config } from "../config";
import jwt from "jsonwebtoken";

const jwtSecret = config.jwt.secret;

const userSockets: Record<string, any[]> = {};

function isUserConnected(userId: string) {
  const sockets = userSockets[userId];
  const connected =
    sockets && sockets.some((socket) => socket.readyState === 1);
  console.log("User is connected?", connected);
  return connected;
}

function sendMessageToUser(data: {
  userId: string;
  from: string;
  conversationId: string;
  message: string;
}) {
  const userId = data.userId;
  const message = {
    type: "message",
    from: data.from,
    conversationId: data.conversationId,
    reload: true,
    message: data.message,
  };

  const sockets = userSockets[userId];
  if (sockets && sockets.length > 0) {
    sockets.forEach((socket) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify(message));
      }
    });
    console.log(`Message broadcasted to user ${userId}`);
  } else {
    console.log(`User ${userId} is not connected`);
  }
}

function addUserSocket(userId: string, ws: any) {
  if (!userSockets[userId]) {
    userSockets[userId] = [];
  }
  userSockets[userId].push(ws);
}

function setupSocket(wss: any) {
  console.log("WebSocket server started");

  wss.on("connection", (ws: any, req: any) => {
    const origin = req.headers.origin;
    console.log("Connection attempt from origin:", origin);

    ws.on("message", (message: string) => {
      const data = JSON.parse(message);

      if (data.type === "request-id") {
        const token = data.token;

        jwt.verify(token, jwtSecret, (err: any, decodedToken: any) => {
          if (err) {
            console.log("Invalid token, closing connection");
            return ws.close();
          }

          const userId = decodedToken.id;
          addUserSocket(userId, ws);
          ws.send(JSON.stringify({ type: "connection-id", id: userId }));
        });
      }
    });

    ws.on("close", () => {
      for (const userId in userSockets) {
        if (userSockets[userId]) {
          userSockets[userId] = userSockets[userId].filter((s) => s !== ws);
          if (userSockets[userId].length === 0) {
            delete userSockets[userId];
            console.log(`User ${userId} disconnected`);
          }
        }
      }
    });
  });
}

export { setupSocket, isUserConnected, sendMessageToUser };
