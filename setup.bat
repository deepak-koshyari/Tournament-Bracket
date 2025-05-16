@echo off
echo Setting up Tournament Bracket Viewer...

echo.
echo Step 1: Compiling C++ bracket generator...
cd backend
g++ bracket_generator.cpp -o bracket_generator.exe
if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to compile bracket generator.
  echo Please make sure you have a C++ compiler installed.
  pause
  exit /b 1
)

echo.
echo Step 2: Generating initial bracket data...
bracket_generator.exe < bracket_input.txt
if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to generate bracket data.
  pause
  exit /b 1
)

echo.
echo Step 3: Setting up Node.js server...
echo Note: This requires Node.js to be installed.
echo If you don't have Node.js, please download it from https://nodejs.org/
echo.
echo Press any key to continue if Node.js is installed, or Ctrl+C to cancel.
pause > nul

cd ..\server
echo Installing dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to install Node.js dependencies.
  echo Please make sure Node.js and npm are installed correctly.
  pause
  exit /b 1
)

echo.
echo Setup complete!
echo.
echo To start the server, run:
echo   cd server
echo   npm start
echo.
echo Then open your browser and navigate to: http://localhost:3000
echo.
pause
