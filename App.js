import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "cyan" },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "yellow",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "purple",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "green",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "red",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "blue",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "orange",
  },
};

const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return TETROMINOS[randomKey];
};

const createEmptyGrid = () =>
  Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));

const rotateMatrix = (matrix) =>
  matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]).reverse());

const GameGrid = ({ grid }) => (
  <View style={styles.grid}>
    {grid.map((row, rowIndex) =>
      row.map((cell, cellIndex) => (
        <View
          key={`${rowIndex}-${cellIndex}`}
          style={[
            styles.cell,
            { backgroundColor: cell || "white", borderColor: "black" },
          ]}
        />
      ))
    )}
  </View>
);

const GameControls = ({ onMove }) => (
  <View style={styles.controls}>
    {["Left", "Rotate", "Right", "Down"].map((direction) => (
      <TouchableOpacity
        key={direction}
        onPress={() => onMove(direction.toLowerCase())}
        style={styles.button}
      >
        <Text>{direction}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const App = () => {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [activePiece, setActivePiece] = useState({
    shape: randomTetromino(),
    pos: { x: 4, y: 0 },
  });
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      movePiece("down");
    }, 500);

    return () => clearInterval(interval);
  }, [activePiece]);

  const drawGrid = () => {
    const newGrid = grid.map((row) => [...row]);
    const { shape, pos } = activePiece;

    shape.shape.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell && newGrid[pos.y + rowIndex]?.[pos.x + colIndex] === 0) {
          newGrid[pos.y + rowIndex][pos.x + colIndex] = shape.color;
        }
      });
    });

    return newGrid;
  };

  const checkCollision = (shape, x, y) => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (
          shape[row][col] &&
          (grid[y + row]?.[x + col] === undefined || grid[y + row][x + col])
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const movePiece = (direction) => {
    if (isGameOver) return;

    const { x, y } = activePiece.pos;
    const shape = activePiece.shape.shape;

    const moves = {
      down: () =>
        !checkCollision(shape, x, y + 1)
          ? setActivePiece({ ...activePiece, pos: { x, y: y + 1 } })
          : mergePiece(),
      left: () =>
        !checkCollision(shape, x - 1, y) &&
        setActivePiece({ ...activePiece, pos: { x: x - 1, y } }),
      right: () =>
        !checkCollision(shape, x + 1, y) &&
        setActivePiece({ ...activePiece, pos: { x: x + 1, y } }),
      rotate: () => {
        const rotatedShape = rotateMatrix(shape);
        !checkCollision(rotatedShape, x, y) &&
          setActivePiece({
            ...activePiece,
            shape: { ...activePiece.shape, shape: rotatedShape },
          });
      },
    };

    moves[direction]?.();
  };

  const mergePiece = () => {
    const newGrid = grid.map((row) => [...row]);
    const { shape, pos } = activePiece;

    shape.shape.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          newGrid[pos.y + rowIndex][pos.x + colIndex] = shape.color;
        }
      });
    });

    setGrid(newGrid);
    clearRows(newGrid);

    const newPiece = randomTetromino();
    const initialPosition = { x: 4, y: 0 };

    if (checkCollision(newPiece.shape, initialPosition.x, initialPosition.y)) {
      setIsGameOver(true);
    } else {
      setActivePiece({ shape: newPiece, pos: initialPosition });
    }
  };

  const clearRows = (newGrid) => {
    const clearedGrid = newGrid.filter((row) => !row.every((cell) => cell));
    const clearedRowCount = GRID_HEIGHT - clearedGrid.length;

    setScore(score + clearedRowCount * 10);
    setGrid([
      ...Array(clearedRowCount).fill(Array(GRID_WIDTH).fill(0)),
      ...clearedGrid,
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Score: {score}</Text>
      {isGameOver ? (
        <Text style={styles.gameOver}>Game Over</Text>
      ) : (
        <GameGrid grid={drawGrid()} />
      )}
      <GameControls onMove={movePiece} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  score: { fontSize: 20, color: "#fff", marginBottom: 10 },
  grid: {
    width: 200,
    height: 400,
    backgroundColor: "gray",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: { width: 20, height: 20, borderWidth: 1 },
  controls: { flexDirection: "row", marginTop: 20 },
  button: {
    margin: 5,
    padding: 10,
    backgroundColor: "lightblue",
    borderRadius: 5,
  },
  gameOver: { fontSize: 30, color: "red" },
});

export default App;
