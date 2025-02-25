import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope} from '@fortawesome/free-solid-svg-icons';
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

// Create protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated] = useState(() => {
    // Check localStorage or sessionStorage for auth token/status
    return localStorage.getItem('isAuthenticated') === 'true'
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authData, setAuthData] = useState({
    username: '',
    password: '',
    displayName: ''
  })
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState<string | null>(null)
  const [mode, setMode] = useState<'price' | 'ratio' | 'index'>('price')
  const [formData, setFormData] = useState({
    start: "2024-07",
    end: "2024-12",
    companyCode: "2330",
    website: "twse"
  })
  const [shouldAnimate, setShouldAnimate] = useState(false)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (mode === 'index') {
      setFormData(prev => ({ ...prev, website: 'twse' }));
    }
  }, [mode]);

  const handleCrawlData = async () => {
    try {
      setLoading(true);

      // dumb funciton
      console.log(showAuth);

      await (async () => {
        const dates: string[] = [];
        const closingPrices: number[] = [];
        const volume: number[] = [];
        const PERatio: number[] = [];
        const PBRatio: number[] = [];
        const indexValues: number[] = [];

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
              await fetchClosingPrices(date, dates, closingPrices, volume);
            } else if (mode === 'ratio') {
              await fetchRatios(date, dates, PERatio, PBRatio);
            } else if (mode === 'index') {
              await fetchIndexData(date, dates, indexValues);
            }
            
          }
        }

        if (dates.length > 0) {
          if (mode === 'price') {
            downloadPriceData(dates, closingPrices, volume);
          } else if (mode === 'ratio') {
            downloadRatioData(dates, PERatio, PBRatio);
          } else if (mode === 'index') {
            downloadIndexData(dates, indexValues);
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

  const fetchClosingPrices = async (date: string, dates: string[], closingPrices: number[], volume: number[]) => {
    try {
      await delay(100);
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
        volume.push(formData.website === "twse" ? parseFloat(data[k][1].replace(/,/g, "")) : 1000 * parseFloat(data[k][1].replace(/,/g, "")));
      }
    } catch (error) {
      console.error(`Error fetching data for ${date}:`, error);
      setShowError(`Error fetching data for ${date}`);
      setTimeout(() => setShowError(null), 3000);
    }
  };

  const fetchRatios = async (date: string, dates: string[], PERatio: number[], PBRatio: number[]) => {
    try {
      await delay(100);
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

  const fetchIndexData = async (date: string, dates: string[], indexValues: number[]) => {
    try {
      await delay(100);
      const endpoint = '/indexTWSE';
      const response = await instance.get(endpoint, {
        params: {
          date: date,
          code: formData.companyCode
        }
      });

      const data = response.data?.data;

      if (!data) {
        console.error(`No index data received for ${date}`);
        setShowError(`No index data received for ${date}`);
        setTimeout(() => setShowError(null), 3000);
        return;
      }

      for (let k = 0; k < data.length; k++) {
        dates.push(data[k][0]);
        indexValues.push(parseFloat(data[k][4].replace(/,/g, "")));
      }
    } catch (error) {
      console.error(`Error fetching index data for ${date}:`, error);
      setShowError(`Error fetching index data for ${date}`);
      setTimeout(() => setShowError(null), 3000);
    }
  };

  const downloadPriceData = (dates: string[], closingPrices: number[]) => {
    const returns = calculateReturns(closingPrices);
    // const csvContent = ['Date,Closing Price,Return,Volume\n'];
    const csvContent = ['Date,Closing Price,Return\n'];
    
    dates.forEach((date, index) => {
      const price = closingPrices[index];
      const return_value = returns[index];
      // const volume_value = volume[index];
      const priceValue = isNaN(price) ? 'NA' : price;
      // csvContent.push(`${date},${priceValue},${return_value},${volume_value}\n`);
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

  const downloadIndexData = (dates: string[], indexValues: number[]) => {
    // const returns = calculateReturns(indexValues);
    const csvContent = ['Date,Index Value\n'];
    
    dates.forEach((date, index) => {
      const value = indexValues[index];
      // const return_value = returns[index];
      const indexValue = isNaN(value) ? 'NA' : value;
      csvContent.push(`${date},${indexValue}\n`);
    });

    downloadCSV(csvContent, 'index');
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

  const downloadCSV = (csvContent: string[], type: 'price' | 'ratio' | 'index') => {
    const blob = new Blob(csvContent, { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = type === 'index'
      ? `stock_${type}_${formData.start.replace(/-/g, '')}_${formData.end.replace(/-/g, '')}.csv`
      : `stock_${type}_${formData.companyCode}_${formData.start.replace(/-/g, '')}_${formData.end.replace(/-/g, '')}.csv`;
    
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
    setShowAuth(true);
  };

  const handleAuth = async () => {
    // Blur any active input elements
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    try {
      setLoading(true);
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const response = await instance.post(endpoint, authData);
      
      if (response.data?.success) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true'); // Store auth status
        setShowAuth(false);
        setAuthData(prev => ({
          ...prev,
          displayName: response.data.username || prev.username
        }));
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        setShowError(response.data?.message || 'Authentication failed');
        setTimeout(() => setShowError(null), 3000);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if ((error as any).response?.data?.message) {
        setShowError((error as any).response.data.message);
      } else {
        setShowError(authMode === 'login' ? 'Login failed' : 'Registration failed');
      }
      setTimeout(() => setShowError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const AuthPage = () => (
    <div className="auth-page">
      {showError && (
        <div className="error-popup">
          {showError}
        </div>
      )}
      <h1 className="auth-title">
        {authMode === 'login' ? 'Login' : 'Register'}
      </h1>
      <div className="auth-form">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        <div className={`form-inputs ${shouldAnimate ? (authMode === 'login' ? 'slide-in-left' : 'slide-in-right') : ''}`}>
          <div className="input-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              defaultValue={authData.username}
              onBlur={(e) => setAuthData({...authData, username: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              defaultValue={authData.password}
              onBlur={(e) => setAuthData({...authData, password: e.target.value})}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            marginTop: '20px'
          }}>
            <button 
              onClick={handleAuth}
              disabled={loading || !authData.username || !authData.password}
            >
              {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
            </button>
          </div>
          <p style={{ textAlign: 'center' }}>
            {authMode === 'login' 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <button 
              className="auth-toggle"
              onClick={() => {
                setShouldAnimate(true);
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                // Reset animation after it completes
                setTimeout(() => {
                  setShouldAnimate(false);
                }, 500); // Match this with your animation duration
              }}
              disabled={loading}
            >
              {authMode === 'login' ? 'Switch to Register' : 'Switch to Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  const MainPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
      // Clear authentication
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
      
      // Reset all form and UI states
      setAuthData({
        username: '',
        password: '',
        displayName: ''
      });
      setFormData({
        start: "2024-07",
        end: "2024-12",
        companyCode: "2330",
        website: "twse"
      });
      setMode('price');
      setShowWelcome(true);
      setShowAuth(false);
      setShouldAnimate(false);
      setShowSuccess(false);
      setShowError(null);
      setLoading(false);
      
      // Navigate to welcome page
      window.location.href = '/';
    };

    return (
      <div className="main-page-container">
        <button 
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? '×' : '☰'}
        </button>

        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="user-info" style={{ paddingLeft: '60px' }}>
            <div className="user-avatar">
              {authData.displayName.charAt(0).toUpperCase()}
            </div>
            <h3>{authData.displayName}</h3>
          </div>
          
          <div className="sidebar-content">
            <h3>Instructions:</h3>
            <ol>
              <li>Select mode.</li>
              <li>Choose start and end dates, you may scroll on the calendar to select different years.</li>
              <li>Enter company code.</li>
              <li>Select website.</li>
              <li>Make sure the company code matches the website.</li>
              <li>Click "Crawl Data" to download CSV file.</li>
            </ol>
            
            <div className="contact-section">
              <h3>Contact Me:</h3>
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
            </div>
          </div>

          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="main-content">
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
                <button
                  className={`mode-button ${mode === 'index' ? 'active' : ''}`}
                  onClick={() => setMode('index')}
                  type="button"
                >
                  Index
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

              {mode !== 'index' && (
                <>
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
                </>
              )}
            </div>

            <button 
              type="button"
              onClick={handleCrawlData} 
              disabled={loading}
            >
              {loading ? 'Crawling...' : `Crawl ${mode === 'price' ? 'Closing Price' : mode === 'ratio' ? 'PE/PB Ratio' : 'Index'} Data`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          showWelcome ? (
            <div className="welcome-page" onClick={handleWelcomeClick}>
              <h1>Welcome</h1>
              <p>Click to continue</p>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to="/main" replace />
          ) : (
            <div className={`auth-container ${shouldAnimate ? 'animate' : ''}`}>
              <AuthPage />
            </div>
          )
        } />

        <Route path="/main" element={
          <ProtectedRoute>
            <div className={`main-page ${shouldAnimate ? 'animate' : ''}`}>
              <MainPage />
            </div>
          </ProtectedRoute>
        } />

        {/* Catch all unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
