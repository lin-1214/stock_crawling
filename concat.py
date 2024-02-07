import pandas as pd
import numpy as np
import statistics

# change to the file path you want to merge
file1 = "./csv/1240_202101_202112.csv"
file2 = "./csv/1240_202201_202209.csv"

dF = pd.concat(map(pd.read_csv, [file1, file2]), ignore_index=True)

Returns = dF.Return.tolist()
volatility = statistics.stdev(Returns)
annualized_volatility = np.round(volatility * np.sqrt(len(Returns)), 5)

companyCode = file1.split("/")[-1].split("_")[0]
start = file1.split("/")[-1].split("_")[1]
end = file2.split("/")[-1].split("_")[2].split(".")[0] 

dF.to_csv(f"./csv/{companyCode}_{start}_{end}.csv", index=False)
print("[+]Done concatenating csv files, file saved to ./csv/")
print(f"[+]Volatility: {volatility}\n[+]Annualized Volatility: {annualized_volatility}")
