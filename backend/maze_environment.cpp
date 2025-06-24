
#include <iostream>
#include <vector>
#include <random>
#include <limits>
#include "json.hpp"

using namespace std;
using json = nlohmann::json;

const int MAZE_SIZE = 10;
const int MAX_REWARD = 100;

enum Direction { UP, DOWN, LEFT, RIGHT };

struct Position {
    int x, y;
    Position(int x, int y) : x(x), y(y) {}
    bool operator==(const Position& other) const {
        return x == other.x && y == other.y;
    }
};

class MazeEnvironment {
public:
    MazeEnvironment() {
        initializeMaze();
    }

    void initializeMaze() {
        maze = vector<vector<int>>(MAZE_SIZE, vector<int>(MAZE_SIZE, 0));
        // Place walls randomly
        random_device rd;
        mt19937 gen(rd());
        uniform_int_distribution<> dis(0, 1);

        for (int i = 0; i < MAZE_SIZE; i++) {
            for (int j = 0; j < MAZE_SIZE; j++) {
                if (dis(gen) == 1) {
                    maze[i][j] = -1; // Wall
                }
            }
        }
        // Ensure start and end points are clear
        maze[0][0] = 0;
        maze[MAZE_SIZE-1][MAZE_SIZE-1] = 0;
    }

    int getReward(Position pos) {
        if (pos.x < 0 || pos.x >= MAZE_SIZE || pos.y < 0 || pos.y >= MAZE_SIZE) {
            return -10; // Out of bounds hamra total size 10hai to 
        }
        if (maze[pos.x][pos.y] == -1) {
            return -5; // Wall hai
        }
        if (pos.x == MAZE_SIZE-1 && pos.y == MAZE_SIZE-1) {
            return MAX_REWARD; // Goal destination hai
        }
        return 1; // Normal step hai
    }

    bool isValidMove(Position pos, Direction dir) {
        Position newPos = getNextPosition(pos, dir);
        return (newPos.x >= 0 && newPos.x < MAZE_SIZE &&
                newPos.y >= 0 && newPos.y < MAZE_SIZE &&
                maze[newPos.x][newPos.y] != -1);
    }

    Position getNextPosition(Position pos, Direction dir) {
        switch(dir) {
            case UP: return Position(pos.x - 1, pos.y);
            case DOWN: return Position(pos.x + 1, pos.y);
            case LEFT: return Position(pos.x, pos.y - 1);
            case RIGHT: return Position(pos.x, pos.y + 1);
        }
        return pos;
    }

    int evaluatePosition(Position pos, int depth) {
        if (depth == 0) {
            return getReward(pos);
        }

        int bestScore = numeric_limits<int>::min();
        for (int dir = 0; dir < 4; dir++) {
            Position newPos = getNextPosition(pos, static_cast<Direction>(dir));
            if (isValidMove(pos, static_cast<Direction>(dir))) {
                int score = -evaluatePosition(newPos, depth - 1);
                bestScore = max(bestScore, score);
            }
        }
        return bestScore;
    }

    json getMazeState() {
        json state;
        state["maze"] = maze;
        state["start"] = {0, 0};
        state["goal"] = {MAZE_SIZE-1, MAZE_SIZE-1};
        return state;
    }

private:
    vector<vector<int>> maze;
};

class MazePlayer {
public:
    MazePlayer(string name) : name(name), totalReward(0) {}

    void playMaze(MazeEnvironment& env) {
        Position pos(0, 0);
        int depth = 3; // Search depth for Minimax

        while (pos.x != MAZE_SIZE-1 || pos.y != MAZE_SIZE-1) {
            Direction bestMove = getBestMove(env, pos, depth);
            Position newPos = env.getNextPosition(pos, bestMove);
            
            if (env.isValidMove(pos, bestMove)) {
                totalReward += env.getReward(newPos);
                pos = newPos;
            }
        }
    }

    int getTotalReward() const { return totalReward; }
    string getName() const { return name; }

private:
    string name;
    int totalReward;

    Direction getBestMove(MazeEnvironment& env, Position pos, int depth) {
        int bestScore = numeric_limits<int>::min();
        Direction bestMove = UP;

        for (int dir = 0; dir < 4; dir++) {
            Position newPos = env.getNextPosition(pos, static_cast<Direction>(dir));
            if (env.isValidMove(pos, static_cast<Direction>(dir))) {
                int score = env.evaluatePosition(newPos, depth);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = static_cast<Direction>(dir);
                }
            }
        }
        return bestMove;
    }
};

json runMazeTournament(const vector<string>& playerNames) {
    json results;
    MazeEnvironment env;
    vector<MazePlayer> players;

    // Create players
    for (const auto& name : playerNames) {
        players.emplace_back(name);
    }

    // Run maze for each player
    for (auto& player : players) {
        player.playMaze(env);
        results[player.getName()]["total_reward"] = player.getTotalReward();
    }

    // Sort players by total reward
    sort(players.begin(), players.end(), [](const MazePlayer& a, const MazePlayer& b) {
        return a.getTotalReward() > b.getTotalReward();
    });

    // Assign rankings
    for (int i = 0; i < players.size(); i++) {
        results[players[i].getName()]["rank"] = i + 1;
    }

    return results;
}
