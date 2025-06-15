const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// In-memory storage for maze runs with a maximum size
const MAX_MAZE_RUNS = 100;
let mazeRuns = [];
let mazeRunCleanupInterval;

// Store maze configurations
let currentMaze = null;

// Initialize maze run cleanup
function initMazeRunCleanup() {
    mazeRunCleanupInterval = setInterval(() => {
        // Remove runs older than 24 hours
        const now = new Date();
        mazeRuns = mazeRuns.filter(run => {
            const hoursAgo = (now - new Date(run.timestamp)) / (1000 * 60 * 60);
            return hoursAgo < 24;
        });
    }, 60 * 60 * 1000); // Run cleanup every hour
}

// Cleanup maze runs on server shutdown
process.on('SIGTERM', () => {
    if (mazeRunCleanupInterval) {
        clearInterval(mazeRunCleanupInterval);
    }
});

initMazeRunCleanup();

// Generate a new maze and get its state
router.get('/generate', limiter, (req, res) => {
    try {
        const mazeSize = parseInt(req.query.size) || 10;
        
        // Validate maze size
        if (mazeSize < 5 || mazeSize > 20) {
            return res.status(400).json({ 
                error: 'Maze size must be between 5 and 20' 
            });
        }

        const maze = generateMaze(mazeSize);
        currentMaze = maze;
        res.json({ maze });
    } catch (error) {
        console.error('Error generating maze:', error);
        res.status(500).json({ error: error.message });
    }
});

// Run a player through the maze
router.post('/run', limiter, (req, res) => {
    try {
        const { playerName, maze } = req.body;
        
        // Validate input
        if (!playerName || !Array.isArray(maze)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        // Validate maze size
        if (!maze || maze.length < 5 || maze.length > 20) {
            return res.status(400).json({ error: 'Invalid maze size' });
        }

        // Generate unique rewards for this run
        const runResult = runMaze(maze, playerName);
        
        // Store the run with performance metrics
        const runData = {
            id: uuidv4(),
            playerName,
            mazeSize: maze.length,
            totalReward: runResult.totalReward,
            stepsTaken: runResult.stepsTaken,
            completed: runResult.completed,
            timestamp: runResult.timestamp
        };
        
        // Add to maze runs with size limit
        if (mazeRuns.length >= MAX_MAZE_RUNS) {
            mazeRuns.shift(); // Remove oldest run
        }
        mazeRuns.push(runData);
        
        res.json(runData);
    } catch (error) {
        console.error('Error running maze:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get maze run history
router.get('/history', (req, res) => {
    try {
        // Return only the last 50 runs
        const history = mazeRuns.slice(-50).map(run => ({
            id: run.id,
            playerName: run.playerName,
            mazeSize: run.mazeSize,
            totalReward: run.totalReward,
            stepsTaken: run.stepsTaken,
            completed: run.completed,
            timestamp: run.timestamp
        }));
        
        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all maze runs
router.get('/runs', (req, res) => {
    res.json(mazeRuns);
});

// Get player rankings
router.get('/rankings', (req, res) => {
    // Sort players by total reward (ascending) - lower reward means better rank
    const rankings = mazeRuns
        .sort((a, b) => {
            // First by completion status (completed runs first)
            if (a.completed !== b.completed) {
                return a.completed - b.completed;
            }
            // Then by total reward (ascending - lower is better)
            if (a.totalReward !== b.totalReward) {
                return a.totalReward - b.totalReward;
            }
            // Then by steps taken (ascending)
            return a.stepsTaken - b.stepsTaken;
        })
        .map((run, index) => ({
            ...run,
            rank: index + 1
        }));
    res.json(rankings);
});

// Helper functions
function generateMaze(size) {
    const maze = Array(size).fill().map(() => Array(size).fill(0));
    
    // Place walls while ensuring multiple paths
    const start = { x: 0, y: 0 };
    const end = { x: size-1, y: size-1 };
    
    // Create multiple paths
    const paths = [];
    for (let i = 0; i < 3; i++) { // Create 3 different paths
        const path = createPath(size);
        paths.push(path);
    }
    
    // Place walls around paths
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // Place walls with probability based on distance from all paths
            const distances = paths.map(path =>
                Math.min(...path.map(p => Math.abs(p.x - i) + Math.abs(p.y - j))));
            const minDistance = Math.min(...distances);
            const wallProbability = 0.4 - (0.1 * minDistance);
            
            // Place wall if it doesn't block any path
            if (Math.random() < wallProbability) {
                let blocksPath = false;
                for (const path of paths) {
                    if (path.some(p => p.x === i && p.y === j)) {
                        blocksPath = true;
                        break;
                    }
                }
                if (!blocksPath) {
                    maze[i][j] = -1;
                }
            }
        }
    }
    
    // Ensure start and end points are clear
    maze[0][0] = 0;
    maze[size-1][size-1] = 0;
    
    // Add random rewards to cells (except walls)
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (maze[i][j] !== -1) {
                // Random reward between 1-5
                maze[i][j] = Math.floor(Math.random() * 5) + 1;
            }
        }
    }
    
    // Make start and end points special
    maze[0][0] = 10; // Start bonus
    maze[size-1][size-1] = 50; // End bonus
    
    return maze;
}

// Create a path from start to end
function createPath(size) {
    const path = [{ x: 0, y: 0 }];
    let current = { x: 0, y: 0 };
    
    while (current.x !== size-1 || current.y !== size-1) {
        const moves = [
            { x: 1, y: 0 }, // Down
            { x: 0, y: 1 }, // Right
            { x: -1, y: 0 }, // Up
            { x: 0, y: -1 } // Left
        ];
        
        // Choose a random valid move
        const validMoves = moves.filter(move => {
            const newX = current.x + move.x;
            const newY = current.y + move.y;
            return newX >= 0 && newX < size && newY >= 0 && newY < size;
        });
        
        if (validMoves.length === 0) break;
        
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        current = { x: current.x + move.x, y: current.y + move.y };
        path.push(current);
    }
    
    return path;
}

function runMaze(maze, playerName) {
    const size = maze.length;
    const path = [];
    const rewards = [];
    let pos = { x: 0, y: 0 };
    let totalReward = 0;
    let steps = 0;
    const maxSteps = size * size * 2; // Maximum steps allowed

    while (pos.x !== size-1 || pos.y !== size-1) {
        const moves = getValidMoves(maze, pos);
        if (moves.length === 0 || steps >= maxSteps) {
            break;
        }
        
        // Choose a random move (to ensure different paths)
        const randomIndex = Math.floor(Math.random() * moves.length);
        const move = moves[randomIndex];
        const newPos = {
            x: pos.x + move.x,
            y: pos.y + move.y
        };
        
        path.push({
            from: { x: pos.x, y: pos.y },
            to: { x: newPos.x, y: newPos.y },
            move: move
        });
        
        // Get reward from the cell
        const reward = maze[newPos.x][newPos.y];
        rewards.push(reward);
        totalReward += reward;
        
        pos = newPos;
        steps++;
    }

    return {
        playerName,
        path,
        rewards,
        totalReward,
        finalPosition: { x: pos.x, y: pos.y },
        timestamp: new Date().toISOString(),
        completed: pos.x === size-1 && pos.y === size-1,
        stepsTaken: steps,
        mazeSize: size
    };
}

function getValidMoves(maze, pos) {
    const moves = [];
    const size = maze.length;
    
    // Up
    if (pos.x > 0 && maze[pos.x-1][pos.y] !== -1) {
        moves.push({ x: -1, y: 0 });
    }
    // Down
    if (pos.x < size-1 && maze[pos.x+1][pos.y] !== -1) {
        moves.push({ x: 1, y: 0 });
    }
    // Left
    if (pos.y > 0 && maze[pos.x][pos.y-1] !== -1) {
        moves.push({ x: 0, y: -1 });
    }
    // Right
    if (pos.y < size-1 && maze[pos.x][pos.y+1] !== -1) {
        moves.push({ x: 0, y: 1 });
    }
    
    return moves;
}

module.exports = router;
