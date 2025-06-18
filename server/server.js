const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const seedrandom = require('seedrandom');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Ensure backend directory exists
const backendDir = path.join(__dirname, '../backend');
if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
}

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- MAZE GENERATION ---
function generateMaze(size = 10, seed = null) {
    try {
        const rng = seed ? new seedrandom(seed) : Math.random;
        const maze = Array(size).fill().map(() => Array(size).fill(0));
        
        // Ensure start and end are always open
        maze[0][0] = 0;
        maze[size-1][size-1] = 0;
        
        // Add walls (15% chance) and rewards (20% of remaining cells)
        let rewardCount = 0;
        const maxRewards = Math.floor(size * size * 0.2);
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                // Skip start and end positions
                if ((i === 0 && j === 0) || (i === size-1 && j === size-1)) continue;
                
                const rand = rng();
                if (rand < 0.15) {
                    maze[i][j] = -1; // Wall
                } else if (rewardCount < maxRewards && rand < 0.3) {
                    maze[i][j] = Math.floor(rng() * 5) + 1; // Rewards 1-5
                    rewardCount++;
                }
            }
        }
        
        // Ensure there's always a valid path from start to end
        const solution = solveMaze(maze);
        if (solution.path.length === 0) {
            console.log('No valid path found, regenerating maze...');
            return generateMaze(size, seed ? seed + 'retry' : null);
        }
        
        return {
            grid: maze,
            start: { x: 0, y: 0 },
            end: { x: size-1, y: size-1 },
            solution: solution.path
        };
    } catch (error) {
        console.error('Error in generateMaze:', error);
        throw new Error('Failed to generate maze: ' + error.message);
    }
}

// --- PATHFINDING ---
function solveMaze(maze) {
    try {
        const size = maze.length;
        const queue = [{ x: 0, y: 0, path: [{x: 0, y: 0}], score: 0 }];
        const visited = new Set(['0,0']);
        
        const directions = [
            { dx: 1, dy: 0 },  // right
            { dx: -1, dy: 0 }, // left
            { dx: 0, dy: 1 },  // down
            { dx: 0, dy: -1 }  // up
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Check if we've reached the end
            if (current.x === size - 1 && current.y === size - 1) {
                return {
                    path: current.path,
                    score: current.score,
                    length: current.path.length
                };
            }
            
            // Explore all directions
            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                const key = `${newX},${newY}`;
                
                // Check if move is valid
                if (newX >= 0 && newX < size && newY >= 0 && newY < size && 
                    maze[newY][newX] !== -1 && !visited.has(key)) {
                    
                    visited.add(key);
                    
                    // Calculate new score (add reward if present)
                    const reward = maze[newY][newX] > 0 ? maze[newY][newX] : 0;
                    
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, { x: newX, y: newY }],
                        score: current.score + reward
                    });
                }
            }
        }
        
        return { path: [], score: 0, length: 0 }; // No path found
    } catch (error) {
        console.error('Error in solveMaze:', error);
        throw new Error('Failed to solve maze: ' + error.message);
    }
}

// --- TOURNAMENT BRACKET ---
function generateBracket(players) {
    try {
        // DEBUG: Log the player order used for the bracket
        console.log('Bracket generation player order (should match maze ranking):', players);
        if (!Array.isArray(players) || players.length < 2) {
            throw new Error('At least 2 players are required');
        }
        // The bracket is generated using the order of players passed in (ranked from maze)
        const sortedPlayers = players.map((name, index) => ({
            name: name.trim(),
            seed: index + 1
        }));
        const matches = [];
        let currentRound = [];
        let roundNumber = 1;
        // --- Classic bye system: next power of two, byes to top seeds ---
        const numPlayers = sortedPlayers.length;
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
        const numByes = nextPowerOfTwo - numPlayers;
        // Assign byes to top seeds
        let seedsWithBye = sortedPlayers.slice(0, numByes);
        let seedsWithoutBye = sortedPlayers.slice(numByes);
        // Pair remaining players: 1 vs N, 2 vs N-1, etc.
        let left = 0, right = seedsWithoutBye.length - 1;
        while (left < right) {
            const match = {
                player1: seedsWithoutBye[left],
                player2: seedsWithoutBye[right],
                winner: null,
                round: 1
            };
            match.winner = (match.player1.seed < match.player2.seed) ? { ...match.player1 } : { ...match.player2 };
            currentRound.push(match);
            left++;
            right--;
        }
        // Odd number of non-bye players: give a bye to the middle seed
        if (left === right) {
            seedsWithBye.push(seedsWithoutBye[left]);
        }
        // Add byes as matches (player2: null)
        for (const player of seedsWithBye) {
            currentRound.push({
                player1: player,
                player2: null,
                winner: { ...player },
                round: 1
            });
        }
        if (currentRound.length > 0) {
            matches.push([...currentRound]);
        }
        // Generate subsequent rounds with proper seeding in each round
        while (currentRound.length > 1) {
            roundNumber++;
            // Sort winners by seed before pairing
            const winners = currentRound.map(m => m.winner).sort((a, b) => a.seed - b.seed);
            const nextRound = [];
            let left = 0, right = winners.length - 1;
            while (left < right) {
                const match = {
                    player1: winners[left],
                    player2: winners[right],
                    winner: null,
                    round: roundNumber
                };
                match.winner = (match.player1.seed < match.player2.seed) ? { ...match.player1 } : { ...match.player2 };
                nextRound.push(match);
                left++;
                right--;
            }
            if (left === right) {
                const match = {
                    player1: winners[left],
                    player2: null,
                    winner: { ...winners[left] },
                    round: roundNumber
                };
                nextRound.push(match);
            }
            if (nextRound.some(m => m.player1 || m.player2)) {
                matches.push([...nextRound]);
            }
            currentRound = nextRound;
        }
        // Set the winner for the final match if not already set
        if (currentRound.length === 1 && !currentRound[0].winner && currentRound[0].player1) {
            currentRound[0].winner = { ...currentRound[0].player1 };
        }
        const result = {
            players: sortedPlayers,
            rounds: matches,
            winner: currentRound[0]?.winner?.name || 'No winner'
        };
        console.log('Generated bracket:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Error in generateBracket:', error);
        throw new Error('Failed to generate bracket: ' + error.message);
    }
}

// --- SIMULATION ---
async function simulatePlayer(playerName, maze) {
    try {
        // Simulate player solving the maze
        const startTime = Date.now();
        
        // Use the solution path to ensure we always have a valid path
        const solution = solveMaze(maze.grid);
        
        // Add some randomness to the path and score
        const pathLength = solution.path.length;
        const baseScore = Math.max(1, Math.floor(solution.score * (0.7 + Math.random() * 0.6)));
        const timeTaken = Math.floor((Date.now() - startTime) * (0.8 + Math.random() * 0.4));
        
        return {
            playerName,
            mazeSize: maze.grid.length,
            pathLength,
            score: baseScore,
            time: timeTaken,
            maze: maze
        };
    } catch (error) {
        console.error('Error in simulatePlayer:', error);
        throw new Error('Failed to simulate player: ' + error.message);
    }
}

// Helper function to validate players
function validatePlayers(players) {
    if (!players || !Array.isArray(players)) {
        return { valid: false, error: 'Invalid player data format' };
    }
    if (players.length < 2) {
        return { valid: false, error: 'At least 2 players are required' };
    }
    if (players.some(name => !name || typeof name !== 'string' || name.trim().length === 0)) {
        return { valid: false, error: 'All player names must be non-empty strings' };
    }
    return { valid: true };
}

// Helper to convert match tree to rounds array
function treeToRounds(root) {
    if (!root) return [];
    const rounds = [];
    let currentLevel = [root];
    while (currentLevel.length > 0) {
        const nextLevel = [];
        const round = [];
        for (const match of currentLevel) {
            round.push({
                player1: typeof match.player1 === 'object' ? match.player1 : { name: match.player1 },
                player2: typeof match.player2 === 'object' ? match.player2 : (match.player2 ? { name: match.player2 } : null),
                winner: match.winner ? (typeof match.winner === 'object' ? match.winner : { name: match.winner }) : null,
                round: match.round
            });
            if (match.left) nextLevel.push(match.left);
            if (match.right) nextLevel.push(match.right);
        }
        rounds.push(round);
        currentLevel = nextLevel;
    }
    return rounds.reverse(); // So first round is first in array
}

// API endpoint for generating brackets
app.post('/api/bracket', async (req, res) => {
    try {
        const { players } = req.body;
        
        if (!Array.isArray(players) || players.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 players are required'
            });
        }

        const bracket = generateBracket(players);
        
        res.json({
            success: true,
            bracket: bracket
        });
    } catch (error) {
        console.error('Error in /api/bracket:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate tournament bracket'
        });
    }
});

// --- MAZE API ENDPOINT ---
app.post('/api/maze', (req, res) => {
    const { players, size = 10 } = req.body;
    if (!Array.isArray(players) || players.length < 2) {
        return res.status(400).json({ error: 'At least 2 players are required' });
    }
    // Generate maze
    const maze = generateMaze(size);
    // Simulate each player with a randomized DFS path
    const results = players.map((name, idx) => {
        // Clone the maze for each player
        const playerMaze = JSON.parse(JSON.stringify(maze.grid));
        // Use a random seed for each player
        const pathResult = solveMazeRandomDFS(playerMaze, Math.random() + idx);
        // Reward is sum of rewards on path
        let totalReward = 0;
        for (const pos of pathResult.path) {
            const val = playerMaze[pos.y][pos.x];
            if (val > 0) totalReward += val;
        }
        return {
            name,
            totalReward,
            pathLength: pathResult.path.length,
            path: pathResult.path,
            reachedEnd: pathResult.reachedEnd
        };
    });
    // Rank: highest reward first, then path length
    results.sort((a, b) => {
        if (b.totalReward !== a.totalReward) return b.totalReward - a.totalReward;
        return a.pathLength - b.pathLength;
    });
    results.forEach((r, i) => r.rank = i + 1);
    // Save output to file
    const output = { maze: maze.grid, results };
    fs.writeFileSync('maze_results.json', JSON.stringify(output, null, 2), 'utf8');
    res.json({ maze: maze.grid, results });
});

// Randomized DFS that always finds a path from start to end if possible
function solveMazeRandomDFS(maze, seed) {
    const rng = seedrandom(seed);
    const size = maze.length;
    const stack = [{ x: 0, y: 0, path: [{ x: 0, y: 0 }] }];
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    visited[0][0] = true;
    while (stack.length > 0) {
        const current = stack.pop();
        const { x, y, path } = current;
        if (x === size - 1 && y === size - 1) {
            return { path, reachedEnd: true };
        }
        // Get valid moves and shuffle them
        const moves = [];
        if (x > 0 && maze[y][x - 1] !== -1 && !visited[y][x - 1]) moves.push({ x: x - 1, y });
        if (x < size - 1 && maze[y][x + 1] !== -1 && !visited[y][x + 1]) moves.push({ x: x + 1, y });
        if (y > 0 && maze[y - 1][x] !== -1 && !visited[y - 1][x]) moves.push({ x, y: y - 1 });
        if (y < size - 1 && maze[y + 1][x] !== -1 && !visited[y + 1][x]) moves.push({ x, y: y + 1 });
        // Shuffle moves
        for (let i = moves.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [moves[i], moves[j]] = [moves[j], moves[i]];
        }
        for (const move of moves) {
            visited[move.y][move.x] = true;
            stack.push({ x: move.x, y: move.y, path: [...path, { x: move.x, y: move.y }] });
        }
    }
    // If no path found, return the longest path attempted
    return { path: [{ x: 0, y: 0 }], reachedEnd: false };
}

// Serve the frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
});

// Utility function to find an available port
const findAvailablePort = (port, maxAttempts = 10) => {
    return new Promise((resolve, reject) => {
        const server = require('http').createServer();
        
        const tryPort = (currentPort, attemptsLeft) => {
            server.listen(currentPort, '0.0.0.0')
                .on('listening', () => {
                    server.close();
                    resolve(currentPort);
                })
                .on('error', (err) => {
                    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
                        console.log(`Port ${currentPort} is in use, trying next port...`);
                        tryPort(currentPort + 1, attemptsLeft - 1);
                    } else if (attemptsLeft === 0) {
                        reject(new Error('No available ports found'));
                    } else {
                        reject(err);
                    }
                });
        };
        
        tryPort(port, maxAttempts);
    });
};

// Start the server
const startServer = async () => {
    try {
        const availablePort = await findAvailablePort(PORT);
        const server = app.listen(availablePort, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${availablePort}`);
            console.log(`🌐 Access the application at:`);
            console.log(`   Local:   http://localhost:${availablePort}`);
            console.log(`   Network: http://${require('os').networkInterfaces().en0?.[1]?.address || 'localhost'}:${availablePort}`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

        return server;
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer().then(server => {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        console.error('Unhandled Rejection:', err);
        server.close(() => process.exit(1));
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

module.exports = { app, startServer };
