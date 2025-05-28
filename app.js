const express = require('express');
const fs = require('fs');
const app = express();

// Configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Load a limited word list (for computer's checks)
const words = fs.readFileSync('words.txt', 'utf-8').split('\n').map(w => w.trim());

// Game state
let gameState = {
  letters: [],
  currentPlayer: 'human',
  gameOver: false,
  winner: null,
  waitingForWord: false,
  challengedPlayer: null,
  submittedWord: null
};

// Routes
app.get('/', (req, res) => {
  // Simply redirect to the game route for consistent behavior
  res.redirect('/game');
});

app.get('/game', (req, res) => {
  resetGame();
  
  // In test phase, computer always starts with 3 letters
  computerInitialMove();
  
  // After initial move, it's human's turn
  gameState.currentPlayer = 'human';
  
  res.render('game', { gameState });
});

app.post('/move', (req, res) => {
  if (req.body.action === 'add') {
    // Human adds a letter
    gameState.letters.push(req.body.letter.toUpperCase());
    computerMove();
  } else if (req.body.action === 'reject') {
    // Human challenges computer to form a word
    gameState.challengedPlayer = 'computer';
    
    // Computer tries to find a valid word using EXACTLY all the current letters
    const computerWord = findExactWord(gameState.letters);
    
    if (computerWord) {
      // Computer found a valid word
      gameState.gameOver = true;
      gameState.winner = 'computer';
      gameState.submittedWord = computerWord;
    } else {
      // Computer couldn't find a valid word
      gameState.gameOver = true;
      gameState.winner = 'human';
    }
  }
  
  res.render('game', { gameState });
});

app.post('/submit-word', (req, res) => {
  const word = req.body.word.toUpperCase();
  gameState.submittedWord = word;
  
  // Check if the word uses EXACTLY all the current letters
  const isValid = isExactWord(word, gameState.letters);
  
  // Determine winner based on who was challenged
  if (gameState.challengedPlayer === 'human') {
    // Human was challenged and needs to provide a word
    if (isValid) {
      gameState.gameOver = true;
      gameState.winner = 'human';
    } else {
      gameState.gameOver = true;
      gameState.winner = 'computer';
    }
  } else {
    // Computer was challenged but human is submitting a word (shouldn't happen)
    gameState.gameOver = true;
    gameState.winner = 'computer'; // Default to computer win for invalid flow
  }
  
  res.render('game', { gameState });
});

// Helper functions
function resetGame() {
  gameState = {
    letters: [],
    currentPlayer: 'human',
    gameOver: false,
    winner: null,
    waitingForWord: false,
    challengedPlayer: null,
    submittedWord: null
  };
}

function computerInitialMove() {
  // Computer starts with 3 reasonable letters
  const starters = ['CAT', 'DOG', 'SUN', 'CAR', 'BAT'];
  const letters = starters[Math.floor(Math.random() * starters.length)].split('');
  gameState.letters = letters;
}

function computerMove() {
  // Simple AI: 30% chance to reject, otherwise add random letter
  if (Math.random() < 0.3) {
    // Computer challenges human to form a word
    gameState.challengedPlayer = 'human';
    gameState.waitingForWord = true;
    gameState.currentPlayer = 'human';
  } else {
    // Computer adds a random letter
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    gameState.letters.push(randomLetter);
    gameState.currentPlayer = 'human';
  }
}

function findExactWord(letters) {
  // Try to find a valid word using EXACTLY all the current letters
  for (const word of words) {
    if (isExactWord(word.toUpperCase(), [...letters])) {
      return word.toUpperCase();
    }
  }
  return null; // No valid word found
}

function isExactWord(word, availableLetters) {
  // Word must use exactly all available letters (no more, no less)
  
  // First check: word length must match number of available letters
  if (word.length !== availableLetters.length) {
    return false;
  }
  
  // Create a copy of the letters array to avoid modifying the original
  const lettersCopy = [...availableLetters];
  
  // Check if each letter in the word exists in the available letters
  for (const char of word) {
    const index = lettersCopy.indexOf(char);
    if (index === -1) return false;
    lettersCopy.splice(index, 1); // Remove the used letter
  }
  
  // If we've used all letters and the word is in our dictionary, it's valid
  return lettersCopy.length === 0 && words.includes(word.toLowerCase());
}

function checkWord(word, letters) {
  // This is now replaced by isExactWord for consistency
  return isExactWord(word, letters);
}

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
