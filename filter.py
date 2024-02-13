import requests
import json
import numpy as np
import random
import csv
from time import sleep
from tqdm import tqdm

# Parsing
dt = []
with open("./src/code2name.csv", 'r') as csvfile:
    csvreader = csv.reader(csvfile)
    for row in csvreader:
        dt.append(row)

data_dict = {}
for pair in dt:
    if "\ufeff" in pair[0]:
        pair[0] = pair[0].replace("\ufeff", "")
    
    data_dict[pair[0]] = pair[1]

print(data_dict)