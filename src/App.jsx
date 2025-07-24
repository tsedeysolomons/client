import React, { useEffect, useState } from "react";
import socket from "./socket";
import "./App.css";

const userCard = [
  5, 20, 29, 37, 50, 3, 14, 25, 38, 60, 9, 16, 34, 44, 65, 11, 22, 31, 41, 72,
  2, 18, 30, 48, 70,
];

const App = () => {
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastNumber, setLastNumber] = useState(null);
  const [winner, setWinner] = useState(false);
  const [username, setUsername] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [winners, setWinners] = useState([]);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    socket.on("number-drawn", (number) => {
      setLastNumber(number);
      setDrawnNumbers((prev) => [...prev, number]);
    });

    socket.on("drawn-numbers", ({ numbers, gameActive }) => {
      setDrawnNumbers(numbers);
      setGameActive(gameActive);
    });

    socket.on("new-winner", (winnerName) => {
      setWinners((prev) => [...prev, winnerName]);
      if (winnerName === username) {
        setWinner(true);
      }
    });

    socket.on("winner-list", (list) => {
      setWinners(list);
    });

    socket.on("game-restarted", () => {
      setDrawnNumbers([]);
      setWinner(false);
      setGameActive(true);
      setWinners([]);
    });

    return () => {
      socket.off("number-drawn");
      socket.off("drawn-numbers");
      socket.off("new-winner");
      socket.off("winner-list");
      socket.off("game-restarted");
    };
  }, [username]);

  useEffect(() => {
    const userNumbersSet = new Set(userCard);
    const matchedNumbers = drawnNumbers.filter((num) =>
      userNumbersSet.has(num)
    ).length;

    if (matchedNumbers >= 5 && gameActive && !winner && username) {
      socket.emit("declare-winner", username);
      setWinner(true);
    }
  }, [drawnNumbers, gameActive, winner, username]);

  const handleStartGame = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit("set-username", username);
      setGameStarted(true);
    }
  };

  const handleRestartGame = () => {
    socket.emit("restart-game");
  };

  if (!gameStarted) {
    return (
      <div className="login-container">
        <h1>Welcome to Bingo Game</h1>
        <form onSubmit={handleStartGame}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            required
          />
          <button type="submit">Start Game</button>
        </form>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Bingo Game</h1>
        <h2>Player: {username}</h2>
        {winners.length > 0 && (
          <div className="winners-list">
            <h3>🏆 Winners:</h3>
            <ul>
              {winners.map((winner, index) => (
                <li key={index}>{winner}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="game-info">
        <h2>Last Number Drawn: {lastNumber || "None yet"}</h2>
        <button onClick={handleRestartGame} className="restart-btn">
          Restart Game
        </button>
      </div>

      <div className="bingo-board">
        {userCard.map((number) => (
          <div
            key={number}
            className={`bingo-cell ${
              drawnNumbers.includes(number) ? "highlighted" : ""
            }`}
          >
            {number}
          </div>
        ))}
      </div>

      {winner && (
        <div className="winner-message">
          <h2>🎉 Congratulations {username}, You Win! 🎉</h2>
        </div>
      )}
    </div>
  );
};

export default App;
