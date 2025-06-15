#include <iostream>
#include <vector>
#include <algorithm>
#include <fstream>
#include "json.hpp"
#include <string>
#include <map>
#include <stdexcept>

using namespace std;
using json = nlohmann::json;

// Add enum for bracket types
enum class BracketType {
    STANDARD,
    CUSTOM
};

struct Player {
    string name;
    int rank;
};

struct MatchNode {
    Player p1, p2, winner;
    MatchNode* left;
    MatchNode* right;
    int round;
    
    // Destructor to clean up child nodes
    ~MatchNode() {
        delete left;
        delete right;
    }
};

// Add validation function
void validatePlayers(const vector<Player>& players) {
    if (players.empty()) {
        throw runtime_error("No players provided");
    }
    
    // Check for duplicate player names
    map<string, int> nameCount;
    for (const auto& player : players) {
        if (player.name.empty()) {
            throw runtime_error("Player name cannot be empty");
        }
        nameCount[player.name]++;
    }
    
    for (const auto& [name, count] : nameCount) {
        if (count > 1) {
            throw runtime_error("Duplicate player name: " + name);
        }
    }
}

// Add function to update match results
void updateMatch(MatchNode* node, string winnerName) {
    if (!node) return;
    
    // Find the match with the specified winner
    if (node->p1.name == winnerName || node->p2.name == winnerName) {
        // Update the winner
        node->winner = (node->p1.name == winnerName) ? node->p1 : node->p2;
    } else {
        updateMatch(node->left, winnerName);
        updateMatch(node->right, winnerName);
    }
}

// Function to convert bracket to JSON format for frontend
json bracketToJson(MatchNode* node) {
    if (!node) return nullptr;
    
    json match = {
        {"player1", node->p1.name},
        {"player2", node->p2.name},
        {"winner", node->winner.name},
        {"round", node->round}
    };
    
    if (node->left) {
        match["left"] = bracketToJson(node->left);
    }
    if (node->right) {
        match["right"] = bracketToJson(node->right);
    }
    
    return match;
}

// Add function to delete the entire bracket tree
void deleteBracket(MatchNode* node) {
    if (node) {
        delete node;
    }
}

// Function to create custom bracket where first match winner faces last winner
MatchNode* createCustomBracket(const vector<Player>& players) {
    if (players.empty()) return nullptr;
    
    // Create initial matches
    vector<MatchNode*> currentRound;
    for (size_t i = 0; i < players.size(); i++) {
        MatchNode* match = new MatchNode();
        match->p1 = players[i];
        match->p2.name = "bye";  // Add bye as opponent
        match->round = 1;
        currentRound.push_back(match);
    }
    
    int round = 1;
    while (currentRound.size() > 1) {
        vector<MatchNode*> nextRound;
        
        // Handle first match
        MatchNode* firstMatch = currentRound[0];
        MatchNode* lastMatch = currentRound.back();
        
        // Create new match between first and last winners
        MatchNode* newMatch = new MatchNode();
        newMatch->p1 = firstMatch->winner;
        newMatch->p2 = lastMatch->winner;
        newMatch->round = round + 1;
        nextRound.push_back(newMatch);
        
        // Add remaining matches
        for (size_t i = 1; i < currentRound.size() - 1; i++) {
            MatchNode* match = new MatchNode();
            match->p1 = currentRound[i]->winner;
            match->p2.name = "bye";
            match->round = round + 1;
            nextRound.push_back(match);
        }
        
        currentRound = nextRound;
        round++;
    }
    
    return currentRound[0];
}

// Main function for API endpoint
int main() {
    try {
        // Read players from input
        ifstream input("bracket_input.txt");
        if (!input) {
            throw runtime_error("Could not open bracket_input.txt");
        }
        
        vector<Player> players;
        string line;
        while (getline(input, line)) {
            if (line.empty()) continue;
            
            // Parse player data (assuming format: "name rank")
            size_t spacePos = line.find(' ');
            if (spacePos == string::npos) continue;
            
            Player player;
            player.name = line.substr(0, spacePos);
            player.rank = stoi(line.substr(spacePos + 1));
            players.push_back(player);
        }
        
        // Sort players by rank
        sort(players.begin(), players.end(), [](const Player& a, const Player& b) {
            return a.rank < b.rank;
        });
        
        // Create custom bracket
        MatchNode* root = createCustomBracket(players);
        
        // Convert to JSON and write to file
        json bracketJson = bracketToJson(root);
        ofstream output("bracket.json");
        if (output) {
            output << bracketJson.dump(4);
        }
        
        // Clean up
        deleteBracket(root);
        
    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }
    
    return 0;
}