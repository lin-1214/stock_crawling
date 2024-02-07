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
urlTWSE = "https://www.twse.com.tw/rwd/zh/afterTrading/BWIBBU"
# TPEX
urlTPEX = "https://www.tpex.org.tw/web/stock/aftertrading/peratio_stk/pera_result.php"

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
# price to earning ratio
PERs = []
# price-book ratio
PBRs = []

for i in tqdm(range(int(startYear), int(endYear)+1)):
    headers = {'user-agent': header_list[str(random.randint(0, len(header_list)-1))]}
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
        daily_ratio_list = []
        if j < 10:
            j = "0" + str(j)

        if website == "twse":
            res = requests.get(urlTWSE, params={
                "response": "json",
                "date": f"{i}{j}01",
                "stockNo": companyCode
            }, headers=headers)
            if res.status_code != 200:
                print(f"[-]Error response: {res.status_code}")
                exit(1)
            daily_ratio_list = res.json().get("data", [])
            dates.extend([daily_ratio_list[i][0] for i in range(len(daily_ratio_list))])
            PERs.extend([daily_ratio_list[i][-3] for i in range(len(daily_ratio_list))])
            PBRs.extend([daily_ratio_list[i][-2] for i in range(len(daily_ratio_list))])

        elif website == "tpex":
            res = requests.get(urlTPEX, params={
                "l": "zh-tw",
                "d": f"{i - 1911}/{j}",
                "stkno": companyCode
            }, headers=headers)
            daily_ratio_list = res.json().get("aaData", [])
            if res.status_code != 200:
                print(f"[-]Error response: {res.status_code}")
                exit(1)
            dates.extend([daily_ratio_list[i][0] for i in range(len(daily_ratio_list))])
            PERs.extend([daily_ratio_list[i][1] for i in range(len(daily_ratio_list))])
            PBRs.extend([daily_ratio_list[i][-1] for i in range(len(daily_ratio_list))])
        
        sleep(random.uniform(1, 3))
        
        
        # print(daily_ratio_list)
    # sleep(random.uniform(1, 3))


mapping = {"Date": dates, "Price to earning ratio": PERs, "Price-book ratio": PBRs}
df = pd.DataFrame(mapping)
df = df.set_index('Date')
df.to_csv(f"./csv/ratio/ratio_{companyCode}_{startYear}{startMonth}_{endYear}{endMonth}.csv")
print(f"[+]Done crawling ratio data, file saved to ./csv/ratio/")