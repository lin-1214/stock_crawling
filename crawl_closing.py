import requests
import json
import pandas as pd
import numpy as np
import statistics
import random
from time import sleep
from tqdm import tqdm
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import os

# request API
# TWSE
urlTWSE = "https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY"
# TPEX
urlTPEX = "https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock"

f_config = open("./src/config.json")
f_headers = open("./src/headers.json")
config = json.load(f_config)
header_list = json.load(f_headers)

# set retry
retry_times = 5
retry_backoff_factor = 2
session = requests.Session()
retry = Retry(total=retry_times, backoff_factor = retry_backoff_factor, status_forcelist=[500, 502, 503, 504])
adapter = HTTPAdapter(max_retries = retry)
session.mount("http://", adapter)
session.mount("https://", adapter)


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
        tmp_rate = []
        tmp_date = []
        if j < 10:
            j = "0" + str(j)

        if website == "twse":
            res = session.get(urlTWSE, params={
                "response": "json",
                "date": f"{i}{j}01",
                "stockNo": companyCode
            }, headers=headers, timeout=5)
            if res.status_code != 200:
                print(f"[-]Error response: {res.status_code}")
                exit(1)
            daily_price_list = res.json().get("data", [])
            dates.extend([daily_price_list[i][0] for i in range(len(daily_price_list))])
            closingPrices.extend([daily_price_list[i][-3] for i in range(len(daily_price_list))])


        elif website == "tpex":
            res = session.get(urlTPEX, params={
                "code": companyCode,
                "date": f"{i}/{j}/01",
                "response": "json"
                
            }, headers=headers, timeout=5)
            if res.status_code != 200:
                print(f"[-]Error response: {res.status_code}")
                exit(1)

            daily_price_list = res.json()['tables'][0]['data']

            for k in range(len(daily_price_list)):
                if daily_price_list[k][-3] == "--":
                    continue
                else:
                    tmp_rate.append(daily_price_list[k][-3])
                    tmp_date.append(daily_price_list[k][0])
            
            dates.extend(tmp_date)
            closingPrices.extend(tmp_rate)
            

        
        # print(daily_price_list)
        sleep(random.uniform(1, 3))

for i in range(len(closingPrices)):
    closingPrices[i] = closingPrices[i].replace(",", "")

# Calculate returns & standard deviation
for i in range(1, len(closingPrices)):
    if float(closingPrices[i-1]) == 0:
        Returns.append(0)
    else: 
        Returns.append(np.round((float(closingPrices[i]) - float(closingPrices[i-1])) / float(closingPrices[i-1]), 5))

volatility = statistics.stdev(Returns)
annualized_volatility = np.round(volatility * np.sqrt(len(Returns)), 5)

# Before writing to csv file, add these lines to create directories
os.makedirs("./csv/closingPrice", exist_ok=True)

# Write to csv file
mapping = {"Date": dates, "Closing Price": closingPrices, "Return": Returns}
df = pd.DataFrame(mapping)
df = df.set_index('Date')
df.to_csv(f"./csv/closingPrice/closing_{companyCode}_{startYear}{startMonth}_{endYear}{endMonth}.csv")

print(f"[+]Volatility: {volatility}\n[+]Annualized Volatility: {annualized_volatility}")
print(f"[+]Done crawling closing prices, file saved to ./csv/closingPrice/")



