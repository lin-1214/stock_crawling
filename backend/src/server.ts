import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const headers = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/117.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.31",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 OPR/101.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 OPR/102.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/118.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/117.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/116.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/116.0"
  ] as const;

app.get('/api/closingTWSE', async (req, res) => {
  try {
    const { code, date } = req.query;
    const targetUrl = `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${date}&stockNo=${code}&response=json`;

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': headers[Math.floor(Math.random() * headers.length)],
        'Accept': 'application/json, text/plain, */*',
      }
    });

    console.log(response.data);

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/closingTPEX', async (req, res) => {
  try {
    const { code, date } = req.query;
    const targetUrl = `https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock?date=${date}&code=${code}&response=json`;

    const response = await axios.get(targetUrl, {
        headers: {
            'User-Agent': headers[Math.floor(Math.random() * headers.length)],
            'Accept': 'application/json, text/plain, */*',
        }
    });

    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/ratioTWSE', async (req, res) => {
  try {
    const { code, date } = req.query;
    const targetUrl = `https://www.twse.com.tw/rwd/zh/afterTrading/BWIBBU?date=${date}&stockNo=${code}&response=json`;

    const response = await axios.get(targetUrl, {
        headers: {
            'User-Agent': headers[Math.floor(Math.random() * headers.length)],
            'Accept': 'application/json, text/plain, */*',
        }
    });

    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/ratioTPEX', async (req, res) => {
  try {
    const { code, date } = req.body;
    const targetUrl = `https://www.tpex.org.tw/www/zh-tw/afterTrading/peQryStock?date=${date}&code=${code}&response=json`;

    const response = await axios.post(targetUrl, null, {
      headers: {
        'User-Agent': headers[Math.floor(Math.random() * headers.length)],
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/indexTWSE', async (req, res) => {
  try {
    const { date } = req.query;
    const targetUrl = `https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_HIST?date=${date}&response=json`;

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': headers[Math.floor(Math.random() * headers.length)],
        'Accept': 'application/json, text/plain, */*',
      }
    });

    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Proxy for Yahoo Finance — global market indices (no API key needed)
app.get('/api/marketIndex', async (req, res) => {
  try {
    const { symbol } = req.query;
    const targetUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo&includePrePost=false`;

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': headers[Math.floor(Math.random() * headers.length)],
        'Accept': 'application/json',
      },
      timeout: 8000,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Market index proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch market index data' });
  }
});

app.use('/', (req, res) => {
  res.send('Server is running');
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
  });
}

// This is important for Vercel
export default app;
