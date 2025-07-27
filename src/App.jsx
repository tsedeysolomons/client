// client/src/App.jsx
import React, { useEffect, useState } from 'react';
import socket from './socket';
import './App.css';

const BINGO_CARD = [
  [5, 12, -1, 37, 50],   // B column (with FREE space)
  [3, 14, 25, 38, 60],   // I column
  [9, 16, -1, 44, 65],   // N column (with FREE space)
  [11, 22, 31, 41, 72],  // G column
  [2, 18, 30, 48, 70]    // O column
];

const getBingoLetter = (number) => {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
};

const App = () => {
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastNumber, setLastNumber] = useState(null);
  const [currentPattern, setCurrentPattern] = useState('line');
  const [bingo, setBingo] = useState(false);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    socket.on('init-game', ({ drawnNumbers, gameActive, currentPattern }) => {
      setDrawnNumbers(drawnNumbers);
      setGameActive(gameActive);
      setCurrentPattern(currentPattern);
    });

    socket.on('number-drawn', (number) => {
      setLastNumber(number);
      setDrawnNumbers(prev => [...prev, number]);
    });

    socket.on('pattern-change', (pattern) => {
      setCurrentPattern(pattern);
    });

    socket.on('game-restart', () => {
      setDrawnNumbers([]);
      setBingo(false);
      setCurrentPattern('line');
      setGameActive(true);
    });

    return () => {
      socket.off('number-drawn');
      socket.off('pattern-change');
      socket.off('game-restart');
    };
  }, []);

  useEffect(() => {
    checkBingo();
  }, [drawnNumbers]);

  const checkBingo = () => {
    // Check if any line is complete (horizontal, vertical, diagonal)
    if (currentPattern === 'line') {
      // Check horizontals
      for (let row = 0; row < 5; row++) {
        if (BINGO_CARD[row].every((num, col) => 
          num === -1 || drawnNumbers.includes(num) || (row === 2 && col === 2))) {
          return setBingo(true);
        }
      }

      // Check verticals
      for (let col = 0; col < 5; col++) {
        if (BINGO_CARD.every((row, rowIdx) => 
          row[col] === -1 || drawnNumbers.includes(row[col]) || (rowIdx === 2 && col === 2))) {
          return setBingo(true);
        }
      }

      // Check diagonals
      if ([0,1,2,3,4].every(i => 
        BINGO_CARD[i][i] === -1 || drawnNumbers.includes(BINGO_CARD[i][i]) || (i === 2)) ||
        [0,1,2,3,4].every(i => 
          BINGO_CARD[i][4-i] === -1 || drawnNumbers.includes(BINGO_CARD[i][4-i]) || (i === 2))) {
        return setBingo(true);
      }
    }

    // Check full house (all numbers marked)
    if (currentPattern === 'full-house') {
      const allMarked = BINGO_CARD.flat().every(num => 
        num === -1 || drawnNumbers.includes(num));
      if (allMarked) setBingo(true);
    }
  };

  const getCellClass = (number, rowIdx, colIdx) => {
    let className = 'cell';
    
    // Free space
    if (number === -1 || (rowIdx === 2 && colIdx === 2)) {
      className += ' free';
    } 
    // Marked number
    else if (drawnNumbers.includes(number)) {
      className += ' marked';
    }
    
    // Last drawn number
    if (number === lastNumber) {
      className += ' last-called';
    }
    
    return className;
  };

  const restartGame = () => {
    socket.emit('restart-game');
  };

  return (
    <div className="app">
      <h1>75-Ball Bingo</h1>
      
      <div className="game-info">
        <div className="last-called">
          {lastNumber ? (
            <>
              <span className="letter">{getBingoLetter(lastNumber)}</span>
              <span className="number">{lastNumber}</span>
            </>
          ) : (
            <span>Let's play!</span>
          )}
        </div>
        <div className="pattern">Current pattern: {currentPattern.replace('-', ' ')}</div>
      </div>

      <div className="bingo-card">
        <div className="header">
          {['B', 'I', 'N', 'G', 'O'].map(letter => (
            <div key={letter} className="header-cell">{letter}</div>
          ))}
        </div>
        
        {[0, 1, 2, 3, 4].map(rowIdx => (
          <div key={rowIdx} className="row">
            {BINGO_CARD.map((col, colIdx) => (
              <div 
                key={colIdx} 
                className={getCellClass(col[rowIdx], rowIdx, colIdx)}
              >
                {col[rowIdx] === -1 ? 'FREE' : col[rowIdx]}
              </div>
            ))}
          </div>
        ))}
      </div>

      {bingo && (
        <div className="bingo-message">
          <div className="bingo-text">BINGO!</div>
          <div className="pattern-text">{currentPattern.replace('-', ' ')}</div>
        </div>
      )}

      <button onClick={restartGame} className="restart-btn">
        New Game
      </button>
    </div>
  );
};

export default App;
