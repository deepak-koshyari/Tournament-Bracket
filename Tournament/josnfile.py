import json

with open("bracket.json", "r") as file:
    data = json.load(file)

print(data)
