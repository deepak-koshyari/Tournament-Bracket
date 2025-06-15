#include <iostream>
#include <vector>
#include <algorithm>
#include <fstream>
#include "json.hpp"
#include "maze_environment.cpp"

using namespace std;
using json = nlohmann::json;

struct Player {
    string name;
    int rank;
};

struct MatchNode {
    Player p1, p2, winner;
    MatchNode* left;
    MatchNode* right;
    int round;
};

MatchNode* createMatch(Player p1, Player p2, int round) {
    MatchNode* node = new MatchNode{p1, p2, (p1.rank < p2.rank ? p1 : p2), nullptr, nullptr, round};
    return node;
}

bool compareRank(Player a, Player b) {
    return a.rank < b.rank;
}

void generateSeedingOrder(int n, vector<int>& seedingOrder) {
    seedingOrder = {1};
    while (seedingOrder.size() < n) {
        vector<int> next;
        int size = seedingOrder.size() * 2;
        for (int i = 0; i < seedingOrder.size(); ++i) {
            next.push_back(seedingOrder[i]);
            next.push_back(size + 1 - seedingOrder[i]);
        }
        seedingOrder = next;
    }
}    

MatchNode* generateBracket(vector<Player>& players, int start, int end, int round) {
    if (start > end) return nullptr;
    if (start == end - 1) return createMatch(players[start], players[end], round);
    if (start == end) return createMatch(players[start], {"BYE", 999}, round);

    int mid = (start + end) / 2;
    MatchNode* leftSubtree = generateBracket(players, start, mid, round);
    MatchNode* rightSubtree = generateBracket(players, mid + 1, end, round);
    MatchNode* parent = new MatchNode;
    parent->left = leftSubtree;
    parent->right = rightSubtree;
    parent->p1 = leftSubtree->winner;
    parent->p2 = rightSubtree->winner;
    parent->winner = (parent->p1.rank < parent->p2.rank) ? parent->p1 : parent->p2;
    parent->round = round + 1;
    return parent;
}

json matchToJson(MatchNode* node) {
    if (!node) return nullptr;
    return {
        {"p1", node->p1.name},
        {"p2", node->p2.name},
        {"winner", node->winner.name},
        {"round", node->round},
        {"left", matchToJson(node->left)},
        {"right", matchToJson(node->right)}
    };
}

void cleanupTree(MatchNode* root) {
    if (!root) return;
    cleanupTree(root->left);
    cleanupTree(root->right);
    delete root;
}

int main() {
    int n;
    cout << "Enter number of players: ";
    cin >> n;
    vector<string> playerNames(n);
    
    for (int i = 0; i < n; ++i) {
        cout << "Enter name of player " << i + 1 << ": ";
        cin >> playerNames[i];
    }

    // Run maze tournament to get rankings
    json mazeResults = runMazeTournament(playerNames);
    vector<Player> players(n);
    
    // Convert maze results to players with rankings
    for (int i = 0; i < n; ++i) {
        players[i].name = playerNames[i];
        players[i].rank = mazeResults[playerNames[i]]["rank"].get<int>();
    }

    sort(players.begin(), players.end(), compareRank);
    int nextPowerOf2 = 1;
    while (nextPowerOf2 < n) nextPowerOf2 *= 2;
    for (int i = 0; i < nextPowerOf2 - n; ++i) players.push_back({"BYE", 999});

    vector<int> seedingOrder;
    generateSeedingOrder(nextPowerOf2, seedingOrder);
    vector<Player> seededPlayers(nextPowerOf2);
    for (int i = 0; i < nextPowerOf2; ++i) {
        seededPlayers[i] = players[seedingOrder[i] - 1];
    }

    MatchNode* root = generateBracket(seededPlayers, 0, nextPowerOf2 - 1, 0);
    json bracketJson = matchToJson(root);
    cout << "\nGenerated Bracket:\n" << bracketJson.dump(2) << endl;

    cleanupTree(root);
    return 0;
}
