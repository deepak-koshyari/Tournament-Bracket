function createBracketElement(bracketData) {
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'bracket-container';
    
    // Add title
    const title = document.createElement('h2');
    title.className = 'bracket-title';
    title.textContent = 'Tournament Bracket';
    bracketDiv.appendChild(title);
    
    // Create rounds container
    const roundsContainer = document.createElement('div');
    roundsContainer.className = 'bracket-rounds';
    
    // Create each round
    bracketData.rounds.forEach((round, roundIndex) => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'bracket-round';
        
        // Add round header
        const roundHeader = document.createElement('div');
        roundHeader.className = 'round-header';
        
        const roundTitle = document.createElement('h3');
        roundTitle.textContent = `Round ${roundIndex + 1}`;
        
        const roundMatches = document.createElement('span');
        roundMatches.className = 'round-matches';
        roundMatches.textContent = `${round.length} ${round.length === 1 ? 'Match' : 'Matches'}`;
        
        roundHeader.appendChild(roundTitle);
        roundHeader.appendChild(roundMatches);
        roundDiv.appendChild(roundHeader);
        
        // Add matches container
        const matchesContainer = document.createElement('div');
        matchesContainer.className = 'matches-container';
        
        round.forEach((match, matchIndex) => {
            const matchCard = document.createElement('div');
            matchCard.className = 'match-card';
            
            // Add match header
            const matchHeader = document.createElement('div');
            matchHeader.className = 'match-header';
            matchHeader.textContent = `Match ${matchIndex + 1}`;
            matchCard.appendChild(matchHeader);
            
            // Add players container
            const playersContainer = document.createElement('div');
            playersContainer.className = 'players-container';
            
            // Player 1
            const player1 = createPlayerElement(match.player1 || 'BYE', match.winner === match.player1);
            playersContainer.appendChild(player1);
            
            // VS divider
            if (match.player2) {
                const vsDiv = document.createElement('div');
                vsDiv.className = 'vs-divider';
                vsDiv.textContent = 'VS';
                playersContainer.appendChild(vsDiv);
                
                // Player 2
                const player2 = createPlayerElement(match.player2 || 'BYE', match.winner === match.player2);
                playersContainer.appendChild(player2);
            }
            
            // Add winner banner
            const winnerBanner = document.createElement('div');
            winnerBanner.className = 'winner-banner';
            winnerBanner.textContent = `Winner: ${match.winner}`;
            
            matchCard.appendChild(playersContainer);
            matchCard.appendChild(winnerBanner);
            matchesContainer.appendChild(matchCard);
        });
        
        roundDiv.appendChild(matchesContainer);
        roundsContainer.appendChild(roundDiv);
        
        // Add arrow between rounds (except after last round)
        if (roundIndex < bracketData.rounds.length - 1) {
            const arrowDiv = document.createElement('div');
            arrowDiv.className = 'round-arrow';
            arrowDiv.innerHTML = '→';
            roundsContainer.appendChild(arrowDiv);
        }
    });
    
    bracketDiv.appendChild(roundsContainer);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .bracket-container {
            width: 100%;
            overflow-x: auto;
            padding: 20px 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .bracket-title {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 28px;
            font-weight: 600;
        }
        
        .bracket-rounds {
            display: flex;
            gap: 30px;
            padding: 20px 0;
        }
        
        .bracket-round {
            display: flex;
            flex-direction: column;
            min-width: 280px;
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .round-header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        
        .round-header h3 {
            margin: 0 0 5px 0;
            color: #2c3e50;
            font-size: 18px;
        }
        
        .round-matches {
            font-size: 14px;
            color: #6c757d;
        }
        
        .matches-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .match-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .match-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .match-header {
            background: #2c3e50;
            color: white;
            padding: 8px 15px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .players-container {
            padding: 15px;
        }
        
        .player {
            padding: 12px 15px;
            margin: 8px 0;
            border-radius: 6px;
            background: #f8f9fa;
            font-weight: 500;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
        }
        
        .player.winner {
            background: #d4edda;
            color: #155724;
            font-weight: 600;
        }
        
        .player.winner::after {
            content: '👑';
            margin-left: 10px;
        }
        
        .vs-divider {
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            font-weight: 600;
            margin: 5px 0;
            position: relative;
        }
        
        .vs-divider::before,
        .vs-divider::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 30%;
            height: 1px;
            background: #dee2e6;
        }
        
        .vs-divider::before {
            left: 0;
        }
        
        .vs-divider::after {
            right: 0;
        }
        
        .winner-banner {
            background: #e9ecef;
            padding: 8px 15px;
            font-size: 13px;
            color: #2c3e50;
            font-weight: 500;
            border-top: 1px solid #dee2e6;
        }
        
        .round-arrow {
            display: flex;
            align-items: center;
            font-size: 24px;
            color: #6c757d;
            margin: 0 -15px;
        }
        
        @media (max-width: 768px) {
            .bracket-rounds {
                flex-direction: column;
                gap: 15px;
            }
            
            .bracket-round {
                width: 100%;
                box-sizing: border-box;
            }
            
            .round-arrow {
                transform: rotate(90deg);
                margin: -10px 0;
                justify-content: center;
            }
        }
    `;
    
    bracketDiv.appendChild(style);
    return bracketDiv;
}

// Helper function to create player element
function createPlayerElement(name, isWinner) {
    const playerDiv = document.createElement('div');
    playerDiv.className = `player ${isWinner ? 'winner' : ''}`;
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    
    playerDiv.appendChild(nameSpan);
    return playerDiv;
}

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    const playerNamesInput = document.getElementById('playerNames');
    const bracketDiv = document.getElementById('bracket');
    const mazeResultsDiv = document.getElementById('mazeResults');

    generateButton.addEventListener('click', async () => {
        const namesText = playerNamesInput.value.trim();
        if (!namesText) {
            showError('Please enter at least 2 player names');
            return;
        }

        const players = namesText
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        if (players.length < 2) {
            showError('Please enter at least 2 players');
            return;
        }


        try {
            // Show loading state
            generateButton.disabled = true;
            generateButton.textContent = 'Generating...';
            
            // Clear previous results
            bracketDiv.innerHTML = '<div class="loading">Generating tournament bracket...</div>';
            mazeResultsDiv.innerHTML = '<div class="loading">Preparing maze performance data...</div>';

            // Call the backend API
            const response = await fetch('http://localhost:3000/api/bracket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ players })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Display the bracket
            if (data.bracket) {
                const bracketElement = createBracketElement(data.bracket);
                bracketDiv.innerHTML = '';
                bracketDiv.appendChild(bracketElement);
            }
            
            // Display maze results
            if (data.rankings && data.rankings.length > 0) {
                displayMazeResults(data.rankings, data.maze, mazeResultsDiv);
            }
            
        } catch (error) {
            console.error('Error generating tournament:', error);
            showError(`Failed to generate tournament: ${error.message}`, [bracketDiv, mazeResultsDiv]);
        } finally {
            // Reset button state
            generateButton.disabled = false;
            generateButton.textContent = 'Generate Tournament';
        }
    });
});

function displayMazeResults(rankings, maze, container) {
    container.innerHTML = '';
    
    // Create rankings table
    const resultsTable = document.createElement('table');
    resultsTable.className = 'results-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Rank', 'Player', 'Total Reward', 'Steps Taken'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    resultsTable.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    rankings.forEach(player => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = player.rank || 'N/A';
        row.appendChild(rankCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = player.playerName || 'Unknown';
        row.appendChild(nameCell);
        
        const rewardCell = document.createElement('td');
        rewardCell.textContent = player.totalReward !== undefined ? player.totalReward : '0';
        row.appendChild(rewardCell);
        
        const stepsCell = document.createElement('td');
        stepsCell.textContent = player.stepsTaken !== undefined ? player.stepsTaken : 'N/A';
        row.appendChild(stepsCell);
        
        tbody.appendChild(row);
    });
    
    resultsTable.appendChild(tbody);
    
    // Add maze display if available
    if (maze) {
        const mazeSection = document.createElement('div');
        mazeSection.className = 'maze-display-section';
        
        const mazeTitle = document.createElement('h3');
        mazeTitle.textContent = 'Maze Layout (Example)';
        mazeSection.appendChild(mazeTitle);
        
        const mazePre = document.createElement('pre');
        mazePre.className = 'maze';
        mazePre.textContent = maze;
        mazeSection.appendChild(mazePre);
        
        container.appendChild(mazeSection);
    }
    
    container.appendChild(resultsTable);
}

function showError(message, containers = []) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    if (containers.length > 0) {
        containers.forEach(container => {
            if (container) {
                container.innerHTML = '';
                container.appendChild(errorDiv.cloneNode(true));
            }
        });
    } else {
        document.body.insertBefore(errorDiv, document.querySelector('.container'));
    }
}

// Add styles for the results table and maze display
const styles = document.createElement('style');
styles.textContent = `
    .results-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 0.9em;
        box-shadow: 0 2px 3px rgba(0,0,0,0.1);
    }
    
    .results-table th,
    .results-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .results-table th {
        background-color: #f8f9fa;
        font-weight: 600;
        color: #2c3e50;
    }
    
    .results-table tbody tr:hover {
        background-color: #f5f7fa;
    }
    
    .maze-display-section {
        margin-bottom: 25px;
    }
    
    .maze-display-section h3 {
        color: #2c3e50;
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 1.1em;
    }
    
    .maze {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        white-space: pre;
        overflow-x: auto;
        line-height: 1.3;
        font-size: 14px;
        border: 1px solid #e0e0e0;
    }
    
    @media (max-width: 768px) {
        .results-table {
            display: block;
            overflow-x: auto;
        }
        
        .maze {
            font-size: 12px;
            padding: 10px;
        }
    }
`;

document.head.appendChild(styles);