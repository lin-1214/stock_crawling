import { useState } from 'react'
import './App.css'

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

function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [loading, setLoading] = useState(false)
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
      const dates: string[] = [];
      const closingPrices: number[] = [];
      
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

            const targetUrl = `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?${queryParams}`
            console.log(targetUrl)
            const res = await fetch(targetUrl, {
              method: 'GET',
              headers: {
                'User-Agent': getRandomHeader()
              }
            });

            if (res.status !== 200) {
              console.error(`Error fetching data for ${date}: ${res.status}`);
              alert(`Error fetching data for ${date}: ${res.status}`);
              return;
            }

            const data = await res.json();
            const daily_price_list = data.data;

            for (let k = 0; k < daily_price_list.length; k++) {
              dates.push(daily_price_list[k][0])
              closingPrices.push(parseFloat(daily_price_list[k][6].replace(/,/g, "")))
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
              alert(`Error fetching data for ${date}: ${res.status}`);
              return;
            }

            const data = await res.json();
            const daily_price_list = data.tables[0].data;

            for (let k = 0; k < daily_price_list.length; k++) {
              dates.push(daily_price_list[k][0])
              closingPrices.push(parseFloat(daily_price_list[k][6].replace(/,/g, "")))
            }
          }
        }
      }

      if (dates.length > 0) {
        // Create CSV content
        const csvContent = ['Date,Closing Price\n'];
        dates.forEach((date, index) => {
          const price = closingPrices[index];
          // Check if price is a valid number
          const priceValue = isNaN(price) ? 'NA' : price;
          csvContent.push(`${date},${priceValue}\n`);
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
      }
      
    } catch (error) {
      console.error('Error crawling data:', error);
      alert('Error crawling data. Please check console for details.');
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
      <h1>Stock Data Crawler</h1>
      
      <div className="form-container">
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

        <button 
          type="button"
          onClick={handleCrawlData} 
          disabled={loading}
        >
          {loading ? 'Crawling...' : 'Start Crawling'}
        </button>
      </div>

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
