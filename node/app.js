import express from "express";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Chess from "./routes/myChess.js";
import { createServer } from "http";
import { error } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const port = 3000;

const io = new Server(httpServer);
const games = {};

app.use(express.static(join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomCode) => {
    // Get the number of players in this room
    const connectedSockets = io.sockets.adapter.rooms.get(roomCode);
    const numClients = connectedSockets ? connectedSockets.size : 0;

    if (numClients === 0) {
      games[roomCode] = new Chess();
      socket.join(roomCode);
      socket.player = "white";
      socket.roomCode = roomCode; // Store roomCode on the socket
      socket.emit("playerRole", socket.player);
      socket.emit("status", "Waiting for oppononent...");
    } else if (numClients === 1) {
      // get the socket of the other player in the room
      const firstSocketId = connectedSockets.values().next().value;
      const firstPlayerSocket = io.sockets.sockets.get(firstSocketId);
      // set the color to the opposite of the other player
      socket.player = firstPlayerSocket.player === "white" ? "black" : "white";

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.emit("playerRole", socket.player);
      io.to(roomCode).emit("status", "Second player joined...");
    }
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("status", "Your opponent disconnected.");
      }
    }
  });

  socket.on("reset", (roomCode) => {
    if (!games[roomCode]) throw new Error(`No Room with code: ${roomCode}`);
    games[roomCode].board = games[roomCode]._createBoard();
    games[roomCode].turn = "white";
    games[roomCode].moveHistory = [];
    io.to(roomCode).emit("update", games[roomCode].turn);
  });

  socket.on("getMoves", (data, callback) => {
    const validMoves = games[socket.roomCode].validMoves(data);
    callback(validMoves);
  });

  socket.on("getTurn", (callback) => {
    const turn = games[socket.roomCode].turn;
    callback(turn);
  });

  socket.on("gameState", (roomCode, callback) => {
    const data = {
      board: games[roomCode].board,
      turn: games[roomCode].turn,
      moveHistory: games[roomCode].moveHistory,
    };
    callback(data);
  });

  socket.on("move", (data, callback) => {
    if (games[data.roomCode].turn !== socket.player) {
      socket.emit("status", `Not ${socket.player}'s turn to move`);
    }
    console.log(data);

    const moved = games[data.roomCode].move({
      from: data.from,
      to: data.to,
      attackTarget: data.enPessentTarget || "",
    });

    if (moved) {
      socket.to(data.roomCode).emit("update", games[data.roomCode].turn);
    }

    callback(moved);
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
