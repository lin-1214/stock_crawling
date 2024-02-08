import requests
import json
import pandas as pd
import numpy as np
import statistics
import random
from time import sleep
from tqdm import tqdm

# request API
# TWSE
urlTWSE = "https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY"
# TPEX
urlTPEX = "https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php"

f_config = open("./src/config.json")
f_headers = open("./src/headers.json")
config = json.load(f_config)
header_list = json.load(f_headers)

# parse input data
companyCode = config["companyCode"]
website = config["website"]
startYear, startMonth = config["start"].split("-")[0], config["start"].split("-")[1]
endYear, endMonth = config["end"].split("-")[0], config["end"].split("-")[1]

if (len(startYear) != 4) or (len(endYear) != 4) or (len(startMonth) != 2) or (len(endMonth) != 2):
    print("[-]Invalid date format, please use YYYY-MM")
    exit(1)

print(f"[+]Searching for company {companyCode} on {website}...")
print(f"[+]From {startYear}-{startMonth} to {endYear}-{endMonth}...")


dates = []
closingPrices = []
Returns = [0]

# Crawl data
for i in tqdm(range(int(startYear), int(endYear)+1)):
    start = 0
    end = 0
    res = None
    if int(startYear) == int(endYear):
        start, end = int(startMonth), int(endMonth)+1
    elif i == int(startYear):
        start, end = int(startMonth), 13
    elif i == int(endYear):
        start, end = 1, int(endMonth)+1
    else:
        start, end = 1, 13

    for j in range(start, end):
        headers = {'user-agent': header_list[str(random.randint(0, len(header_list)-1))]}
        daily_price_list = []
        tmp = []
        if j < 10:
            j = "0" + str(j)

        if website == "twse":
            res = requests.get(urlTWSE, params={
                "response": "json",
                "date": f"{i}{j}01",
                "stockNo": companyCode
            }, headers=headers)
            daily_price_list = res.json().get("data", [])


        elif website == "tpex":
            res = requests.get(urlTPEX, params={
                "l": "zh-tw",
                "d": f"{i - 1911}/{j}",
                "stkno": companyCode
            }, headers=headers)
            daily_price_list = res.json().get("aaData", [])
            for k in range(len(daily_price_list)):
                if daily_price_list[k][-3] == "--":
                    continue
                else:
                    tmp.append(daily_price_list[k][-3])

        
        if res.status_code != 200:
            print(f"[-]Error response: {res.status_code}")
            exit(1)
        
        # print(daily_price_list)
        dates.extend([daily_price_list[i][0] for i in range(len(daily_price_list))])
        closingPrices.extend(tmp)
        sleep(random.uniform(1, 3))

# Calculate returns & standard deviation
for i in range(1, len(closingPrices)):
    if float(closingPrices[i-1]) == 0:
        Returns.append(0)
    else: 
        Returns.append(np.round((float(closingPrices[i]) - float(closingPrices[i-1])) / float(closingPrices[i-1]), 5))

volatility = statistics.stdev(Returns)
annualized_volatility = np.round(volatility * np.sqrt(len(Returns)), 5)

# Write to csv file
mapping = {"Date": dates, "Closing Price": closingPrices, "Return": Returns}
df = pd.DataFrame(mapping)
df = df.set_index('Date')
df.to_csv(f"./csv/closingPrice/closing_{companyCode}_{startYear}{startMonth}_{endYear}{endMonth}.csv")

print(f"[+]Volatility: {volatility}\n[+]Annualized Volatility: {annualized_volatility}")
print(f"[+]Done crawling closing prices, file saved to ./csv/closingPrice/")



