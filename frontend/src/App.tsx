import { useState } from 'react'
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import instance from './src/Api';

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
  const [mode, setMode] = useState<'price' | 'ratio'>('price')
  const [formData, setFormData] = useState({
    start: "2024-07",
    end: "2024-12",
    companyCode: "2330",
    website: "twse"
  })
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false);

  const handleCrawlData = async () => {
    try {
      setLoading(true);
      
      await (async () => {
        const dates: string[] = [];
        const closingPrices: number[] = [];
        const PERatio: number[] = [];
        const PBRatio: number[] = [];

        // start from year
        for (let i = parseInt(formData.start.split("-")[0]); i < parseInt(formData.end.split("-")[0])+1; i++) {
          let start = 0;
          let end = 0;
          if (parseInt(formData.start.split("-")[0]) === parseInt(formData.end.split("-")[0])) {
            start = parseInt(formData.start.split("-")[1]);
            end = parseInt(formData.end.split("-")[1])+1;
          } else if (i === parseInt(formData.start.split("-")[0])) {
            start = parseInt(formData.start.split("-")[1]);
            end = 13;
          } else if (i === parseInt(formData.end.split("-")[0])) {
            start = 1;
            end = parseInt(formData.end.split("-")[1])+1;
          } else {
            start = 1;
            end = 13;
          }

          for (let j = start; j < end; j++) {
            const date = formData.website === "twse" 
              ? `${i}${j < 10 ? "0" + j.toString() : j.toString()}01`
              : `${i}/${j < 10 ? "0" + j.toString() : j.toString()}/01`;

            if (mode === 'price') {
              await fetchClosingPrices(date, dates, closingPrices);
            } else {
              await fetchRatios(date, dates, PERatio, PBRatio);
            }
          }
        }

        if (dates.length > 0) {
          if (mode === 'price') {
            downloadPriceData(dates, closingPrices);
          } else {
            downloadRatioData(dates, PERatio, PBRatio);
          }
          
          setShowSuccess(true);
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

  const fetchClosingPrices = async (date: string, dates: string[], closingPrices: number[]) => {
    try {
      const endpoint = formData.website === "twse" ? '/closingTWSE' : '/closingTPEX';
      const response = await instance.get(endpoint, {
        params: {
          date: date,
          code: formData.companyCode
        }
      });

      const data = formData.website === "twse" 
        ? response.data?.data 
        : response.data?.tables?.[0]?.data;

      if (!data) {
        console.error(`No data received for ${date}`);
        setShowError(`No data received for ${date}`);
        setTimeout(() => setShowError(null), 3000);
        return;
      }

      for (let k = 0; k < data.length; k++) {
        dates.push(data[k][0]);
        closingPrices.push(parseFloat(data[k][6].replace(/,/g, "")));
      }
    } catch (error) {
      console.error(`Error fetching data for ${date}:`, error);
      setShowError(`Error fetching data for ${date}`);
      setTimeout(() => setShowError(null), 3000);
    }
  };

  const fetchRatios = async (date: string, dates: string[], PERatio: number[], PBRatio: number[]) => {
    try {
      const endpoint = formData.website === "twse" ? '/ratioTWSE' : '/ratioTPEX';
      const method = formData.website === "twse" ? 'get' : 'post';
      
      const response = await instance[method](endpoint, 
        method === 'get' 
          ? { params: { date, code: formData.companyCode } }
          : { date, code: formData.companyCode }
      );

      const data = formData.website === "twse" 
        ? response.data?.data 
        : response.data?.tables?.[0]?.data;

      if (!data) {
        console.error(`No ratio data received for ${date}`);
        setShowError(`No ratio data received for ${date}`);
        setTimeout(() => setShowError(null), 3000);
        return;
      }

      for (let k = 0; k < data.length; k++) {
        // Format TWSE date from "113年07月01日" to "113/07/01"
        const formattedDate = formData.website === "twse" 
          ? data[k][0].replace('年', '/').replace('月', '/').replace('日', '')
          : data[k][0];
        dates.push(formattedDate);
        PERatio.push(parseFloat(data[k][formData.website === "twse" ? 3 : 1].replace(/,/g, "")));
        PBRatio.push(parseFloat(data[k][4].replace(/,/g, "")));
      }
    } catch (error) {
      console.error(`Error fetching ratio data for ${date}:`, error);
      setShowError(`Error fetching ratio data for ${date}`);
      setTimeout(() => setShowError(null), 3000);
    }
  };

  const downloadPriceData = (dates: string[], closingPrices: number[]) => {
    const returns = calculateReturns(closingPrices);
    const csvContent = ['Date,Closing Price,Return\n'];
    
    dates.forEach((date, index) => {
      const price = closingPrices[index];
      const return_value = returns[index];
      const priceValue = isNaN(price) ? 'NA' : price;
      csvContent.push(`${date},${priceValue},${return_value}\n`);
    });

    downloadCSV(csvContent, 'price');
  };

  const downloadRatioData = (dates: string[], PERatio: number[], PBRatio: number[]) => {
    const csvContent = ['Date,PE Ratio,PB Ratio\n'];
    
    dates.forEach((date, index) => {
      const pe_ratio = PERatio[index];
      const pb_ratio = PBRatio[index];
      const peRatioValue = isNaN(pe_ratio) ? 'NA' : pe_ratio;
      const pbRatioValue = isNaN(pb_ratio) ? 'NA' : pb_ratio;
      csvContent.push(`${date},${peRatioValue},${pbRatioValue}\n`);
    });

    downloadCSV(csvContent, 'ratio');
  };

  const calculateReturns = (prices: number[]) => {
    const returns = [0];
    for (let i = 1; i < prices.length; i++) {
      const previousPrice = prices[i-1];
      const currentPrice = prices[i];
      const return_value = previousPrice === 0 ? 
        0 : 
        Number(((currentPrice - previousPrice) / previousPrice).toFixed(5));
      returns.push(return_value);
    }
    return returns;
  };

  const downloadCSV = (csvContent: string[], type: 'price' | 'ratio') => {
    const blob = new Blob(csvContent, { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `stock_${type}_${formData.companyCode}_${formData.start.replace(/-/g, '')}_${formData.end.replace(/-/g, '')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <div className="mode-toggle">
            <button
              className={`mode-button ${mode === 'price' ? 'active' : ''}`}
              onClick={() => setMode('price')}
              type="button"
            >
              Closing Price
            </button>
            <button
              className={`mode-button ${mode === 'ratio' ? 'active' : ''}`}
              onClick={() => setMode('ratio')}
              type="button"
            >
              PE/PB Ratio
            </button>
          </div>

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
          {loading ? 'Crawling...' : `Crawl ${mode === 'price' ? 'Closing Price' : 'PE/PB Ratio'} Data`}
        </button>
      </div>

      <div className="tutorial-container">
        <button 
          className="tutorial-button"
          onClick={() => setShowTutorial(!showTutorial)}
          aria-label="Tutorial"
        >
          <FontAwesomeIcon icon={faQuestionCircle} />
        </button>
        
        {showTutorial && (
          <div className="tutorial-popup">
            <h3>Instructions:</h3>
            <ol>
              <li>Select mode.</li>
              <li>Choose start and end dates, you may scroll on the calendar to select different years.</li>
              <li>Enter company code.</li>
              <li>Select website.</li>
              <li>Make sure the company code matches the website.</li>
              <li>Click "Crawl Data" to download CSV file.</li>
            </ol>
            <hr className="tutorial-divider" />
            <div className="tutorial-contact">
              <h3>Contact Me:</h3>
              <div className="tutorial-social-links">
                {Object.entries(SOCIAL_LINKS).map(([platform, { url, icon }]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tutorial-social-link"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
            <button 
              className="close-tutorial"
              onClick={() => setShowTutorial(false)}
            >
              Got it!
            </button>
          </div>
        )}
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
