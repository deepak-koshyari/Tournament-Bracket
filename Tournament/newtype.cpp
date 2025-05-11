#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

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
        cout << "Round " << round << " Match: " << players[start].name << " vs " << players[end].name
             << " -> Winner: " << match->winner.name << endl;
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
        cout << "Round " << round << " Match: " << players[start].name << " vs BYE"
             << " → Winner: " << players[start].name << endl;
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

    cout << "Round " << parent->round << " Match: " << parent->p1.name << " vs " << parent->p2.name
         << " -> Winner: " << parent->winner.name << endl;

    return parent;
}

void printBracket(MatchNode* root, int level = 0) {
    if (!root) return;
    printBracket(root->right, level + 1);
    for (int i = 0; i < level; i++) cout << "\t";
    cout << root->p1.name << " vs " << root->p2.name
         << "  Winner: " << root->winner.name
         << " (Round " << root->round << ")" << endl;
    printBracket(root->left, level + 1);
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

    cout << "\nMatch Scheduling Order (Standard Seeding):" << endl;
    for (int i = 0; i < n; i += 2)
        cout << "Match " << (i / 2 + 1) << ": " << seededPlayers[i].name
             << " vs " << seededPlayers[i + 1].name << endl;

    MatchNode* finalBracket = generateBracket(seededPlayers, 0, n - 1, 1);

    cout << "\nTournament Bracket Result:\n";
    printBracket(finalBracket);

    cout << "\n Tournament Winner: " << finalBracket->winner.name
         << " (Rank " << finalBracket->winner.rank << ")" << endl;

    cleanupTree(finalBracket);
    return 0;
}