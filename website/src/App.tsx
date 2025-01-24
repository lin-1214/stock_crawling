import { useState } from 'react'
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

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

// Add these social media links and icons (using emoji as placeholders)
const SOCIAL_LINKS = {
  email: {
    url: "mailto:ylin82051@gmail.com",
    icon: <FontAwesomeIcon icon={faEnvelope} />
  },
  linkedin: {
    url: "https://www.linkedin.com/in/lin1214",
    icon: <FontAwesomeIcon icon={faLinkedin} />
  },
  github: {
    url: "https://github.com/lin-1214",
    icon: <FontAwesomeIcon icon={faGithub} />
  }
} as const;

function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    start: "2024-07",
    end: "2024-12",
    companyCode: "2330",
    website: "twse"
  })
  const [shouldAnimate, setShouldAnimate] = useState(false)

  const handleCrawlData = async () => {
    try {
      setLoading(true);
      
      // Remove timeout and directly execute the crawling process
      await (async () => {
        const dates: string[] = [];
        const closingPrices: number[] = [];
        const PERatio: number[] = [];
        const PBRatio: number[] = [];
        
        // Helper function to get random header
        const getRandomHeader = () => {
          return headers[Math.floor(Math.random() * headers.length)];
        };

        // start from year
        for (let i = parseInt(formData.start.split("-")[0]); i < parseInt(formData.end.split("-")[0])+1; i++) {
          let start = 0
          let end = 0
          if (parseInt(formData.start.split("-")[0]) === parseInt(formData.end.split("-")[0])) {
            start = parseInt(formData.start.split("-")[1])
            end = parseInt(formData.end.split("-")[1])+1
          } else if (i === parseInt(formData.start.split("-")[0])) {
            start = parseInt(formData.start.split("-")[1])
            end = 13
          } else if (i === parseInt(formData.end.split("-")[0])) {
            start = 1
            end = parseInt(formData.end.split("-")[1])+1
          } else {
            start = 1
            end = 13
          }

          for (let j = start; j < end; j++) {

            if (formData.website === "twse") {
              const date = `${i}${j < 10 ? "0" + j.toString() : j.toString()}01`;
              const queryParams = new URLSearchParams({
                response: "json",
                date: date,
                stockNo: formData.companyCode
              });

              const targetUrlOne = `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?${queryParams}`
              const res = await fetch(targetUrlOne, {
                method: 'GET',
                headers: {
                  'User-Agent': getRandomHeader()
                }
              });

              if (res.status !== 200) {
                console.error(`Error fetching data for ${date}: ${res.status}`);
                setShowError(`Error fetching data for ${date}: ${res.status}`);
                setTimeout(() => setShowError(null), 3000);
                return;
              }

              const data = await res.json();
              const daily_price_list = data.data;

              for (let k = 0; k < daily_price_list.length; k++) {
                dates.push(daily_price_list[k][0])
                closingPrices.push(parseFloat(daily_price_list[k][6].replace(/,/g, "")))
              }

              const targetUrlTwo = `https://www.twse.com.tw/rwd/zh/afterTrading/BWIBBU?${queryParams}`
              const resTwo = await fetch(targetUrlTwo, {
                method: 'GET',
                headers: {
                  'User-Agent': getRandomHeader()
                }
              });

              if (resTwo.status !== 200) {
                console.error(`Error fetching data for ${date}: ${resTwo.status}`);
                setShowError(`Error fetching data for ${date}: ${resTwo.status}`);
                setTimeout(() => setShowError(null), 3000);
                return;
              }

              const dataTwo = await resTwo.json();
              const daily_ratio_list = dataTwo.data;

              for (let k = 0; k < daily_ratio_list.length; k++) {
                PERatio.push(parseFloat(daily_ratio_list[k][3].replace(/,/g, "")))
                PBRatio.push(parseFloat(daily_ratio_list[k][4].replace(/,/g, "")))
              }

            } else if (formData.website === "tpex") {
              const date = `${i}/${j < 10 ? "0" + j.toString() : j.toString()}/01`
              const queryParams = new URLSearchParams({
                code: formData.companyCode,
                date: date,
                response: "json"
              });

              // Try using a different proxy service
              const proxyUrl = 'https://api.allorigins.win/raw?url=';
              const targetUrl = encodeURIComponent(`https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock?${queryParams}`);
              
              const res = await fetch(proxyUrl + targetUrl, {
                method: 'GET',
                headers: {
                  'User-Agent': getRandomHeader(),
                  'Accept': 'application/json, text/plain, */*',
                  'Referer': 'https://www.tpex.org.tw/',
                }
              });

              if (res.status !== 200) {
                console.error(`Error fetching data for ${date}: ${res.status}`);
                setShowError(`Error fetching data for ${date}: ${res.status}`);
                setTimeout(() => setShowError(null), 3000);
                return;
              }

              const data = await res.json();
              const daily_price_list = data.tables[0].data;

              for (let k = 0; k < daily_price_list.length; k++) {
                dates.push(daily_price_list[k][0])
                closingPrices.push(parseFloat(daily_price_list[k][6].replace(/,/g, "")))
              }

              const proxyUrlTwo = 'https://api.codetabs.com/v1/proxy?quest=';
              const targetUrlTwo = `https://www.tpex.org.tw/www/zh-tw/afterTrading/peQryStock?date=${encodeURIComponent(date)}&code=${encodeURIComponent(formData.companyCode)}&response=json`;
              
              const resTwo = await fetch(proxyUrlTwo + encodeURIComponent(targetUrlTwo), {
                method: 'POST',
                headers: {
                  'User-Agent': getRandomHeader(),
                  'Accept': 'application/json, text/javascript, */*; q=0.01',
                  'Content-Type': 'application/x-www-form-urlencoded',
                }
              });

              if (resTwo.status !== 200) {
                console.error(`Error fetching data for ${date}: ${resTwo.status}`);
                setShowError(`Error fetching data for ${date}: ${resTwo.status}`);
                setTimeout(() => setShowError(null), 3000);
                return;
              }

              const dataTwo = await resTwo.json();

              // console.log(dataTwo)
              const daily_ratio_list = dataTwo.tables[0].data;
              // console.log(daily_ratio_list)

              for (let k = 0; k < daily_ratio_list.length; k++) {
                PERatio.push(parseFloat(daily_ratio_list[k][1].replace(/,/g, "")))
                PBRatio.push(parseFloat(daily_ratio_list[k][4].replace(/,/g, "")))
              }
            }
          }
        }

        

        if (dates.length > 0) {
          // Calculate returns
          const returns = [0]; // First return is always 0
          for (let i = 1; i < closingPrices.length; i++) {
            const previousPrice = closingPrices[i-1];
            const currentPrice = closingPrices[i];
            const return_value = previousPrice === 0 ? 
              0 : 
              Number(((currentPrice - previousPrice) / previousPrice).toFixed(5));
            returns.push(return_value);
          }

          // Calculate volatility
          const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
          const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
          const volatility = Math.sqrt(variance);
          const annualizedVolatility = Number((volatility * Math.sqrt(returns.length)).toFixed(5));

          // Create CSV content with returns
          const csvContent = ['Date,Closing Price,Return,PE Ratio,PB Ratio\n'];
          dates.forEach((date, index) => {
            const price = closingPrices[index];
            const return_value = returns[index];
            const pe_ratio = PERatio[index];
            const pb_ratio = PBRatio[index];
          
            const priceValue = isNaN(price) ? 'NA' : price;
            const peRatioValue = isNaN(pe_ratio) ? 'NA' : pe_ratio;
            const pbRatioValue = isNaN(pb_ratio) ? 'NA' : pb_ratio;

            csvContent.push(`${date},${priceValue},${return_value},${peRatioValue},${pbRatioValue}\n`);
          });

          // Create blob and download link
          const blob = new Blob(csvContent, { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          // Add date range to filename and remove dashes
          const fileName = `stock_data_${formData.companyCode}_${formData.start.replace(/-/g, '')}_${formData.end.replace(/-/g, '')}.csv`;
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          console.log(`Volatility: ${volatility}`);
          console.log(`Annualized Volatility: ${annualizedVolatility}`);
          
          // After successful download, show success message
          setShowSuccess(true);
          // Hide success message after 3 seconds
          setTimeout(() => {
            setShowSuccess(false);
          }, 3000);
        }
        
      })();

    } catch (error) {
      console.error('Error crawling data:', error);
      setShowError(error instanceof Error ? error.message : 'Error crawling data. Please try again.');
      setTimeout(() => setShowError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeClick = () => {
    setShouldAnimate(true);
    setShowWelcome(false);
  };

  const MainPage = () => (
    <div className="main-page">
      {showSuccess && (
        <div className="success-popup">
          File downloaded successfully!
        </div>
      )}
      {showError && (
        <div className="error-popup">
          {showError}
        </div>
      )}
      
      <h1>Stock Data Crawler</h1>
      <div className="form-container">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        <div className={loading ? 'form-inputs disabled' : 'form-inputs'}>
          <div className="input-group">
            <label htmlFor="start">Start Date:</label>
            <input
              type="month"
              id="start"
              value={formData.start}
              onChange={(e) => setFormData({...formData, start: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label htmlFor="end">End Date:</label>
            <input
              type="month"
              id="end"
              value={formData.end}
              onChange={(e) => setFormData({...formData, end: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label htmlFor="companyCode">Company Code:</label>
            <input
              type="text"
              id="companyCode"
              autoFocus
              value={formData.companyCode}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({...prev, companyCode: value}));
              }}
            />
          </div>

          <div className="input-group">
            <label htmlFor="website">Website:</label>
            <select
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
            >
              <option value="twse">TWSE</option>
              <option value="tpex">TPEX</option>
            </select>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleCrawlData} 
          disabled={loading}
        >
          {loading ? 'Crawling...' : 'Start Crawling'}
        </button>
      </div>

      <footer className="contact-info">
        <div className="social-links">
          {Object.entries(SOCIAL_LINKS).map(([platform, { url, icon }]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              {icon}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )

  return (
    <div className="app-container">
      {showWelcome ? (
        <div className="welcome-page" onClick={handleWelcomeClick}>
          <h1>Welcome</h1>
          <p>Click to continue</p>
        </div>
      ) : (
        <div className={`main-page ${shouldAnimate ? 'animate' : ''}`}>
          <MainPage />
        </div>
      )}
    </div>
  )
}

export default App
