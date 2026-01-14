# Number Path Runner

An educational React.js game where players navigate through a maze by answering math questions correctly.

## Game Overview

**Number Path Runner** is a math-based maze game designed for young learners. Players must answer math questions correctly to move forward through the path. Each correct answer earns coins, and the goal is to reach the finish before time runs out.

## Features

- **Maze Navigation**: Click adjacent tiles to answer questions and move forward
- **Question System**: Questions pulled from a database with multiple choice answers
- **Scoring**: Earn coins for correct answers, bonus coins for completing the level
- **Timer**: Countdown timer adds urgency to gameplay
- **Progress Tracking**: Visual progress bar shows distance to finish
- **Clean UI**: Child-friendly design with smooth animations

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── components/
│   ├── NumberPathRunner.js    # Main game component
│   ├── TopStatusBar.js         # Progress, timer, coins display
│   ├── MazeGrid.js             # Maze grid container
│   ├── PathTile.js             # Individual maze tile
│   ├── PlayerAvatar.js         # Player character (rendered in tile)
│   └── QuestionPanel.js        # Question display modal
├── data/
│   └── questions.js            # Question database
├── utils/
│   └── gameLogic.js            # Maze generation and game utilities
├── App.js                       # Root component
└── index.js                     # Entry point
```

## Game Mechanics

### Movement
- Players start at the top-left tile (🏁)
- Click adjacent tiles (up, down, left, right) to attempt movement
- Each tile click triggers a math question

### Questions
- Questions are selected from the database based on tile position
- Each question has 4 multiple choice options
- Correct answer → player moves to that tile, earns 1 coin
- Wrong answer → player stays in place, no movement

### Scoring
- **+1 coin** for each correct answer
- **+10 bonus coins** for completing the level with time remaining
- **+5 bonus coins** for completing the level after time expires

### Timer
- 60-second countdown per level
- Game ends when timer reaches 0 or player reaches finish
- Timer turns red when ≤ 10 seconds remain

## Question Database Structure

Each question object contains:
```javascript
{
  banner: 'Addition',           // Optional context/hint
  question: 'What is 5 + 3?',   // Question text
  options: ['7', '8', '9', '10'], // MCQ options array
  correctAnswer: '8'             // Correct answer string
}
```

## Customization

### Adjust Maze Size
In `NumberPathRunner.js`, change the `generateMaze()` call:
```javascript
const newMaze = generateMaze(6, 6); // rows, cols
```

### Modify Timer Duration
In `NumberPathRunner.js`, change the initial `timeLeft`:
```javascript
timeLeft: 60, // seconds
```

### Add More Questions
Edit `src/data/questions.js` and add question objects following the same structure.

## Technologies Used

- React 18.2.0
- React Hooks (useState, useEffect, useCallback)
- CSS3 with animations
- Modern ES6+ JavaScript

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

The project uses Create React App. To build for production:

```bash
npm run build
```

## License

This project is created for educational purposes.
