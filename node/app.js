import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Chess from "./routes/myChess.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
const game = new Chess();

app.use(express.static(join(__dirname, "public")));
app.use(express.json());
// console.log(game.board);

app.get("/reset", (req, res) => {
  game.board = game._createBoard();
  game.turn = "white";
  res.status(200).json(game.board);
});

app.get("/board", (req, res) => {
  res.status(200).json(game.board);
});

app.get("/turn", (req, res) => {
  const turn = game.turn;
  res.status(200).json(turn);
});

app.post("/moves", (req, res) => {
  // console.log(req.body);
  const { squareName } = req.body;
  // console.log(squareName);
  const validMoves = game.validMoves(squareName);

  res.json(validMoves);
});

app.post("/move", (req, res) => {
  console.log(req.body);
  const moved = game.move(req.body);
  // Here should go some implementation for turn validation
  res.status(moved ? 200 : 400).json({ success: moved });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
