import express from "express";
import matchRouter from "./routes/match.route.js";
import dotenv from "dotenv";
import http from "http";
import { attachWebSocketServer } from "./ws/server.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const server = http.createServer(app);
app.use(express.json());

app.use("/api/match", matchRouter);
const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on port ${baseUrl}`);
  console.log(
    `WebSocket endpoint available at ${baseUrl.replace("http", "ws")}/ws`,
  );
});
