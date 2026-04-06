const black = { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" };
const white = { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" };

const socket = io();

// UI Elements
const loginPage = document.getElementById("login-page");
const gamePage = document.getElementById("game-page");
const loginForm = document.getElementById("login-form");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");

const resignModal = document.getElementById("resignConfirmation");
const cancelResign = document.getElementById("cancelResign");
const resignConfirmed = document.getElementById("resignConfirmed");

const resignBtn = document.getElementById("resignBtn");
const drawBtn = document.getElementById("drawBtn");
const resetBtn = document.getElementById("resetBtn");

resignBtn.addEventListener("click", () => {
  resignModal.showModal();
});

cancelResign.addEventListener("click", () => {
  resignModal.close();
});

resignConfirmed.addEventListener("click", () => {
  socket.emit("resign");

  gamePage.classList.add("hidden");
  loginPage.classList.remove("hidden");
  resignModal.close();
});

const inputs = document.querySelectorAll(".otp-container input");

inputs.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    if (e.target.value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].focus(); // Move to next box
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputs[index - 1].focus(); // Move back on delete
    }
  });
});

let roomCode; // Will be set on login

resetBtn.addEventListener("click", async (e) => {
  socket.emit("reset", roomCode);
});

joinBtn.addEventListener("click", (e) => {
  roomCode = "";

  inputs.forEach((input) => {
    roomCode += input.value;
  });

  if (roomCode.length !== 4) return;

  loginPage.classList.add("hidden");
  gamePage.classList.remove("hidden");

  socket.emit("joinRoom", roomCode);
});

createBtn.addEventListener("click", async (e) => {
  roomCode = await requestFromServer("createRoom", "Clicked create button");
  console.log(roomCode);
  loginPage.classList.add("hidden");
  gamePage.classList.remove("hidden");
  renderBoard();
});

// let roomCode = prompt("Enter Room Code");
// if (!roomCode) {
//   roomCode = "defaultRoom"; // Provide a default or handle error
//   alert("No room code entered. Joining default room.");
// }

function requestFromServer(event, data) {
  return new Promise((resolve) => {
    socket.emit(event, data, (response) => {
      resolve(response);
    });
  });
}

let player = null;
let selectedSquare = null;
let currentValidMoves = [];
let turn = null;

socket.on("status", (message) => {
  console.log(message);
});

socket.on("turn", (data) => {
  turn = data;
});

socket.on("update", (data) => {
  turn = data;
  renderBoard();
});

socket.on("check", (message) => {
  console.log(message);
});

async function updateValidMoves(square) {
  return (currentValidMoves = await requestFromServer("getMoves", square));
}

socket.on("playerRole", (data) => {
  console.log(data);
  player = data;
  if (roomCode) {
    renderBoard();
  }
});

// renderBoard();

function getPieceColor(string) {
  if (typeof string !== "string") {
    throw new Error("Input must be a string");
  }
  if (!string) return "";
  else return Object.values(white).includes(string) ? "white" : "black";
}

async function renderBoard() {
  // clear the board
  const boardElement = document.getElementById("board");
  const roomCodeDisplay = document.getElementById("roomCode");
  roomCodeDisplay.innerText = roomCode.split("").join(" ");

  // console.log(roomCode);
  const data = await requestFromServer("gameState", roomCode);

  const board = data.board;
  const moveHistory = data.moveHistory;

  console.log(moveHistory);

  if (!player) throw new Error(`Player: ${player} was not a valid string`);

  boardElement.innerHTML = "";

  if (player === "white") {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.classList.add(board[i][j].color);
        square.dataset.pos = board[i][j].name;

        square.innerText = board[i][j].piece;

        if (square.innerText && getPieceColor(square.innerText) === player)
          square.style.cursor = "pointer";

        square.addEventListener("click", () =>
          handleSquareClick(board[i][j].name),
        );

        boardElement.appendChild(square);
      }
    }
  } else if (player === "black") {
    for (let i = 7; i >= 0; i--) {
      for (let j = 0; j < 8; j++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.classList.add(board[i][j].color);
        square.dataset.pos = board[i][j].name;

        square.innerText = board[i][j].piece;

        if (square.innerText && getPieceColor(square.innerText) === player)
          square.style.cursor = "pointer";

        square.addEventListener("click", () =>
          handleSquareClick(board[i][j].name),
        );

        boardElement.appendChild(square);
      }
    }
  }

  // render the move history
  const tableBody = document.querySelector("#move-table tbody");
  tableBody.innerHTML = "";

  for (let row = 0; row * 2 <= moveHistory.length; row++) {
    const newRow = tableBody.insertRow(-1);

    const cellRound = newRow.insertCell(0);
    const cellWhite = newRow.insertCell(1);
    const cellBlack = newRow.insertCell(2);

    cellRound.textContent = row + 1;
    cellWhite.textContent = moveHistory[row * 2]
      ? formatMove(moveHistory[row * 2])
      : "...";
    cellBlack.textContent = moveHistory[row * 2 + 1]
      ? formatMove(moveHistory[row * 2 + 1])
      : "...";
  }

  const tableContainer = document.querySelector(".moveTableContainer");
  tableContainer.scrollTo({
    top: tableContainer.scrollHeight,
    behavior: "smooth",
  });
}

function formatMove({ color, piece, from, to, specials }) {
  let move = "";

  let pieceMap = color === "white" ? white : black;

  switch (piece) {
    case pieceMap.p:
      move = "";
      break;
    case pieceMap.r:
      move += "R";
      break;
    case pieceMap.n:
      move += "N";
      break;
    case pieceMap.b:
      move += "B";
      break;
    case pieceMap.q:
      move += "Q";
      break;
    case pieceMap.k:
      move += "K";
      break;
  }

  if (specials.includes("attack")) move += "x";

  move += to;

  if (specials.includes("short-castle")) move = "O-O";
  if (specials.includes("long-castle")) move = "O-O-O";

  if (specials.includes("check")) move += "+";
  else if (specials.includes("mate")) move += "#";

  return move;
}

async function handleSquareClick(squareName) {
  // console.log(`Clicked on ${squareName}`);
  clearHighlights();
  const currentTurn = await getTurn(); // Await the current turn
  // console.log("Current turn:", currentTurn);
  if (currentTurn !== player) {
    throw new Error(
      `It's not your turn. Current turn: ${currentTurn}, Your player: ${player}`,
    );
  }

  if (selectedSquare === null) {
    // This is a "first" click
    const clickedSquare = document.querySelector(`[data-pos="${squareName}"]`);
    if (clickedSquare && clickedSquare.innerText) {
      // If the clicked square has a piece
      const pieceColor = getPieceColor(clickedSquare.innerText);
      if (pieceColor) {
        // Check if a piece color was successfully determined
        if (pieceColor !== currentTurn) {
          // Use the awaited currentTurn
          throw new Error(`Not ${pieceColor}'s turn to move`);
        }
        selectedSquare = squareName;
        highlightSquare(squareName); // Highlight the selected square

        // Highlight valid moves for the selected piece using websocket

        await updateValidMoves(squareName);

        // console.log("Valid moves for", selectedSquare, ":", currentValidMoves);

        currentValidMoves.forEach((move) => highlightValidMove(move));
      } else {
        console.log("It's not your turn to move this piece.");
      }
    }
  } else {
    // A piece was already selected
    // Check if the clicked square is a valid move for the selected piece
    const [move] = currentValidMoves.filter(
      (move) => move.target === squareName,
    );
    if (move) {
      // This is a valid move
      console.log("Trying to move from", selectedSquare, "to", squareName);
      console.log("Valid move was: ", move);
      console.log("En Pessent Target was: ", move.enPessentTarget);

      const moved = requestFromServer("move", {
        roomCode: roomCode,
        from: selectedSquare,
        to: squareName,
        specials: move.specials || [],
        enPessentTarget: move.enPessentTarget || "",
      });

      if (moved) {
        console.log("Move Successful");
        selectedSquare = null;
        currentValidMoves = [];
        renderBoard();
      } else {
        console.error("Move Failed");
        selectedSquare = null;
        currentValidMoves = [];
        renderBoard();
      }
    } else {
      console.log("HERE");
      // Clicked on an invalid square, or clicked on another piece.
      const clickedSquare = document.querySelector(
        `[data-pos="${squareName}"]`,
      );

      if (selectedSquare === squareName) {
        // Re-selected same square -> deselect and re-render
        selectedSquare = null;
        currentValidMoves = [];
        renderBoard();
      } else {
        const pieceColor = clickedSquare.innerText
          ? getPieceColor(clickedSquare.innerText)
          : null;

        if (clickedSquare && clickedSquare.innerText && pieceColor === turn) {
          // If clicked on another piece of the same color, re-select it
          selectedSquare = squareName;
          highlightSquare(squareName);
          // Fetch new valid moves for the newly selected piece
          await updateValidMoves(squareName);

          // console.log(
          //   "Valid moves for new selection",
          //   selectedSquare,
          //   ":",
          //   currentValidMoves,
          // );

          currentValidMoves.forEach((move) => highlightValidMove(move));
        } else {
          // Otherwise, deselect and re-render
          selectedSquare = null;
          currentValidMoves = [];
          renderBoard();
        }
      }
    }
  }
}

function clearHighlights() {
  document.querySelectorAll(".square").forEach((el) => {
    el.style.outline = ""; // Remove outline
    // Re-apply original background color and zIndex
    el.style.zIndex = "";
    el.classList.remove("highlightEmpty");
    el.classList.remove("highlightEnemy");
  });
}

function highlightSquare(squareName) {
  const el = document.querySelector(`[data-pos="${squareName}"]`);
  if (el) {
    el.style.outline = "2px solid #3f7784";
    el.style.zIndex = "10";
  }
}

function highlightValidMove(validMove) {
  const squareName = validMove.target;
  const el = document.querySelector(`[data-pos="${squareName}"]`);
  if (el) {
    // Check if it's already highlighted as selectedSquare, don't override outline
    if (!validMove.attack) {
      el.classList.add("highlightEmpty");
    } else {
      el.classList.add("highlightEnemy");
    }
  }
}

function getTurn() {
  return new Promise((resolve) => {
    socket.emit("getTurn", (currentTurn) => {
      turn = currentTurn; // Update the global 'turn' variable
      resolve(currentTurn);
    });
  });
}
