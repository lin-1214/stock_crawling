import express from 'express';
import axios from 'axios';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './user';

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

dotenv.config();
const MONGODB_URI = process.env.MONGO_URL || '';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Proxy endpoint for TPEX trading data
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

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.json({ success: false, message: 'User already exists' });
      return;
    }

    const newUser = new User({ username, password });
    await newUser.save();

    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Failed to register' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      res.json({ success: false, message: 'User not found' });
      return;
    }
    if (await user?.comparePassword(password as string)) {
      res.json({ success: true, message: 'Login successful' });
      return;
    } else {
      res.json({ success: false, message: 'Invalid password' });
      return;
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});

// Move the root route handler before other routes
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
