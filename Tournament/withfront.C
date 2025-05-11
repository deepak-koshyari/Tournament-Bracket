#include <iostream>
#include <vector>
#include <algorithm>
#include <fstream>
#include "json.hpp"  // Include nlohmann JSON

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
    MatchNode* node = new MatchNode;
    node->p1 = p1;
    node->p2 = p2;
    node->left = nullptr;
    node->right = nullptr;
    node->round = round;
    node->winner = (p1.rank < p2.rank) ? p1 : p2;
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
    if (start == end - 1) {
        MatchNode* match = createMatch(players[start], players[end], round);
        return match;
    }
    if (start == end) {
        MatchNode* solo = new MatchNode;
        solo->p1 = players[start];
        solo->p2 = {"BYE", 999};
        solo->winner = players[start];
        solo->left = nullptr;
        solo->right = nullptr;
        solo->round = round;
        return solo;
    }

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

// Convert bracket tree to JSON
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

    vector<Player> players(n);
    for (int i = 0; i < n; ++i) {
        cout << "Enter name of player " << i + 1 << ": ";
        cin >> players[i].name;
        cout << "Enter rank of " << players[i].name << ": ";
        cin >> players[i].rank;
    }

    sort(players.begin(), players.end(), compareRank);

    int actualPlayers = n;
    int nextPowerOf2 = 1;
    while (nextPowerOf2 < n) nextPowerOf2 *= 2;

    int byeCount = nextPowerOf2 - n;
    for (int i = 0; i < byeCount; ++i) {
        players.push_back({"BYE", 999});
    }

    n = nextPowerOf2;

    vector<int> seedingOrder;
    generateSeedingOrder(n, seedingOrder);

    vector<Player> seededPlayers(n);
    for (int i = 0; i < n; ++i)
        seededPlayers[i] = players[seedingOrder[i] - 1];

    MatchNode* finalBracket = generateBracket(seededPlayers, 0, n - 1, 1);

    // Export to JSON
    json bracketJson = matchToJson(finalBracket);
    ofstream out("bracket.json");
    out << bracketJson.dump(4);  // Pretty print
    out.close();

    cout << "\nBracket saved to bracket.json.\n";

    cleanupTree(finalBracket);
    return 0;
}
