<<<<<<< HEAD
# Tournament Bracket Viewer

A modern, interactive web application for viewing and managing tournament brackets.

## 🛠 How to Run

### 1. Generate the Initial Bracket (C++)

```bash
cd backend
g++ bracket_generator.cpp -o bracket_generator
./bracket_generator
```

### 2. Start the Web Server (Node.js)

```bash
cd server
npm install
npm start
```

### 3. View the Bracket

Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

- `backend/` - C++ bracket generator
  - `bracket_generator.cpp` - Generates tournament brackets
  - `json.hpp` - JSON library for C++
  
- `frontend/` - Original frontend (legacy)
  - `bracket.json` - Generated bracket data
  - `index.html`, `script.js`, `style.css` - Original viewer
  
- `server/` - Modern web application
  - `public/` - Static frontend files
    - `css/styles.css` - Modern styling
    - `js/bracket.js` - Interactive bracket viewer
    - `index.html` - Main HTML page
  - `server.js` - Express server with API endpoints
=======
# Tournament-Bracket
>>>>>>> b14ffc9814ce5a860035d5d0345f6b91c4a75a66
