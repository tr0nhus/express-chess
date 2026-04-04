import express from "express";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Chess from "./routes/myChess.js";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const port = 3000;

const io = new Server(httpServer);
const game = new Chess();

app.use(express.static(join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomCode) => {
    // Get the number of players in this room
    const connectedSockets = io.sockets.adapter.rooms.get(roomCode);
    const numClients = connectedSockets ? connectedSockets.size : 0;

    if (numClients === 0) {
      socket.join(roomCode);
      socket.player = "white";
      socket.emit("playerRole", socket.player);
      socket.emit("status", "Waiting for oppononent...");
    } else if (numClients === 1) {
      socket.join(roomCode);
      socket.player = "black";
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
    game.board = game._createBoard();
    game.turn = "white";
    game.moveHistory = [];
    io.to(roomCode).emit("update", game.turn);
  });

  socket.on("getMoves", (data, callback) => {
    const validMoves = game.validMoves(data);
    callback(validMoves);
  });

  socket.on("getTurn", (callback) => {
    // 'callback' is the acknowledgment function
    const turn = game.turn;
    callback(turn); // Send the turn back as an acknowledgment
  });

  socket.on("gameState", (roomCode, callback) => {
    const data = {
      board: game.board,
      turn: game.turn,
      moveHistory: game.moveHistory,
    };
    callback(data);
  });

  socket.on("move", (data, callback) => {
    if (game.turn !== socket.player) {
      socket.emit("status", `Not ${socket.player}'s turn to move`);
    }

    console.log(data.from, data.to);
    const moved = game.move({ from: data.from, to: data.to });

    if (moved) {
      socket.to(data.roomCode).emit("update", game.turn);
    }

    callback(moved);
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
