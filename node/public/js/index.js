const white = { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" };
const black = { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" };

const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", async (e) => {
  const res = await fetch("/reset", {
    method: "GET",
  });
  renderBoard();
});

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
  const res = await fetch("/board", {
    method: "GET",
  });
  const board = await res.json();
  // console.log(board);

  boardElement.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add(board[i][j].color);
      square.dataset.pos = board[i][j].name;

      square.innerText = board[i][j].piece;

      if (square.innerText) square.style.cursor = "pointer";

      square.addEventListener("click", () =>
        handleSquareClick(board[i][j].name),
      );

      boardElement.appendChild(square);
    }
  }
}

async function handleSquareClick(squareName) {
  console.log(`Clicked on ${squareName}`);
  clearHighlights(); // Clear all highlights first

  if (selectedSquare === null) {
    // This is a "first" click
    const clickedSquare = document.querySelector(`[data-pos="${squareName}"]`);
    if (clickedSquare && clickedSquare.innerText) {
      // If the clicked square has a piece
      const pieceColor = getPieceColor(clickedSquare.innerText);
      if (pieceColor) {
        // TODO: Only allow selecting pieces of the current turn's color
        selectedSquare = squareName;
        highlightSquare(squareName); // Highlight the selected square

        // Highlight valid moves for the selected piece
        const res = await fetch("/moves", {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ squareName: selectedSquare }), // Fetch moves for the selected piece
        });
        currentValidMoves = await res.json(); // Store valid moves for the selected piece
        console.log("Valid moves for", selectedSquare, ":", currentValidMoves);
        currentValidMoves.forEach((moveName) => highlightValidMove(moveName));
      } else {
        console.log("It's not your turn to move this piece.");
      }
    }
  } else {
    // A piece was already selected
    // Check if the clicked square is a valid move for the selected piece
    if (currentValidMoves.includes(squareName)) {
      // Use the stored valid moves
      // This is a valid move
      console.log("Trying to move from", selectedSquare, "to", squareName);
      fetch("/move", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ from: selectedSquare, to: squareName }),
      })
        .then((response) => {
          if (response.ok) {
            selectedSquare = null;
            currentValidMoves = []; // Clear valid moves
            renderBoard(); // Re-render the board to show the move
          } else {
            console.error("Move Failed");
            // Reset state and re-render to clear highlights
            selectedSquare = null;
            currentValidMoves = [];
            renderBoard();
          }
        })
        .catch((error) => {
          console.error("Error during move fetch:", error);
          // Reset state and re-render on error
          selectedSquare = null;
          currentValidMoves = [];
          renderBoard();
        });
    } else {
      // Clicked on an invalid square, or clicked on another piece.
      const clickedSquare = document.querySelector(
        `[data-pos="${squareName}"]`,
      );
      const pieceColor = clickedSquare.innerText
        ? getPieceColor(clickedSquare.innerText)
        : null;

      if (clickedSquare && clickedSquare.innerText && pieceColor) {
        // If clicked on another piece of the same color, re-select it
        selectedSquare = squareName;
        highlightSquare(squareName);
        // Fetch new valid moves for the newly selected piece
        const res = await fetch("/moves", {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ squareName: selectedSquare }),
        });
        currentValidMoves = await res.json();
        console.log(
          "Valid moves for new selection",
          selectedSquare,
          ":",
          currentValidMoves,
        );
        currentValidMoves.forEach((moveName) => highlightValidMove(moveName));
      } else {
        // Otherwise, deselect and re-render
        selectedSquare = null;
        currentValidMoves = [];
        renderBoard();
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
    el.style.outline = "4px solid yellow";
    el.style.zIndex = "10";
  }
}

function highlightValidMove(squareName) {
  const el = document.querySelector(`[data-pos="${squareName}"]`);
  if (el) {
    // Check if it's already highlighted as selectedSquare, don't override outline
    if (!el.innerText) {
      el.classList.add("highlightEmpty");
    } else {
      el.classList.add("highlightEnemy");
    }
  }
}
let selectedSquare = null;
let currentValidMoves = [];

renderBoard();
