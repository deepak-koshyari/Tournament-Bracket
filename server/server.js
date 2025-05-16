const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load bracket data from JSON file
const loadBracketData = () => {
  try {
    // First try to load from the server/data directory
    const serverDataPath = path.join(__dirname, 'data', 'bracket.json');
    
    // Check if the file exists in the server/data directory
    if (fs.existsSync(serverDataPath)) {
      const data = fs.readFileSync(serverDataPath, 'utf8');
      return JSON.parse(data);
    }
    
    // Fallback to the original location in the frontend directory
    const frontendPath = path.join(__dirname, '..', 'frontend', 'bracket.json');
    const data = fs.readFileSync(frontendPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading bracket data:', error);
    return null;
  }
};

// Save bracket data to JSON file
const saveBracketData = (data) => {
  try {
    // Create the data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save to the server/data directory
    fs.writeFileSync(
      path.join(__dirname, 'data', 'bracket.json'),
      JSON.stringify(data, null, 2),
      'utf8'
    );
    
    // Also save to the original frontend location for backward compatibility
    fs.writeFileSync(
      path.join(__dirname, '..', 'frontend', 'bracket.json'),
      JSON.stringify(data, null, 2),
      'utf8'
    );
    
    return true;
  } catch (error) {
    console.error('Error saving bracket data:', error);
    return false;
  }
};

// API Routes
app.get('/api/bracket', (req, res) => {
  const bracketData = loadBracketData();
  if (bracketData) {
    res.json(bracketData);
  } else {
    res.status(500).json({ error: 'Failed to load bracket data' });
  }
});

// Update match winner
app.put('/api/bracket/match', (req, res) => {
  const { matchPath, winner } = req.body;
  
  if (!matchPath || !winner) {
    return res.status(400).json({ error: 'Match path and winner are required' });
  }
  
  const bracketData = loadBracketData();
  if (!bracketData) {
    return res.status(500).json({ error: 'Failed to load bracket data' });
  }
  
  // Navigate to the specified match using the path
  // Path format: "root", "root.left", "root.right.left", etc.
  const updateWinner = (node, path) => {
    if (!node) return false;
    
    const parts = path.split('.');
    if (parts.length === 1 && parts[0] === 'root') {
      // We're at the target node
      node.winner = winner;
      return true;
    }
    
    // Navigate down the tree
    if (parts[1] === 'left') {
      return updateWinner(node.left, 'root' + path.substring(path.indexOf('.left') + 5));
    } else if (parts[1] === 'right') {
      return updateWinner(node.right, 'root' + path.substring(path.indexOf('.right') + 6));
    }
    
    return false;
  };
  
  const success = updateWinner(bracketData, matchPath);
  if (success && saveBracketData(bracketData)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to update match winner' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
