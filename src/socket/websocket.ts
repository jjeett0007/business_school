import { config } from "../config";


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


function addSessionIdToSocket(ws: any, sessionId: string) {
  if (!userSockets[sessionId]) {
    userSockets[sessionId] = [];
  }
  userSockets[sessionId].push(ws);
}

function isTyping(sessionId: string, isTyping: boolean) {
  const sockets = userSockets[sessionId];
   if (sockets && sockets.length > 0) {
    sockets.forEach((socket) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({ isTyping: isTyping }) );
      }
    });
    console.log(`Message broadcasted to user ${sessionId}`);
  } else {
    console.log(`User ${sessionId} is not connected`);
  }
}



function sendMessageBySessionId(data: {
  sessionId: string,
  data: {
    reply: string,
    needsEscalation: boolean
  }
}) {
  const sockets = userSockets[data.sessionId];
   if (sockets && sockets.length > 0) {
    sockets.forEach((socket) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify(data.data));
      }
    });
    console.log(`Message broadcasted to user ${data.sessionId}`);
  } else {
    console.log(`User ${data.sessionId} is not connected`);
  }
}

function setupSocket(wss: any) {
  console.log("WebSocket server started");

  wss.on("connection", (ws: any, req: any) => {
    ws.on("message", (message: string) => {
      const data = JSON.parse(message);

      if (data.type === "session-id") {
        const sessionId = data.sessionId;
        addSessionIdToSocket(ws, sessionId);
        ws.send(JSON.stringify({ type: "session-ack", sessionId }));
      }
    });

    ws.on("close", () => {
      for (const sessionId in userSockets) {
        if (userSockets[sessionId]) {
          userSockets[sessionId] = userSockets[sessionId].filter((s) => s !== ws);
          if (userSockets[sessionId].length === 0) {
            delete userSockets[sessionId];
            console.log(`User ${sessionId} disconnected`);
          }
        }
      }
    });
  });
}

export { setupSocket, isUserConnected, sendMessageToUser, sendMessageBySessionId, isTyping };
