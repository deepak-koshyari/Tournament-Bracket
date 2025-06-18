document.addEventListener('DOMContentLoaded', () => {
    const playerInput = document.getElementById('playerNames');
    const generateBtn = document.getElementById('generateButton');
    const bracketSection = document.getElementById('bracket');
    const errorContainer = document.getElementById('errorContainer');
    const apiBaseUrl = 'http://localhost:3001';

    // Debounce helper
    let debounceTimeout = null;
    function debounce(func, delay) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(func, delay);
    }

    // Initialize the application
    // (REMOVED) generateBtn.addEventListener('click', generateTournament);

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.innerHTML = `
            <span>${message}</span>
            <button class="close-button" aria-label="Close error message">&times;</button>
        `;
        
        // Add close button functionality
        const closeButton = errorDiv.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            errorDiv.remove();
        });
        
        // Add to error container
        errorContainer.appendChild(errorDiv);
        
        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode === errorContainer) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Set loading state
    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        generateBtn.classList.toggle('loading', isLoading);
        playerInput.disabled = isLoading;
    }

    // Store last ranked players for bracket generation
    let lastRankedPlayers = null;

    // Maze generation and player ranking
    const generateMazeBtn = document.getElementById('generateMazeBtn');
    const mazeContainer = document.getElementById('mazeContainer');
    const mazeResults = document.getElementById('mazeResults');

    if (generateMazeBtn) {
        generateMazeBtn.addEventListener('click', async () => {
            mazeContainer.innerHTML = '<div class="loading">Generating maze...</div>';
            mazeResults.innerHTML = '';
            const playerNames = playerInput.value
                .split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);
            if (playerNames.length < 2) {
                showError('Please enter at least 2 players');
                mazeContainer.innerHTML = '';
                lastRankedPlayers = null;
                generateBtn.disabled = true;
                return;
            }
            try {
                const response = await fetch(`${apiBaseUrl}/api/maze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ players: playerNames })
                });
                const data = await response.json();
                if (data && data.maze && Array.isArray(data.maze)) {
                    renderMaze(data.maze); // No path highlighted by default
                    renderMazeResults(data.results);
                    // Store ranked players for bracket
                    lastRankedPlayers = data.results.map(r => r.name);
                    generateBtn.disabled = false;
                } else {
                    mazeContainer.innerHTML = '<div class="error">Failed to load maze.</div>';
                    lastRankedPlayers = null;
                    generateBtn.disabled = true;
                }
            } catch (err) {
                mazeContainer.innerHTML = '<div class="error">Error loading maze.</div>';
                lastRankedPlayers = null;
                generateBtn.disabled = true;
            }
        });
    }

    // Only allow bracket generation after maze ranking
    generateBtn.disabled = true;
    generateBtn.addEventListener('click', () => {
        if (!lastRankedPlayers || lastRankedPlayers.length < 2) {
            showError('Please generate maze rankings first!');
            return;
        }
        generateTournamentWithRankedPlayers(lastRankedPlayers);
    });

    // Create confetti effect
    function createConfetti() {
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    // Animate bracket progression
    async function animateBracketProgression(bracketData) {
        const rounds = bracketData.rounds;
        const bracketContainer = document.createElement('div');
        bracketContainer.className = 'bracket-container';
        
        for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
            const round = rounds[roundIndex];
            const roundElement = document.createElement('div');
            roundElement.className = 'round';
            roundElement.style.opacity = '0';
            roundElement.innerHTML = `<h3>${roundIndex === rounds.length - 1 ? 'Final' : `Round ${roundIndex + 1}`}</h3>`;
            
            const matchesContainer = document.createElement('div');
            matchesContainer.className = 'matches';
            
            for (let matchIndex = 0; matchIndex < round.length; matchIndex++) {
                const match = round[matchIndex];
                const matchElement = document.createElement('div');
                matchElement.className = 'match';
                matchElement.style.opacity = '0';
                
                const player1 = match.player1 ? createPlayerElement(match.player1, false) : createPlayerElement(null, false);
                const player2 = match.player2 ? createPlayerElement(match.player2, false, true) : createPlayerElement(null, false, true);
                
                matchElement.innerHTML = `
                    <div class="match-players">
                        ${player1}
                        ${player2}
                    </div>
                `;
                
                matchesContainer.appendChild(matchElement);
            }
            
            roundElement.appendChild(matchesContainer);
            bracketContainer.appendChild(roundElement);
            
            // Animate round entrance
            await new Promise(resolve => setTimeout(resolve, 500));
            roundElement.style.opacity = '1';
            
            // Animate matches
            for (let matchIndex = 0; matchIndex < round.length; matchIndex++) {
                const matchElement = matchesContainer.children[matchIndex];
                await new Promise(resolve => setTimeout(resolve, 300));
                matchElement.style.opacity = '1';
                
                // Animate winner
                if (round[matchIndex].winner) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const winnerElement = matchElement.querySelector(`.player[data-name="${round[matchIndex].winner.name}"]`);
                    if (winnerElement) {
                        winnerElement.classList.add('winner');
                    }
                }
            }
        }
        
        bracketSection.innerHTML = '';
        bracketSection.appendChild(bracketContainer);
        
        // Animate final winner
        if (bracketData.winner && bracketData.winner !== 'No winner') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const winnerElement = document.createElement('div');
            winnerElement.className = 'tournament-winner';
            winnerElement.innerHTML = `🏆 <strong>Tournament Winner:</strong> ${bracketData.winner} 🏆`;
            bracketSection.insertBefore(winnerElement, bracketSection.firstChild);
            
            // Create confetti celebration
            createConfetti();
        }
    }

    // Generate tournament bracket using ranked players
    async function generateTournamentWithRankedPlayers(rankedPlayers) {
        try {
            setLoading(true);
            bracketSection.innerHTML = '<div class="loading">Generating tournament bracket...</div>';
            const response = await fetch(`${apiBaseUrl}/api/bracket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players: rankedPlayers })
            });
            const data = await response.json();
            if (!response.ok || !data.success || !data.bracket || !Array.isArray(data.bracket.rounds)) {
                throw new Error(data.error || 'Failed to generate tournament');
            }
            renderBracket(data.bracket);
        } catch (error) {
            showError(error.message || 'Failed to generate tournament. Please try again.');
            bracketSection.innerHTML = '';
        } finally {
            setLoading(false);
        }
    }

    // Render the tournament bracket
    function renderBracket(bracketData) {
        console.log('DEBUG: bracketData received in renderBracket:', bracketData);
        if (!bracketData || !bracketData.rounds || !Array.isArray(bracketData.rounds)) {
            showError('Invalid bracket data received from server');
            bracketSection.innerHTML = '<div class="error">Failed to generate bracket. Please try again.</div>';
            return;
        }

        const bracketContainer = document.createElement('div');
        bracketContainer.className = 'bracket-container';

        // Create rounds
        bracketData.rounds.forEach((round, roundIndex) => {
            const roundElement = document.createElement('div');
            roundElement.className = 'round';
            roundElement.innerHTML = `<h3>${roundIndex === bracketData.rounds.length - 1 ? 'Final' : `Round ${roundIndex + 1}`}</h3>`;
            
            const matchesContainer = document.createElement('div');
            matchesContainer.className = 'matches';
            
            round.forEach((match, matchIndex) => {
                const matchElement = document.createElement('div');
                matchElement.className = 'match';
                
                const player1 = match.player1 ? createPlayerElement(match.player1, match.winner && match.winner.name === match.player1.name) : createPlayerElement(null, false);
                const player2 = match.player2 ? createPlayerElement(match.player2, match.winner && match.winner.name === match.player2.name) : createPlayerElement(null, false, true);
                
                matchElement.innerHTML = `
                    <div class="match-players">
                        ${player1}
                        ${player2}
                    </div>
                `;
                
                matchesContainer.appendChild(matchElement);
            });
            
            roundElement.appendChild(matchesContainer);
            bracketContainer.appendChild(roundElement);
        });
        
        bracketSection.innerHTML = '';
        bracketSection.appendChild(bracketContainer);
        
        // Add winner announcement if available
        if (bracketData.winner && bracketData.winner !== 'No winner') {
            const winnerElement = document.createElement('div');
            winnerElement.className = 'tournament-winner';
            winnerElement.innerHTML = `🏆 <strong>Tournament Winner:</strong> ${bracketData.winner} 🏆`;
            bracketSection.insertBefore(winnerElement, bracketSection.firstChild);
        }

        // Add visibility classes with delay
        setTimeout(() => {
            const rounds = bracketContainer.querySelectorAll('.round');
            rounds.forEach((round, roundIndex) => {
                setTimeout(() => {
                    round.classList.add('visible');
                    const matches = round.querySelectorAll('.match');
                    matches.forEach((match, matchIndex) => {
                        setTimeout(() => {
                            match.classList.add('visible');
                        }, matchIndex * 100); // 100ms delay between matches
                    });
                }, roundIndex * 300); // 300ms delay between rounds
            });

            // Show tournament winner last
            const winnerElement = bracketSection.querySelector('.tournament-winner');
            if (winnerElement) {
                setTimeout(() => {
                    winnerElement.classList.add('visible');
                }, rounds.length * 300 + 200);
            }
        }, 100);
    }

    // Create player element for the bracket
    function createPlayerElement(player, isWinner, isBye = false) {
        if (isBye) {
            return '<div class="player bye">BYE</div>';
        }
        if (!player) {
            const emptyPlayer = document.createElement('div');
            emptyPlayer.className = 'player empty';
            emptyPlayer.textContent = 'TBD';
            return emptyPlayer.outerHTML;
        }
        const playerDiv = document.createElement('div');
        playerDiv.className = `player ${isWinner ? 'winner' : ''} ${player.name === 'BYE' ? 'bye' : ''}`;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = player.name || 'Unknown';
        playerDiv.appendChild(nameSpan);
        return playerDiv.outerHTML;
    }

    function renderMaze(grid, highlightPath = null) {
        window._lastMazeGrid = grid;
        if (!Array.isArray(grid) || grid.length === 0) {
            mazeContainer.innerHTML = '<div class="error">Invalid maze data.</div>';
            return;
        }
        // Convert path to a set of coordinates for fast lookup
        const pathSet = highlightPath ? new Set(highlightPath.map(p => `${p.x},${p.y}`)) : null;
        const table = document.createElement('table');
        table.className = 'maze-table';
        for (let y = 0; y < grid.length; y++) {
            const row = document.createElement('tr');
            for (let x = 0; x < grid[y].length; x++) {
                const cell = document.createElement('td');
                let isPath = pathSet && pathSet.has(`${x},${y}`);
                if (grid[y][x] === -1) {
                    cell.className = 'maze-wall';
                } else if (y === 0 && x === 0) {
                    cell.className = 'maze-start' + (isPath ? ' maze-winner-path' : '');
                    cell.textContent = 'S';
                } else if (y === grid.length - 1 && x === grid[y].length - 1) {
                    cell.className = 'maze-end' + (isPath ? ' maze-winner-path' : '');
                    cell.textContent = 'E';
                } else if (grid[y][x] > 0) {
                    cell.className = 'maze-reward' + (isPath ? ' maze-winner-path' : '');
                    cell.textContent = grid[y][x];
                } else {
                    cell.className = 'maze-path' + (isPath ? ' maze-winner-path' : '');
                }
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        mazeContainer.innerHTML = '';
        mazeContainer.appendChild(table);
    }

    function renderMazeResults(results) {
        if (!Array.isArray(results) || results.length === 0) {
            mazeResults.innerHTML = '<div class="error">No player results.</div>';
            return;
        }
        let html = `<table class="maze-results-table"><thead><tr><th>Rank</th><th>Player</th><th>Reward</th><th>Path Length</th></tr></thead><tbody>`;
        results.forEach((r, idx) => {
            html += `<tr data-player-idx="${idx}"><td>${r.rank}</td><td class="player-name-cell" style="cursor:pointer;color:#1565c0;text-decoration:underline;">${r.name}</td><td>${r.totalReward}</td><td>${r.pathLength}</td></tr>`;
        });
        html += '</tbody></table>';
        mazeResults.innerHTML = html;
        // Add click event to player names
        const table = mazeResults.querySelector('table');
        if (table) {
            table.querySelectorAll('.player-name-cell').forEach((cell, idx) => {
                cell.addEventListener('click', () => {
                    const player = results[idx];
                    renderMaze(window._lastMazeGrid, player.path);
                });
            });
        }
    }
});