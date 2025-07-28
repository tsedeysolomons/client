import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:3001");

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [bingoCard, setBingoCard] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastNumber, setLastNumber] = useState(null);
  const [currentPattern, setCurrentPattern] = useState("line");
  const [bingoClaimed, setBingoClaimed] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [winner, setWinner] = useState("");
  const [users, setUsers] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        socket.emit("authenticate", username);
        setPlayerName(username);
        setIsAuthenticated(true);
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    }
  };

  useEffect(() => {
    socket.on("authentication-success", (data) => {
      setBingoCard(data.card);
      setDrawnNumbers(data.drawnNumbers);
    });

    socket.on("number-drawn", (number) => {
      setLastNumber(number);
      setDrawnNumbers((prev) => [...prev, number]);
    });

    socket.on("bingo-claimed", ({ username, pattern }) => {
      setWinner(username);
      setBingoClaimed(true);
      if (username === playerName) {
        setBingoClaimed(true);
      }
    });
    socket.on("users-update", (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off("authentication-success");
      socket.off("number-drawn");
      socket.off("bingo-claimed");
      socket.off("users-update");
    };
  }, [playerName]);
  const getCellClass = (number, rowIdx, colIdx) => {
    let className = "cell";

    if (number === -1 || (rowIdx === 2 && colIdx === 2)) {
      className += " free";
    } else if (drawnNumbers.includes(number)) {
      className += " marked";
    }

    if (number === lastNumber) {
      className += " last-called";
    }

    return className;
  };

  const claimBingo = (pattern) => {
    if (playerName) {
      socket.emit("claim-bingo", { username: playerName, pattern });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h1>Bingo Game Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="user-header">
        <h2>Welcome, {playerName}!</h2>
      </div>

      <div className="game-info">
        <div className="last-called">
          {lastNumber ? (
            <>
              <span className="letter">{getBingoLetter(lastNumber)}</span>
              <span className="number">{lastNumber}</span>
            </>
          ) : (
            <span>Waiting for first number...</span>
          )}
        </div>
        <div className="pattern">Current pattern: {currentPattern}</div>
      </div>

      <div className="bingo-card">
        <div className="header">
          {["B", "I", "N", "G", "O"].map((letter) => (
            <div key={letter} className="header-cell">
              {letter}
            </div>
          ))}
        </div>

        {[0, 1, 2, 3, 4].map((rowIdx) => (
          <div key={rowIdx} className="row">
            {bingoCard.map((col, colIdx) => (
              <div
                key={colIdx}
                className={getCellClass(col[rowIdx], rowIdx, colIdx)}
              >
                {col[rowIdx] === -1 ? "FREE" : col[rowIdx]}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={() => claimBingo("line")} disabled={bingoClaimed}>
          Claim Line BINGO
        </button>
        <button
          onClick={() => claimBingo("full-house")}
          disabled={bingoClaimed}
        >
          Claim Full House
        </button>
      </div>

      {bingoClaimed && (
        <div className="bingo-message">
          {winner === playerName ? (
            <>
              <h2>BINGO! You won with a {currentPattern}!</h2>
              <p>Waiting for host to verify...</p>
            </>
          ) : (
            <h2>
              {winner} claims BINGO with a {currentPattern}!
            </h2>
          )}
        </div>
      )}

      <div className="players-online">
        {Object.keys(users).length > 0 && (
          <div>
            <h3>Players Online:</h3>
            <ul>
              {Object.keys(users).map((user) => (
                <li key={user}>{user}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const getBingoLetter = (number) => {
  if (number <= 15) return "B";
  if (number <= 30) return "I";
  if (number <= 45) return "N";
  if (number <= 60) return "G";
  return "O";
};

export default App;
