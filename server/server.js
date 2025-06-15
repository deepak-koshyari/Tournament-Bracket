const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const seedrandom = require('seedrandom');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- MAZE GENERATION ---
function generateMaze(size = 10, seed = null) {
    const rng = seed ? new seedrandom(seed) : Math.random;
    const maze = Array(size).fill().map(() => Array(size).fill(0));
    
    // Add walls (20% chance)
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // Don't place walls at start or end
            if ((i === 0 && j === 0) || (i === size - 1 && j === size - 1)) continue;
            if (rng() < 0.2) {
                maze[i][j] = -1; // Wall
            } else if (rng() < 0.3) {
                maze[i][j] = Math.floor(rng() * 5) + 1; // Reward between 1-5
            }
        }
    }
    
    return maze;
}

// --- A* PATHFINDING ---
function getValidMoves(maze, pos) {
    const moves = [];
    const size = maze.length;
    const directions = [
        { x: 0, y: 1 },  // down
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: -1, y: 0 }  // left
    ];
    
    for (const dir of directions) {
        const newX = pos.x + dir.x;
        const newY = pos.y + dir.y;
        
        // Check bounds and walls
        if (newX >= 0 && newX < size && newY >= 0 && newY < size && maze[newX][newY] !== -1) {
            moves.push({ x: newX, y: newY });
        }
    }
    return moves;
}

function heuristic(a, b) {
    // Use Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function runAStar(maze, playerName, seed) {
    const size = maze.length;
    const startNode = { 
        x: 0, 
        y: 0, 
        g: 0, 
        h: heuristic({ x: 0, y: 0 }, { x: size - 1, y: size - 1 }), 
        f: 0, 
        parent: null,
        reward: maze[0][0] > 0 ? maze[0][0] : 0 // Ensure start point reward is counted
    };
    startNode.f = startNode.h;
    const endPos = { x: size - 1, y: size - 1 };

    const openSet = [startNode];
    const closedSet = new Map(); // Using Map to store nodes by position
    
    // Set up random number generator with seed
    const rng = seedrandom(seed);

    let iterations = 0;
    const maxIterations = size * size * 10; // Scale iterations with maze size
    let bestNode = startNode; // Track best node found so far

    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Sort by f score (g + h)
        openSet.sort((a, b) => a.f - b.f);
        
        const current = openSet.shift();
        closedSet.set(`${current.x},${current.y}`, current);
        
        // Check if we reached the goal
        if (current.x === endPos.x && current.y === endPos.y) {
            return getPlayerResult(current, playerName, iterations, true);
        }
        
        // Update best node if this one is better (lower f score or higher reward if f is equal)
        if (current.f < bestNode.f || (current.f === bestNode.f && current.reward > bestNode.reward)) {
            bestNode = current;
        }
        
        // Generate successors
        const moves = getValidMoves(maze, current);
        
        for (const move of moves) {
            const moveKey = `${move.x},${move.y}`;
            
            // Skip if already in closed set with better or equal f score
            const closedNode = closedSet.get(moveKey);
            if (closedNode) {
                const newG = current.g + 1;
                if (newG >= closedNode.g) continue;
                // Found a better path to this node
                closedSet.delete(moveKey);
            }
            
            const gScore = current.g + 1;
            const hScore = heuristic(move, endPos);
            const fScore = gScore + hScore;
            
            const existingNode = openSet.find(n => n.x === move.x && n.y === move.y);
            if (existingNode) {
                if (gScore >= existingNode.g) continue;
                // Update existing node with better path
                existingNode.g = gScore;
                existingNode.f = fScore;
                existingNode.parent = current;
                existingNode.reward = current.reward + (maze[move.x][move.y] > 0 ? maze[move.x][move.y] : 0);
            } else {
                const node = {
                    x: move.x,
                    y: move.y,
                    g: gScore,
                    h: hScore,
                    f: fScore,
                    parent: current,
                    reward: current.reward + (maze[move.x][move.y] > 0 ? maze[move.x][move.y] : 0)
                };
                openSet.push(node);
            }
        }
    }
    
    // If we get here, we didn't find the goal but return the best path found
    return getPlayerResult(bestNode, playerName, iterations, false);
}

function getPlayerResult(node, playerName, iterations, completed) {
    let totalReward = node.reward;
    let steps = 0;
    
    // Calculate steps and ensure we don't have a circular reference
    const path = [];
    const visited = new Set();
    let current = node;
    
    while (current && !visited.has(`${current.x},${current.y}`)) {
        visited.add(`${current.x},${current.y}`);
        path.unshift({ x: current.x, y: current.y });
        if (current.parent) steps++;
        current = current.parent;
    }
    
    return {
        playerName,
        completed,
        totalReward,
        stepsTaken: steps,
        iterations,
        path
    };
}

// --- BRACKET GENERATION ---
function generateBracket(players, playerStats) {
    // Sort players by score (descending)
    const sortedPlayers = [...playerStats]
        .sort((a, b) => {
            if (b.totalReward !== a.totalReward) {
                return b.totalReward - a.totalReward;
            }
            return a.stepsTaken - b.stepsTaken;
        })
        .map((stat, index) => ({
            ...stat,
            rank: index + 1
        }));

    // Create rounds
    const rounds = [];
    let currentRound = [];
    let currentPlayers = [...sortedPlayers];
    
    // Add BYE if odd number of players
    if (currentPlayers.length % 2 !== 0) {
        currentPlayers.push({
            playerName: 'BYE',
            totalReward: 0,
            stepsTaken: 0,
            rank: currentPlayers.length + 1
        });
    }

    // First round
    for (let i = 0; i < currentPlayers.length; i += 2) {
        const player1 = currentPlayers[i];
        const player2 = currentPlayers[i + 1] || null;
        
        // If one player is BYE, they automatically lose
        const winner = !player2 || player1.playerName === 'BYE' ? 
            (player2 || player1) : 
            (player1.rank < player2.rank ? player1 : player2);
            
        currentRound.push({
            player1: player1.playerName,
            player2: player2?.playerName || null,
            winner: winner.playerName
        });
    }
    rounds.push(currentRound);
    
    // Subsequent rounds
    while (currentRound.length > 1) {
        const nextRound = [];
        
        for (let i = 0; i < currentRound.length; i += 2) {
            const match1 = currentRound[i];
            const match2 = currentRound[i + 1];
            
            if (!match2) {
                // Handle odd number of matches
                nextRound.push(match1);
                break;
            }
            
            const winner1 = sortedPlayers.find(p => p.playerName === match1.winner);
            const winner2 = sortedPlayers.find(p => p.playerName === match2.winner);
            
            const winner = winner1.rank < winner2.rank ? winner1 : winner2;
            
            nextRound.push({
                player1: match1.winner,
                player2: match2.winner,
                winner: winner.playerName
            });
        }
        
        rounds.push(nextRound);
        currentRound = nextRound;
    }
    
    return {
        rounds,
        rankings: sortedPlayers
    };
}

// --- API ENDPOINTS ---
app.post('/api/bracket', async (req, res) => {
    try {
        const { players } = req.body;
        if (!players || !Array.isArray(players) || players.length < 2) {
            return res.status(400).json({ error: 'At least 2 players are required' });
        }

        // Generate unique mazes and solve for each player
        const playerStats = [];
        const baseMaze = generateMaze(10);
        
        for (const player of players) {
            // Create unique maze for each player using player name as seed
            const seed = player.toLowerCase().replace(/\s+/g, '');
            const maze = generateMaze(10, seed);
            
            // Run A* to get player stats
            const stats = await runAStar(maze, player, seed);
            playerStats.push(stats);
        }

        // Generate bracket based on player stats
        const bracket = generateBracket(players, playerStats);
        
        // Create a simple text representation of the base maze
        const mazeDisplay = baseMaze.map(row => 
            row.map(cell => 
                cell === -1 ? '#' : cell === 0 ? '.' : cell
            ).join(' ')
        ).join('\n');

        res.json({
            maze: mazeDisplay,
            rankings: bracket.rankings,
            bracket: bracket
        });

    } catch (error) {
        console.error('Error generating bracket:', error);
        res.status(500).json({ error: 'Failed to generate tournament bracket' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});