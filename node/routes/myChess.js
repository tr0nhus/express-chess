import { start } from "repl";

export default function Chess() {
  this.black = { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" };
  this.white = { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" };
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

  this.moveHistory = [];

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

  this.move = async function ({ from, to, attackTarget = "" }) {
    // Function for moving a piece and updating the board
    const fromSquare = this.getSquare(from);
    const fromPieceColor = this._getPieceColor(fromSquare);
    const toSquare = this.getSquare(to);
    const specials =
      attackTarget || this._isEnemyPiece(toSquare, fromPieceColor)
        ? ["attack"]
        : [];

    if (!fromSquare || !toSquare || !fromSquare.piece) {
      console.error(
        "Invalid 'from' or 'to' square, or no piece on 'from' square.",
      );
      return false;
    }

    if (fromPieceColor !== this.turn) {
      console.error(`Not ${fromPieceColor}'s turn to move`);
      return false;
    }

    const fromPieceType = fromSquare.piece;
    const fromSquareName = fromSquare.name;
    const toSquareName = toSquare.name;

    if (attackTarget) {
      const attackTargetSquare = this.getSquare(attackTarget);
      attackTargetSquare.piece = "";
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

    if (this._isKingInCheck(this.turn)) specials.push("check");

    this._saveMove(
      fromPieceColor,
      fromPieceType,
      fromSquareName,
      toSquareName,
      specials,
    );

    // TODO: Handle special moves like castling, en passant, pawn promotion.
    // TODO: Check for check/checkmate/stalemate after the move.

    return true;
  };

  this._saveMove = function (
    fromPieceColor,
    fromPieceType,
    fromSquareName,
    toSquareName,
    specials = [],
  ) {
    // if (this._isEnemyPiece(toSquare, fromPieceColor)) {
    //   specials.push("attack");
    // }
    this.moveHistory.push({
      color: fromPieceColor,
      piece: fromPieceType,
      from: fromSquareName,
      to: toSquareName,
      specials: specials,
    });
  };

  this.possibleMoves = function (squareName) {
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

    return possibleMoves;
  };

  this.validMoves = function (squareName) {
    const possibleMoves = this.possibleMoves(squareName);
    const pieceColor = this._getPieceColor(this.getSquare(squareName));

    return possibleMoves.filter((move) => {
      const startSquare = this.getSquare(squareName);
      const targetSquare = this.getSquare(move.target);
      const movingPiece = startSquare.piece;
      const capturedPiece = targetSquare.piece;

      // Simulate moving
      targetSquare.piece = startSquare.piece; // Move the piece
      startSquare.piece = ""; // Clear the original square

      const isKingSafe = !this._isKingInCheck(pieceColor);

      startSquare.piece = movingPiece;
      targetSquare.piece = capturedPiece;

      return isKingSafe;
    });
  };

  this._isKingInCheck = function (playerColor) {
    const possibleOpponentMoves = [];
    const kingPiece = playerColor === "white" ? this.white.k : this.black.k;
    let kingSquare = null;
    const opponentColor = playerColor === "white" ? "black" : "white";

    const pieceMap = opponentColor === "white" ? this.white : this.black;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (this.board[i][j].piece === kingPiece) kingSquare = this.board[i][j];

        if (Object.values(pieceMap).includes(this.board[i][j].piece)) {
          possibleOpponentMoves.push(
            ...this.possibleMoves(this.board[i][j].name),
          );
        }
      }
    }
    return possibleOpponentMoves.some(
      (move) => move.target === kingSquare.name,
    );
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
        moves.push({
          target: oneStepForwardName,
          attack: this._isEnemyPiece(oneStepForwardName),
        });

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
              moves.push({
                target: twoStepsForwardName,
                attack: this._isEnemyPiece(twoStepsForwardName),
              });
            }
          }
        }
      }
    }
    // Diagonal moves
    const diags = [-1, 1];
    for (const offset of diags) {
      const diagName = this._getSquareName(row + direction, col + offset);
      if (diagName) {
        const diagSquare = this.getSquare(diagName);
        if (diagSquare && this._isEnemyPiece(diagSquare, pieceColor)) {
          moves.push({ target: diagName, attack: true });
        }
      }
    }
    // en passant
    if (this.moveHistory.length > 0) {
      const lastMove = this.moveHistory[this.moveHistory.length - 1];
      const lastMovePieceMap =
        lastMove.color === "white" ? this.white : this.black;

      // Check if last move was a double pawn push
      if (
        lastMove.piece === lastMovePieceMap.p &&
        Math.abs(
          this._getCoords(lastMove.from).row - this._getCoords(lastMove.to).row,
        ) === 2
      ) {
        const lastMoveCoords = this._getCoords(lastMove.to);
        // Check if the double-pushed pawn is on an adjacent column in the same row
        if (
          lastMoveCoords.row === row &&
          Math.abs(lastMoveCoords.col - col) === 1
        ) {
          // The en passant target square is the square the pawn skipped over
          const enPassantTargetName = this._getSquareName(
            row + direction,
            lastMoveCoords.col,
          );
          moves.push({
            target: enPassantTargetName,
            attack: true,
            enPessentTarget: lastMove.to,
          });
        }
      }
    }

    return moves;
  };

  this._isGameOver = function () {
    // Find the white king and all the possible moves of that king
    // Then find all possible moves of white pieces and check if the king can move to safety
    // Repeat for other player
    // Some logic for determining if pieces can be moved to protect the king???
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
          moves.push({
            target: targetName,
            attack: true,
          });
          break;
        }

        moves.push({
          target: targetName,
          attack: false,
        });
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

      moves.push({
        target: targetName,
        attack: this._isEnemyPiece(targetSquare, pieceColor),
      });
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
          moves.push({
            target: targetName,
            attack: true,
          });
          break;
        }

        moves.push({
          target: targetName,
          attack: false,
        });
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
          moves.push({
            target: targetName,
            attack: true,
          });
          break;
        }

        moves.push({
          target: targetName,
          attack: false,
        });
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

      moves.push({
        target: targetName,
        attack: this._isEnemyPiece(targetSquare, pieceColor),
      });
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
