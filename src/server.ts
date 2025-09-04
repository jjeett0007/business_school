import "./global";
import http from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { config } from "./config";
import { setupSocket } from "./socket/websocket";

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const PORT = config.port;

setupSocket(wss);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
