# Tournament Bracket Viewer

A modern, interactive web application for viewing and managing tournament brackets.

## Features

- **Visual Bracket Display**: Hierarchical tree layout showing tournament progression
- **Modern UI**: Clean design with animations and responsive layout
- **API Backend**: Express server providing bracket data via REST API
- **Interactive Elements**: Refresh and view bracket details

## Project Structure

```
server/
├── public/              # Static frontend files
│   ├── css/             # Stylesheets
│   │   └── styles.css   # Main CSS file
│   ├── js/              # JavaScript files
│   │   └── bracket.js   # Frontend logic
│   └── index.html       # Main HTML file
├── server.js            # Express server
└── package.json         # Node.js dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

- `GET /api/bracket` - Get the current bracket data
- `PUT /api/bracket/match` - Update a match winner (optional feature)

## Future Improvements

- Database integration for persistent storage
- User authentication and accounts
- Admin interface for tournament management
- Multiple tournament support
