function Chess() {
  this.white = { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" };
  this.black = { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" };
  this.startingPos = {
    a8: this.black.r,
    b8: this.black.n,
    c8: this.black.b,
    d8: this.black.q,
    e8: this.black.k,
    f8: this.black.b,
    g8: this.black.n,
    h8: this.black.r,
    a7: this.black.p,
    b7: this.black.p,
    c7: this.black.p,
    d7: this.black.p,
    e7: this.black.p,
    f7: this.black.p,
    g7: this.black.p,
    h7: this.black.p,
    a2: this.white.p,
    b2: this.white.p,
    c2: this.white.p,
    d2: this.white.p,
    e2: this.white.p,
    f2: this.white.p,
    g2: this.white.p,
    h2: this.white.p,
    a1: this.white.r,
    b1: this.white.n,
    c1: this.white.b,
    d1: this.white.q,
    e1: this.white.k,
    f1: this.white.b,
    g1: this.white.n,
    h1: this.white.r,
  };

  this._createBoard = function () {
    let board = [];
    for (let i = 0; i < 8; i++) {
      let row = [];
      for (let j = 0; j < 8; j++) {
        let square = new Square(
          String.fromCharCode(97 + j) + (8 - i),
          i % 2 === j % 2 ? "white" : "black",
        );
        // Assign piece from startingPos after Square creation
        square.piece = this.startingPos[square.name] || "";
        row.push(square);
      }
      board.push(row);
    }
    return board;
  };

  this.board = this._createBoard();
  this.getSquare = function (name) {
    // Improved getSquare for efficiency
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j].name === name) {
          return this.board[i][j];
        }
      }
    }
    return null; // Return null if square not found
  };
  this.turn = "white";

  this.move = function ({ from, to }) {
    // Function for moving a piece and updating the board
    const fromSquare = this.getSquare(from);
    const toSquare = this.getSquare(to);

    if (!fromSquare || !toSquare || !fromSquare.piece) {
      console.error(
        "Invalid 'from' or 'to' square, or no piece on 'from' square.",
      );
      return false;
    }

    toSquare.piece = fromSquare.piece; // Move the piece
    fromSquare.piece = ""; // Clear the original square

    // Update game.board state
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j].name === from) {
          this.board[i][j].piece = ""; // Clear the original square
        } else if (this.board[i][j].name === to) {
          this.board[i][j].piece = toSquare.piece; // Set the new square
        }
      }
    }

    // Switch turns
    this.turn = this.turn === "white" ? "black" : "white";

    // TODO: Handle special moves like castling, en passant, pawn promotion.
    // TODO: Update game history (e.g., push { from, to, pieceMoved, capturedPiece } to an array).
    // TODO: Check for check/checkmate/stalemate after the move.

    return true;
  };

  this.validMoves = function (squareName) {
    // Function for finding all the tiles which the piece in the square can move to
    const square = this.getSquare(squareName);
    if (!square || !square.piece) return [];

    const pieceType = square.piece;
    const pieceColor = this._getPieceColor(square);
    let possibleMoves = [];
    const pieceMap = pieceColor === "white" ? this.white : this.black;

    switch (pieceType) {
      case pieceMap.p:
        possibleMoves = this._getValidPawnMoves(square, pieceColor);
        break;
      case pieceMap.r:
        possibleMoves = this._getValidRookMoves(square, pieceColor);
        break;
      case pieceMap.n:
        possibleMoves = this._getValidKnightMoves(square, pieceColor);
        break;
      case pieceMap.b:
        possibleMoves = this._getValidBishopMoves(square, pieceColor);
        break;
      case pieceMap.q:
        possibleMoves = this._getValidQueenMoves(square, pieceColor);
        break;
      case pieceMap.k:
        possibleMoves = this._getValidKingMoves(square, pieceColor);
        break;
    }

    // TODO: Filter moves to ensure they don't leave the king in check
    // This is a complex step and might be implemented later.

    return possibleMoves;
  };

  this._getValidPawnMoves = function (square, pieceColor) {
    const moves = [];
    const { row, col } = this._getCoords(square.name);
    const direction = pieceColor === "white" ? -1 : 1; // White moves up (-1 row), Black moves down (+1 row)
    const startRank = pieceColor === "white" ? 6 : 1; // White pawns start on rank 2 (row 6), Black on rank 7 (row 1)

    // Singe step move
    const oneStepForwardName = this._getSquareName(row + direction, col);
    if (oneStepForwardName) {
      const oneStepSquare = this.getSquare(oneStepForwardName);
      if (oneStepSquare && !oneStepSquare.piece) {
        moves.push(oneStepForwardName);

        // if we can move once, maybe we can move twice
        if (row === startRank) {
          // Only from starting rank
          const twoStepsForwardName = this._getSquareName(
            row + 2 * direction,
            col,
          );
          if (twoStepsForwardName) {
            const twoStepsSquare = this.getSquare(twoStepsForwardName);
            if (twoStepsSquare && !twoStepsSquare.piece) {
              moves.push(twoStepsForwardName);
            }
          }
        }
      }
    }
    // TODO:
    // Diagonal moves
    const diags = [-1, 1];
    for (const offset of diags) {
      const diagName = this._getSquareName(row + direction, col + offset);
      if (diagName) {
        const diagSquare = this.getSquare(diagName);
        if (diagSquare && this._isEnemyPiece(diagSquare, pieceColor)) {
          moves.push(diagName);
        }
      }
    }

    return moves;
  };

  this._getValidRookMoves = function (square, pieceColor) {
    // implement logic for rook moves
    const directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];

    const { row, col } = this._getCoords(square.name);
    const moves = [];

    for (const [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const targetRow = row + dr * i;
        const targetCol = col + dc * i;

        const targetName = this._getSquareName(targetRow, targetCol);
        if (!targetName) break; // Out of bounds check

        const targetSquare = this.getSquare(targetName);

        if (this._isFriendlyPiece(targetSquare, pieceColor)) break;

        if (this._isEnemyPiece(targetSquare, pieceColor)) {
          moves.push(targetName);
          break;
        }

        moves.push(targetName);
      }
    }
    return moves;
  };

  this._getValidKnightMoves = function (square, pieceColor) {
    // implement logic for knight moves
    const jumps = [
      [1, 2],
      [2, 1],
      [-1, 2],
      [2, -1],
      [1, -2],
      [-2, 1],
      [-1, -2],
      [-2, -1],
    ];

    const { row, col } = this._getCoords(square.name);
    const moves = [];

    for (const [dr, dc] of jumps) {
      const targetRow = row + dr;
      const targetCol = col + dc;

      const targetName = this._getSquareName(targetRow, targetCol);
      if (!targetName) continue; // Out of bounds check

      const targetSquare = this.getSquare(targetName);

      if (this._isFriendlyPiece(targetSquare, pieceColor)) continue;

      moves.push(targetName);
    }

    return moves;
  };

  this._getValidBishopMoves = function (square, pieceColor) {
    // implement logic for bishop moves
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    const { row, col } = this._getCoords(square.name);
    const moves = [];

    for (const [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const targetRow = row + dr * i;
        const targetCol = col + dc * i;

        const targetName = this._getSquareName(targetRow, targetCol);
        if (!targetName) break; // Out of bounds check

        const targetSquare = this.getSquare(targetName);

        if (this._isFriendlyPiece(targetSquare, pieceColor)) break;

        if (this._isEnemyPiece(targetSquare, pieceColor)) {
          moves.push(targetName);
          break;
        }

        moves.push(targetName);
      }
    }
    return moves;
  };

  this._getValidQueenMoves = function (square, pieceColor) {
    // implement logic for queen moves
    const directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    const { row, col } = this._getCoords(square.name);
    const moves = [];

    for (const [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const targetRow = row + dr * i;
        const targetCol = col + dc * i;

        const targetName = this._getSquareName(targetRow, targetCol);
        if (!targetName) break; // Out of bounds check

        const targetSquare = this.getSquare(targetName);

        if (this._isFriendlyPiece(targetSquare, pieceColor)) break;

        if (this._isEnemyPiece(targetSquare, pieceColor)) {
          moves.push(targetName);
          break;
        }

        moves.push(targetName);
      }
    }
    return moves;
  };

  this._getValidKingMoves = function (square, pieceColor) {
    // implement logic for king moves
    const directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    const { row, col } = this._getCoords(square.name);
    const moves = [];

    for (const [dr, dc] of directions) {
      const targetRow = row + dr;
      const targetCol = col + dc;

      const targetName = this._getSquareName(targetRow, targetCol);
      if (!targetName) continue; // Out of bounds check

      const targetSquare = this.getSquare(targetName);

      if (this._isFriendlyPiece(targetSquare, pieceColor)) continue;

      moves.push(targetName);
    }

    return moves;
  };

  // Helper function for finding the color of a piece based on the Unicode character of the piece
  this._getPieceColor = function (square) {
    if (!square.piece) return "";
    return Object.values(this.white).includes(square.piece) ? "white" : "black";
  };

  // Helper function to get square coordinates (row, col) from name (e.g., "a1" -> {row: 7, col: 0})
  this._getCoords = function (squareName) {
    const col = squareName.charCodeAt(0) - 97; // 'a' is 97
    const row = 8 - parseInt(squareName[1]);
    return { row, col };
  };

  // Helper function to get square name from coordinates (e.g., {row: 7, col: 0} -> "a1")
  this._getSquareName = function (row, col) {
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    return String.fromCharCode(97 + col) + (8 - row);
  };

  // Helper to check if a square is occupied by a friendly piece
  this._isFriendlyPiece = function (targetSquare, pieceColor) {
    if (!targetSquare || !targetSquare.piece) return false;
    const targetPieceColor = this._getPieceColor(targetSquare);
    return targetPieceColor === pieceColor;
  };
  // Helper to check if a square is occupied by an enemy piece
  this._isEnemyPiece = function (targetSquare, pieceColor) {
    if (!targetSquare || !targetSquare.piece) return false;
    const targetPieceColor = this._getPieceColor(targetSquare);
    return targetPieceColor !== pieceColor;
  };
}

function Square(name, color) {
  this.name = name;
  this.color = color;
  this.piece = "";
}

function renderBoard() {
  // clear the board
  const boardElement = document.getElementById("board");
  const board = game.board;
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

function handleSquareClick(squareName) {
  console.log(`Clicked on ${squareName}`);
  clearHighlights(); // Clear all highlights first

  // This is a "first" click
  if (selectedSquare === null) {
    const clickedSquare = game.getSquare(squareName);
    if (clickedSquare && clickedSquare.piece) {
      // If the clicked square has a piece
      const pieceColor = game._getPieceColor(clickedSquare);
      if (pieceColor === game.turn) {
        // Only allow selecting pieces of the current turn's color
        selectedSquare = squareName;
        highlightSquare(squareName); // Highlight the selected square

        // Highlight valid moves for the selected piece
        const moves = game.validMoves(squareName);
        console.log("Valid moves for", squareName, ":", moves);
        moves.forEach((moveName) => highlightValidMove(moveName));
      } else {
        console.log("It's not your turn to move this piece.");
      }
    }
  } else {
    // A piece was already selected
    const validMoves = game.validMoves(selectedSquare);
    if (validMoves.includes(squareName)) {
      // Check if the clicked square is a valid move for the selected piece
      // This is a valid move
      game.move({ from: selectedSquare, to: squareName });
      selectedSquare = squareName;
      selectedSquare = null; // Deselect after move
      renderBoard(); // Re-render the board to show the move and clear all highlights
    } else {
      // Clicked on an invalid square, or clicked on another piece.
      const clickedSquare = game.getSquare(squareName);
      const pieceColor = clickedSquare
        ? game._getPieceColor(clickedSquare)
        : null;

      if (clickedSquare && clickedSquare.piece && pieceColor === game.turn) {
        // If clicked on another piece of the same color, re-select it
        selectedSquare = squareName;
        highlightSquare(squareName);
        const moves = game.validMoves(squareName);
        moves.forEach((moveName) => highlightValidMove(moveName));
      } else {
        // Otherwise, deselect and re-render
        selectedSquare = null;
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

let game = new Chess();
let selectedSquare = null;

renderBoard();
