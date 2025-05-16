/**
 * Tournament Bracket Viewer
 * 
 * This script handles the rendering and interaction with the tournament bracket.
 * It loads bracket data from the server API and renders it as a hierarchical tree.
 */

// Configuration
const API_URL = '/api/bracket';
const ANIMATION_DELAY = 50; // ms between each match animation

// DOM Elements
const bracketContainer = document.getElementById('bracket');
const loadingElement = document.getElementById('loading');
const refreshButton = document.getElementById('refresh-btn');
const matchTemplate = document.getElementById('match-template');

// State
let bracketData = null;

/**
 * Fetch bracket data from the server
 */
async function fetchBracketData() {
  showLoading(true);
  
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    bracketData = await response.json();
    renderBracket(bracketData);
  } catch (error) {
    console.error('Error fetching bracket data:', error);
    showError('Failed to load bracket data. Please try again later.');
  } finally {
    showLoading(false);
  }
}

/**
 * Show or hide the loading indicator
 */
function showLoading(show) {
  loadingElement.style.display = show ? 'flex' : 'none';
}

/**
 * Show an error message in the bracket container
 */
function showError(message) {
  bracketContainer.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Calculate the maximum depth of the bracket tree
 */
function calculateMaxDepth(node, currentDepth = 0) {
  if (!node) return currentDepth - 1;
  
  const leftDepth = calculateMaxDepth(node.left, currentDepth + 1);
  const rightDepth = calculateMaxDepth(node.right, currentDepth + 1);
  
  return Math.max(leftDepth, rightDepth);
}

/**
 * Group matches by round number
 */
function groupMatchesByRound(node, rounds = {}, path = 'root') {
  if (!node) return rounds;
  
  // Initialize the round array if it doesn't exist
  if (!rounds[node.round]) {
    rounds[node.round] = [];
  }
  
  // Add this match to its round
  rounds[node.round].push({
    ...node,
    path // Store the path to this node for updates
  });
  
  // Process child nodes
  if (node.left) {
    groupMatchesByRound(node.left, rounds, `${path}.left`);
  }
  
  if (node.right) {
    groupMatchesByRound(node.right, rounds, `${path}.right`);
  }
  
  return rounds;
}

/**
 * Render the bracket as a hierarchical structure
 */
function renderBracket(data) {
  if (!data) return;
  
  // Clear the bracket container
  bracketContainer.innerHTML = '';
  
  // Group matches by round
  const roundsMap = groupMatchesByRound(data);
  const rounds = Object.keys(roundsMap).sort((a, b) => a - b);
  
  // Create a container for each round
  rounds.forEach(roundNumber => {
    const roundContainer = document.createElement('div');
    roundContainer.className = 'round';
    
    const roundTitle = document.createElement('div');
    roundTitle.className = 'round-title';
    roundTitle.textContent = `Round ${roundNumber}`;
    roundContainer.appendChild(roundTitle);
    
    // Add each match in this round
    roundsMap[roundNumber].forEach((match, index) => {
      const matchElement = createMatchElement(match, index);
      roundContainer.appendChild(matchElement);
    });
    
    bracketContainer.appendChild(roundContainer);
  });
  
  // Add connection lines using SVG (optional enhancement)
  // This would be implemented here if using SVG for connections
}

/**
 * Create a match element from the template
 */
function createMatchElement(match, index) {
  // Clone the template
  const matchElement = document.importNode(matchTemplate.content, true).querySelector('.match');
  
  // Set animation delay based on index
  matchElement.style.setProperty('--index', index);
  
  // Fill in match data
  matchElement.querySelector('.round-number').textContent = match.round;
  matchElement.querySelector('.player1').textContent = match.p1;
  matchElement.querySelector('.player2').textContent = match.p2;
  matchElement.querySelector('.winner').textContent = match.winner;
  
  // Highlight the winner
  if (match.winner === match.p1) {
    matchElement.querySelector('.player1').classList.add('winner');
  } else if (match.winner === match.p2) {
    matchElement.querySelector('.player2').classList.add('winner');
  }
  
  // Add click handler for updating the winner (optional feature)
  matchElement.addEventListener('click', () => {
    showWinnerSelectionDialog(match);
  });
  
  return matchElement;
}

/**
 * Show a dialog to select the winner of a match
 */
function showWinnerSelectionDialog(match) {
  // This is an optional feature that would allow updating match winners
  // For now, we'll just log the match that was clicked
  console.log('Match clicked:', match);
  
  // Implementation for updating winners would go here
  // It would send a PUT request to /api/bracket/match with the match path and new winner
}

/**
 * Initialize the application
 */
function init() {
  // Fetch initial bracket data
  fetchBracketData();
  
  // Add event listeners
  refreshButton.addEventListener('click', fetchBracketData);
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
