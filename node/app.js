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
const games = {};

app.use(express.static(join(__dirname, "public")));

io.on("connection", (socket) => {
  const cleanupRoom = (roomCode) => {
    const clients = io.sockets.adapter.rooms.get(roomCode);
    const numClients = clients ? clients.size : 0;

    if (numClients === 0) {
      delete games[roomCode];
      console.log(`Room ${roomCode} empty, game has been cleared`);
    }
  };

  socket.on("createRoom", (data, callback) => {
    let roomCode;
    do {
      roomCode = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    } while (games[roomCode]);

    games[roomCode] = new Chess();

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.player = "white";

    socket.emit("playerRole", socket.player);
    socket.emit("status", "Room created, waiting for opponent...");

    callback(roomCode);
  });
  socket.on("joinRoom", (roomCode, callback) => {
    // Get the number of players in this room
    const connectedSockets = io.sockets.adapter.rooms.get(roomCode);

    if (!connectedSockets) {
      socket.emit("error", `No room with that code`);
      return;
    }

    const numClients = connectedSockets ? connectedSockets.size : 0;

    if (numClients === 1) {
      // get the socket of the other player in the room
      const firstSocketId = connectedSockets.values().next().value;
      const firstPlayerSocket = io.sockets.sockets.get(firstSocketId);
      // set the color to the opposite of the other player
      socket.player = firstPlayerSocket.player === "white" ? "black" : "white";

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.emit("playerRole", socket.player);
      io.to(roomCode).emit("status", "Second player joined...");
      // Send initial board state to both players after the second player joins
      io.to(roomCode).emit("update", games[roomCode].turn);
      return callback(true);
    } else if (numClients >= 2) {
      // Room is full
      socket.emit("error", `Room ${roomCode} is already full.`);
      return callback(false);
    }
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("status", "Your opponent disconnected.");
        process.nextTick(() => {
          cleanupRoom(room);
        });
      }
    }
  });

  socket.on("resign", (data) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !games[roomCode]) {
      socket.emit("error", "Cannot resign: Not in an active game.");
      return;
    }

    const winner = socket.player === "white" ? "black" : "white";
    games[roomCode].winCondition = `Your opponent resigned, you win`;

    socket.to(roomCode).emit("winner", {
      winner: winner,
      winCondition: games[roomCode].winCondition,
    });

    socket.leave(roomCode);
    process.nextTick(() => {
      cleanupRoom(roomCode);
    });
  });

  socket.on("reset", (roomCode) => {
    if (!games[roomCode]) {
      socket.emit(
        "error",
        `Cannot reset: Game not found for room code: ${roomCode}`,
      );
      return;
    }
    games[roomCode].board = games[roomCode]._createBoard();
    games[roomCode].turn = "white";
    games[roomCode].moveHistory = [];
    io.to(roomCode).emit("update", games[roomCode].turn);
  });

  socket.on("getTurn", (callback) => {
    if (!games[socket.roomCode]) {
      socket.emit("error", `Game not found for room code: ${socket.roomCode}`);
      return callback(null); // Indicate failure
    }
    const turn = games[socket.roomCode].turn;
    callback(turn);
  });

  socket.on("getMoves", (data, callback) => {
    if (!games[socket.roomCode]) {
      socket.emit("error", `Game not found for room code: ${socket.roomCode}`);
      return callback([]); // Return empty array for moves
    }
    const validMoves = games[socket.roomCode].validMoves(data);
    callback(validMoves);
  });

  socket.on("gameState", (roomCode, callback) => {
    console.log(roomCode);
    if (!games[roomCode]) {
      socket.emit("error", `Game not found for room code: ${roomCode}`);
      return callback(null); // Indicate failure to the client
    }
    const data = {
      board: games[roomCode].board,
      turn: games[roomCode].turn,
      moveHistory: games[roomCode].moveHistory,
    };
    callback(data);
  });

  socket.on("move", (data, callback) => {
    if (!games[data.roomCode]) {
      socket.emit("error", `Game not found for room code: ${data.roomCode}`);
      return callback(false); // Indicate failure to the client
    }
    if (games[data.roomCode].turn !== socket.player) {
      socket.emit("status", `Not ${socket.player}'s turn to move`);
      return callback(false); // Indicate failure
    }
    console.log(data);

    const moved = games[data.roomCode].move({
      from: data.from,
      to: data.to,
      specials: data.specials || [],
      attackTarget: data.enPessentTarget || "",
    });

    // if (games[socket.roomCode]._isKingInCheck(games[socket.roomCode].turn)) {
    //   socket.emit("check", `${socket.player}'s king is in check`);
    // }

    if (games[socket.roomCode].winner) {
      io.to(socket.roomCode).emit("winner", {
        winner: games[socket.roomCode].winner,
        winCondition: games[socket.roomCode].winCondition,
      });
    }

    if (moved) {
      socket.to(data.roomCode).emit("update", games[data.roomCode].turn);
    }

    callback(moved);
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
