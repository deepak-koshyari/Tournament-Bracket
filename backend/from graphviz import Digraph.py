from graphviz import Digraph

# Create a bracket diagram using Graphviz
bracket = Digraph(format='png')
bracket.attr(rankdir='LR', size='10')

# Round 1 (Play-in matches)
bracket.node('A', 'Match A:\nSeed 7 (h)\nvs\nSeed 10 (d)')
bracket.node('B', 'Match B:\nSeed 8 (i)\nvs\nSeed 9 (a)')

# Quarterfinals
bracket.node('Q1', 'QF1:\nSeed 1 (f)\nvs\nWinner B')
bracket.node('Q2', 'QF2:\nSeed 4 (b)\nvs\nSeed 5 (g)')
bracket.node('Q3', 'QF3:\nSeed 2 (c)\nvs\nWinner A')
bracket.node('Q4', 'QF4:\nSeed 3 (e)\nvs\nSeed 6 (j)')

# Semifinals
bracket.node('S1', 'SF1:\nWinner QF1\nvs\nWinner QF2')
bracket.node('S2', 'SF2:\nWinner QF3\nvs\nWinner QF4')

# Final
bracket.node('F', 'Final:\nWinner SF1\nvs\nWinner SF2')

# Edges from Round 1 to QFs
bracket.edge('B', 'Q1')
bracket.edge('A', 'Q3')

# QF to SF
bracket.edge('Q1', 'S1')
bracket.edge('Q2', 'S1')
bracket.edge('Q3', 'S2')
bracket.edge('Q4', 'S2')

# SF to Final
bracket.edge('S1', 'F')
bracket.edge('S2', 'F')

# Render the bracket diagram
output_path = "/mnt/data/tournament_bracket_diagram.png"
bracket.render(filename=output_path, cleanup=True)
output_path
