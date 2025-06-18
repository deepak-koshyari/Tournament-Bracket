# Tournament Bracket with Maze Game

A web application that generates single-elimination tournament brackets where players compete by solving randomly generated mazes. The application features a clean, responsive interface and simulates maze-solving competitions between players.

## Features

- **Tournament Bracket Generation**: Automatically generates single-elimination brackets for any number of players
- **Maze Generation**: Creates random mazes with walls and rewards
- **Maze Solving**: Simulates players solving mazes with different strategies
- **Results Tracking**: Tracks scores, path lengths, and completion times
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tournament-bracket-maze
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Mode

To run the application in production mode:

```bash
npm start
```

## Project Structure

```
tournament-bracket-maze/
├── server/                 # Backend server code
│   └── server.js          # Main server file
├── frontend/              # Frontend code
│   ├── index.html         # Main HTML file
│   ├── style.css          # Styles
│   └── script.js          # Frontend JavaScript
├── package.json           # Project dependencies
└── README.md              # This file
```

## API Endpoints

- `POST /api/bracket` - Generate a new tournament bracket
  - Request body: `{ "players": ["Player 1", "Player 2", ...] }`
  - Response: Tournament bracket and maze results

- `GET /api/tournament/:id` - Get tournament by ID
  - Response: Tournament details

## How It Works

1. Users enter player names (one per line) in the input field
2. The system generates a single-elimination tournament bracket
3. For each match, a random maze is generated
4. The system simulates both players solving the maze
5. The player with the higher score (or faster time in case of a tie) advances
6. The tournament continues until a winner is determined

## Maze Rules

- **Start**: Top-left corner (0,0)
- **End**: Bottom-right corner (size-1, size-1)
- **Walls**: Block movement (20% chance per cell)
- **Rewards**: Increase score (1-5 points, 20% chance per cell)
- **Scoring**:
  - Reaching the end: 10 points
  - Collecting rewards: +1 to +5 points per reward
  - Tiebreaker: Faster completion time

## Customization

You can customize the following in `server/server.js`:
- Maze size (default: 10x10)
- Wall generation probability (default: 20%)
- Reward generation probability (default: 20%)
- Score calculation

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
