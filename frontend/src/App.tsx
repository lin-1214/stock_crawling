import { useState, useEffect, useRef } from 'react'
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import instance from './src/Api'

// ── Types ────────────────────────────────────────────────────────────────────
type AppTab = 'markets' | 'lookup' | 'crawler'

interface IndexConfig { symbol: string; name: string; region: string }

interface MarketIndexData {
  symbol: string; name: string; region: string
  price: number; changePct: number; closes: number[]
  error?: boolean
}

interface OHLCRow { date: string; open: string; high: string; low: string; close: string }

interface StockStats { latest: number; high: number; low: number; change: number; avgRet: number }

interface Toast { type: 'success' | 'error'; message: string }

// ── Index config ─────────────────────────────────────────────────────────────
const FEATURED_INDICES: IndexConfig[] = [
  { symbol: '^TWII',     name: 'TAIEX',    region: 'TW' },
  { symbol: '^GSPC',     name: 'S&P 500',  region: 'US' },
  { symbol: '^IXIC',     name: 'NASDAQ',   region: 'US' },
  { symbol: '^DJI',      name: 'DOW JONES',region: 'US' },
]

const OTHER_INDICES: IndexConfig[] = [
  { symbol: '^N225',     name: 'NIKKEI 225',  region: 'JP' },
  { symbol: '^FTSE',     name: 'FTSE 100',    region: 'UK' },
  { symbol: '^GDAXI',    name: 'DAX',          region: 'DE' },
  { symbol: '^HSI',      name: 'HANG SENG',   region: 'HK' },
  { symbol: '^KS11',     name: 'KOSPI',        region: 'KR' },
  { symbol: '000001.SS', name: 'SSE COMP',     region: 'CN' },
]

// ── Constants ─────────────────────────────────────────────────────────────────
const SOCIAL_LINKS = {
  email:    { url: 'mailto:ylin82051@gmail.com',           icon: <FontAwesomeIcon icon={faEnvelope} /> },
  linkedin: { url: 'https://www.linkedin.com/in/lin1214',  icon: <FontAwesomeIcon icon={faLinkedin} /> },
  github:   { url: 'https://github.com/lin-1214',          icon: <FontAwesomeIcon icon={faGithub} /> },
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTWSE(y: number, m: number) { return `${y}${String(m).padStart(2,'0')}01` }
function fmtTPEX(y: number, m: number) { return `${y}/${String(m).padStart(2,'0')}/01` }

function fmtPrice(v: number): string {
  return v >= 1000
    ? v.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseYahooData(data: any, cfg: IndexConfig): MarketIndexData {
  const result = data?.chart?.result?.[0]
  const meta   = result?.meta
  const rawCloses: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
  const closes  = rawCloses.filter((c): c is number => c !== null && !isNaN(c as number))
  const price   = meta?.regularMarketPrice ?? closes[closes.length - 1] ?? 0
  const prev    = meta?.chartPreviousClose ?? meta?.previousClose ?? closes[closes.length - 2] ?? price
  const changePct = prev ? Number(((price - prev) / prev * 100).toFixed(2)) : 0
  return { symbol: cfg.symbol, name: cfg.name, region: cfg.region, price, changePct, closes }
}

function parseIndexTWSE(raw: string[][]): OHLCRow[] {
  return raw.map(r => ({ date: r[0], open: r[1], high: r[2], low: r[3], close: r[4] }))
}
function parseClosingTWSE(raw: string[][]): OHLCRow[] {
  return raw.map(r => ({ date: r[0], open: r[3]??'—', high: r[4]??'—', low: r[5]??'—', close: r[6] }))
}
function parseClosingTPEX(raw: string[][]): OHLCRow[] {
  return raw.map(r => ({ date: r[0], open: r[3]??'—', high: r[4]??'—', low: r[5]??'—', close: r[6] }))
}
function calcReturns(prices: number[]) {
  return prices.map((p, i) =>
    i === 0 ? 0 : prices[i-1] === 0 ? 0 : Number(((p - prices[i-1]) / prices[i-1]).toFixed(5))
  )
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values, isPositive, uid }: { values: number[]; isPositive: boolean; uid: string }) {
  const valid = values.filter(v => !isNaN(v))
  if (valid.length < 2) return <div className="sparkline" />
  const min = Math.min(...valid), max = Math.max(...valid)
  const range = max - min || 1
  const W = 200, H = 56, PAD = 2
  const pts = valid.map((v, i) => [
    (i / (valid.length - 1)) * W,
    H - PAD - ((v - min) / range) * (H - PAD * 2)
  ])
  const line = pts.map(([x, y], i) => `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const color = isPositive ? '#4ade80' : '#f87171'
  const gid = `sg${uid}`
  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// ── IndexCard ─────────────────────────────────────────────────────────────────
function IndexCard({ cfg, data, featured, loading }: {
  cfg: IndexConfig; data: MarketIndexData | null; featured?: boolean; loading?: boolean
}) {
  const cardClass = `index-card ${featured ? 'featured' : ''} ${loading ? 'loading' : ''}`
  if (loading) return (
    <div className={cardClass}>
      <div className="idx-region">{cfg.region}</div>
      <div className="idx-name">{cfg.name}</div>
      <div className="idx-price clr-muted">──────</div>
      <div className="idx-change clr-muted">LOADING<span className="blink-cursor">█</span></div>
      <div className="sparkline" />
    </div>
  )
  if (!data || data.error) return (
    <div className={`${cardClass} error`}>
      <div className="idx-region">{cfg.region}</div>
      <div className="idx-name">{cfg.name}</div>
      <div className="idx-price clr-muted">N/A</div>
      <div className="idx-change clr-error">UNAVAILABLE</div>
    </div>
  )
  const isPos = data.changePct >= 0
  const uid = cfg.symbol.replace(/[^a-zA-Z0-9]/g, '')
  return (
    <div className={cardClass}>
      <div className="idx-header">
        <span className="idx-region">{cfg.region}</span>
        <span className="idx-name">{cfg.name}</span>
      </div>
      <div className="idx-price">{fmtPrice(data.price)}</div>
      <div className={`idx-change ${isPos ? 'clr-success' : 'clr-error'}`}>
        {isPos ? '▲ +' : '▼ '}{data.changePct}%
      </div>
      <Sparkline values={data.closes} isPositive={isPos} uid={uid} />
    </div>
  )
}

// ── MarketsPage ───────────────────────────────────────────────────────────────
function MarketsPage() {
  const [indexMap, setIndexMap] = useState<Record<string, MarketIndexData>>({})
  const [twseRows, setTwseRows] = useState<OHLCRow[]>([])

  useEffect(() => {
    const all = [...FEATURED_INDICES, ...OTHER_INDICES]
    const DELAY_MS = 180  // stagger between requests
    let cancelled = false
    const timeoutIds: ReturnType<typeof setTimeout>[] = []

    const fetchOne = async (cfg: IndexConfig, attempt = 0): Promise<void> => {
      try {
        const res = await instance.get('/marketIndex', { params: { symbol: cfg.symbol } })
        const data = parseYahooData(res.data, cfg)
        if (!cancelled) setIndexMap(prev => ({ ...prev, [cfg.symbol]: data }))
      } catch {
        if (cancelled) return
        // retry with capped backoff: 1s, 2s, 3s, 3s, ...
        const delay = Math.min(1000 * (attempt + 1), 3000)
        await new Promise(r => setTimeout(r, delay))
        if (!cancelled) fetchOne(cfg, attempt + 1)
      }
    }

    // Fire requests staggered — update each card as its data arrives
    all.forEach((cfg, i) => {
      const id = setTimeout(() => {
        if (!cancelled) fetchOne(cfg)
      }, i * DELAY_MS)
      timeoutIds.push(id)
    })

    // TAIEX detail table from TWSE API
    const now  = new Date()
    const date = fmtTWSE(now.getFullYear(), now.getMonth() + 1)
    instance.get('/indexTWSE', { params: { date } })
      .then(res => { if (!cancelled) setTwseRows(parseIndexTWSE(res.data?.data ?? [])) })
      .catch(() => {})

    return () => {
      cancelled = true
      timeoutIds.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="markets-page">

      {/* Featured: Taiwan + USA */}
      <section>
        <div className="section-hdr">
          <span className="clr-accent">{'// '}</span>FEATURED MARKETS — TAIWAN &amp; UNITED STATES
        </div>
        <div className="index-grid featured-grid">
          {FEATURED_INDICES.map(cfg => (
            <IndexCard
              key={cfg.symbol}
              cfg={cfg}
              data={indexMap[cfg.symbol] ?? null}
              featured
              loading={!(cfg.symbol in indexMap)}
            />
          ))}
        </div>
      </section>

      {/* Other global indices */}
      <section>
        <div className="section-hdr">
          <span className="clr-accent">{'// '}</span>GLOBAL MARKETS
        </div>
        <div className="index-grid other-grid">
          {OTHER_INDICES.map(cfg => (
            <IndexCard
              key={cfg.symbol}
              cfg={cfg}
              data={indexMap[cfg.symbol] ?? null}
              loading={!(cfg.symbol in indexMap)}
            />
          ))}
        </div>
      </section>

      {/* TAIEX detail table */}
      {twseRows.length > 0 && (
        <section className="glass-card">
          <div className="section-hdr">
            <span className="clr-accent">{'// '}</span>TAIEX DAILY DETAIL — CURRENT MONTH
          </div>
          <div className="table-wrap">
            <table className="tech-table">
              <thead><tr><th>DATE</th><th>OPEN</th><th>HIGH</th><th>LOW</th><th>CLOSE</th></tr></thead>
              <tbody>
                {twseRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td><td>{r.open}</td><td>{r.high}</td><td>{r.low}</td><td>{r.close}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  )
}

// ── LookupPage ────────────────────────────────────────────────────────────────
function LookupPage({ showToast }: { showToast: (t: Toast) => void }) {
  const [lookupCode, setLookupCode] = useState('2330')
  const [lookupExch, setLookupExch] = useState<'twse' | 'tpex'>('twse')
  const [stockRows, setStockRows]   = useState<OHLCRow[]>([])
  const [stockStats, setStockStats] = useState<StockStats | null>(null)
  const [fetching, setFetching]     = useState(false)
  const [fetched, setFetched]       = useState(false)
  const [log, setLog] = useState<string[]>(['> READY'])
  const addLog = (msg: string) => setLog(p => [`> ${msg}`, ...p].slice(0, 12))

  const fetchStock = async () => {
    if (!lookupCode.trim() || fetching) return
    setFetching(true); setFetched(false); setStockRows([]); setStockStats(null)
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth() + 1
    const date = lookupExch === 'twse' ? fmtTWSE(y, m) : fmtTPEX(y, m)
    const ep   = lookupExch === 'twse' ? '/closingTWSE' : '/closingTPEX'
    addLog(`QUERYING ${lookupCode.toUpperCase()} @ ${lookupExch.toUpperCase()}`)
    try {
      const res  = await instance.get(ep, { params: { date, code: lookupCode } })
      const raw: string[][] = lookupExch === 'twse'
        ? (res.data?.data ?? [])
        : (res.data?.tables?.[0]?.data ?? [])
      if (!raw.length) {
        addLog(`NO DATA — ${lookupCode}`); showToast({ type: 'error', message: `No data for ${lookupCode}` }); return
      }
      const rows   = lookupExch === 'twse' ? parseClosingTWSE(raw) : parseClosingTPEX(raw)
      const prices = raw.map(r => parseFloat(r[6].replace(/,/g, '')))
      const valid  = prices.filter(p => !isNaN(p))
      const high   = Math.max(...valid), low = Math.min(...valid)
      const latest = valid[valid.length - 1], prev = valid[valid.length - 2] ?? latest
      const change = Number(((latest - prev) / prev * 100).toFixed(2))
      const rets   = calcReturns(prices)
      const avgRet = Number((rets.slice(1).reduce((a,b) => a+b, 0) / Math.max(rets.length-1, 1) * 100).toFixed(4))
      setStockRows(rows); setStockStats({ latest, high, low, change, avgRet }); setFetched(true)
      addLog(`OK — ${raw.length} RECORDS`)
    } catch {
      addLog('ERR: REQUEST FAILED'); showToast({ type: 'error', message: 'Request failed.' })
    } finally { setFetching(false) }
  }

  return (
    <div className="lookup-page">
      <section className="glass-card">
        <div className="section-hdr"><span className="clr-accent">{'// '}</span>STOCK LOOKUP — CURRENT MONTH</div>
        <div className="lookup-bar">
          <span className="field-pre">CODE:</span>
          <input className="term-input" value={lookupCode}
            onChange={e => setLookupCode(e.target.value)} placeholder="2330" maxLength={6}
            onKeyDown={e => e.key === 'Enter' && fetchStock()} />
          <span className="field-pre">EXCH:</span>
          <select className="term-input term-select" value={lookupExch}
            onChange={e => setLookupExch(e.target.value as 'twse' | 'tpex')}>
            <option value="twse">TWSE</option>
            <option value="tpex">TPEX</option>
          </select>
          <button className="btn-accent" onClick={fetchStock} disabled={fetching}>
            {fetching ? 'FETCHING...' : 'FETCH →'}
          </button>
        </div>

        {stockStats && (
          <div className="stat-row">
            {[
              { label: 'LATEST',   value: stockStats.latest.toFixed(2),                                  sign: null },
              { label: 'DAY CHG',  value: `${stockStats.change>=0?'+':''}${stockStats.change}%`,          sign: stockStats.change },
              { label: 'MTH HIGH', value: stockStats.high.toFixed(2),                                    sign: null },
              { label: 'MTH LOW',  value: stockStats.low.toFixed(2),                                     sign: null },
              { label: 'AVG RET',  value: `${stockStats.avgRet>=0?'+':''}${stockStats.avgRet}%`,         sign: stockStats.avgRet },
            ].map(({ label, value, sign }) => (
              <div className="stat-card" key={label}>
                <div className="stat-lbl">{label}</div>
                <div className={`stat-val ${sign===null?'':sign>=0?'clr-success':'clr-error'}`}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {fetched && stockRows.length > 0 && (
          <div className="table-wrap">
            <table className="tech-table">
              <thead><tr><th>DATE</th><th>OPEN</th><th>HIGH</th><th>LOW</th><th>CLOSE</th></tr></thead>
              <tbody>
                {[...stockRows].reverse().map((r, i) => (
                  <tr key={i}><td>{r.date}</td><td>{r.open}</td><td>{r.high}</td><td>{r.low}</td><td>{r.close}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!fetched && !fetching && (
          <div className="empty-state">ENTER A STOCK CODE AND PRESS FETCH</div>
        )}
      </section>

      <section className="glass-card">
        <div className="section-hdr"><span className="clr-accent">{'// '}</span>SYSTEM LOG</div>
        <div className="term-log">
          {log.map((l, i) => <div key={i} className={`log-line ${i===0?'log-latest':''}`}>{l}</div>)}
        </div>
      </section>
    </div>
  )
}

// ── CrawlerPage ───────────────────────────────────────────────────────────────
function CrawlerPage({ showToast }: { showToast: (t: Toast) => void }) {
  const [loading, setLoading]   = useState(false)
  const [mode, setMode]         = useState<'price' | 'ratio' | 'index'>('price')
  const [formData, setFormData] = useState(() => {
    const now = new Date()
    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const s   = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const start = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}`
    return { start, end, companyCode: '2330', website: 'twse' }
  })
  const [log, setLog] = useState<string[]>(['> CRAWLER READY'])
  const addLog = (msg: string, kind: 'info'|'ok'|'err'='info') => {
    const p = kind==='ok'?'✓':kind==='err'?'✗':'>'
    setLog(prev => [`${p} ${msg}`, ...prev].slice(0, 20))
  }
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

  useEffect(() => {
    if (mode === 'index') setFormData(p => ({ ...p, website: 'twse' }))
  }, [mode])

  const handleCrawl = async () => {
    setLoading(true); addLog(`STARTING ${mode.toUpperCase()} CRAWL...`)
    try {
      const dates: string[]=[], prices: number[]=[], volume: number[]=[]
      const pe: number[]=[], pb: number[]=[], idx: number[]=[]
      const sy=parseInt(formData.start.split('-')[0]), sm=parseInt(formData.start.split('-')[1])
      const ey=parseInt(formData.end.split('-')[0]),   em=parseInt(formData.end.split('-')[1])
      for (let y=sy; y<=ey; y++) {
        const ms=y===sy?sm:1, me=y===ey?em:12
        for (let m=ms; m<=me; m++) {
          const date = formData.website==='twse' ? fmtTWSE(y,m) : fmtTPEX(y,m)
          addLog(`FETCH ${y}/${String(m).padStart(2,'0')}`)
          if (mode==='price')      await crawlClosing(date, dates, prices, volume)
          else if (mode==='ratio') await crawlRatios(date, dates, pe, pb)
          else                     await crawlIndex(date, dates, idx)
        }
      }
      if (dates.length > 0) {
        if (mode==='price')      dlPrice(dates, prices)
        else if (mode==='ratio') dlRatio(dates, pe, pb)
        else                     dlIndex(dates, idx)
        addLog(`DONE — ${dates.length} RECORDS`, 'ok')
        showToast({ type: 'success', message: 'CSV downloaded successfully' })
      } else { addLog('NO DATA RECEIVED', 'err'); showToast({ type: 'error', message: 'No data received' }) }
    } catch (e) {
      addLog(e instanceof Error ? e.message : 'CRAWL FAILED', 'err')
      showToast({ type: 'error', message: 'Crawl failed. Please try again.' })
    } finally { setLoading(false) }
  }

  const crawlClosing = async (date: string, dates: string[], prices: number[], volume: number[]) => {
    try {
      await delay(100)
      const ep  = formData.website==='twse' ? '/closingTWSE' : '/closingTPEX'
      const res = await instance.get(ep, { params: { date, code: formData.companyCode } })
      const data: string[][] = formData.website==='twse' ? (res.data?.data??[]) : (res.data?.tables?.[0]?.data??[])
      if (!data.length) { addLog(`NO DATA: ${date}`, 'err'); return }
      data.forEach(r => {
        dates.push(r[0]); prices.push(parseFloat(r[6].replace(/,/g,'')))
        volume.push(formData.website==='twse' ? parseFloat(r[1].replace(/,/g,'')) : 1000*parseFloat(r[1].replace(/,/g,'')))
      })
    } catch { addLog(`ERR: ${date}`, 'err') }
  }

  const crawlRatios = async (date: string, dates: string[], pe: number[], pb: number[]) => {
    try {
      await delay(100)
      const ep = formData.website==='twse' ? '/ratioTWSE' : '/ratioTPEX'
      const method = formData.website==='twse' ? 'get' : 'post'
      const res = await (instance as any)[method](ep,
        method==='get' ? { params:{date,code:formData.companyCode} } : {date,code:formData.companyCode}
      )
      const data: string[][] = formData.website==='twse' ? (res.data?.data??[]) : (res.data?.tables?.[0]?.data??[])
      if (!data.length) { addLog(`NO RATIO: ${date}`, 'err'); return }
      data.forEach(r => {
        const d = formData.website==='twse' ? r[0].replace('年','/').replace('月','/').replace('日','') : r[0]
        dates.push(d)
        pe.push(parseFloat(r[formData.website==='twse'?3:1].replace(/,/g,'')))
        pb.push(parseFloat(r[4].replace(/,/g,'')))
      })
    } catch { addLog(`RATIO ERR: ${date}`, 'err') }
  }

  const crawlIndex = async (date: string, dates: string[], values: number[]) => {
    try {
      await delay(100)
      const res = await instance.get('/indexTWSE', { params: { date } })
      const data: string[][] = res.data?.data ?? []
      if (!data.length) { addLog(`NO INDEX: ${date}`, 'err'); return }
      data.forEach(r => { dates.push(r[0]); values.push(parseFloat(r[4].replace(/,/g,''))) })
    } catch { addLog(`INDEX ERR: ${date}`, 'err') }
  }

  const dlCSV = (rows: string[], type: string) => {
    const a = document.createElement('a')
    a.href  = URL.createObjectURL(new Blob(rows, { type: 'text/csv;charset=utf-8;' }))
    a.download = type==='index'
      ? `stock_${type}_${formData.start.replace(/-/g,'')}_${formData.end.replace(/-/g,'')}.csv`
      : `stock_${type}_${formData.companyCode}_${formData.start.replace(/-/g,'')}_${formData.end.replace(/-/g,'')}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }
  const dlPrice = (d: string[], p: number[]) => {
    const rets = calcReturns(p)
    dlCSV(['Date,Closing Price,Return\n', ...d.map((x,i) => `${x},${isNaN(p[i])?'NA':p[i]},${rets[i]}\n`)], 'price')
  }
  const dlRatio = (d: string[], pe: number[], pb: number[]) =>
    dlCSV(['Date,PE Ratio,PB Ratio\n', ...d.map((x,i) => `${x},${isNaN(pe[i])?'NA':pe[i]},${isNaN(pb[i])?'NA':pb[i]}\n`)], 'ratio')
  const dlIndex = (d: string[], v: number[]) =>
    dlCSV(['Date,Index Value\n', ...d.map((x,i) => `${x},${isNaN(v[i])?'NA':v[i]}\n`)], 'index')

  const modeLabel = mode==='price'?'CLOSING PRICE':mode==='ratio'?'PE/PB RATIO':'INDEX'
  return (
    <div className="crawler-page">
      <div className="crawler-grid">
        <div className="glass-card">
          <div className="section-hdr"><span className="clr-accent">{'// '}</span>DATA CRAWLER</div>
          <div className="mode-bar">
            {(['price','ratio','index'] as const).map(m => (
              <button key={m} className={`mode-chip ${mode===m?'active':''}`} onClick={()=>setMode(m)} type="button">
                {m==='price'?'CLOSING PRICE':m==='ratio'?'PE / PB RATIO':'INDEX'}
              </button>
            ))}
          </div>
          <div className={`crawl-fields ${loading?'disabled':''}`}>
            <div className="field-group">
              <label className="field-pre">START DATE</label>
              <input type="month" className="term-input w-full" value={formData.start}
                onChange={e=>setFormData(p=>({...p,start:e.target.value}))} />
            </div>
            <div className="field-group">
              <label className="field-pre">END DATE</label>
              <input type="month" className="term-input w-full" value={formData.end}
                onChange={e=>setFormData(p=>({...p,end:e.target.value}))} />
            </div>
            {mode !== 'index' && (<>
              <div className="field-group">
                <label className="field-pre">COMPANY CODE</label>
                <input type="text" className="term-input w-full" value={formData.companyCode}
                  onChange={e=>setFormData(p=>({...p,companyCode:e.target.value}))} />
              </div>
              <div className="field-group">
                <label className="field-pre">EXCHANGE</label>
                <select className="term-input term-select w-full" value={formData.website}
                  onChange={e=>setFormData(p=>({...p,website:e.target.value}))}>
                  <option value="twse">TWSE</option>
                  <option value="tpex">TPEX</option>
                </select>
              </div>
            </>)}
          </div>
          <button className="btn-crawl" onClick={handleCrawl} disabled={loading}>
            {loading ? <><span className="btn-dot"/>CRAWLING {modeLabel}...</> : `CRAWL ${modeLabel} DATA →`}
          </button>
          {loading && <div className="progress-track"><div className="progress-fill"/></div>}
          <div className="section-hdr" style={{marginTop:'1.5rem'}}>
            <span className="clr-accent">{'// '}</span>CRAWL LOG
          </div>
          <div className="term-log">
            {log.map((l,i) => (
              <div key={i} className={`log-line ${i===0?'log-latest':''} ${l.startsWith('✓')?'log-ok':l.startsWith('✗')?'log-err':''}`}>{l}</div>
            ))}
          </div>
        </div>
        <div className="glass-card info-card">
          <div className="section-hdr"><span className="clr-accent">{'// '}</span>HOW TO USE</div>
          <ol className="instructions">
            <li>
              Choose a <span className="clr-accent">data mode</span>:<br />
              Closing Price, PE/PB Ratio, or Index.
            </li>
            <li>
              Set the <span className="clr-accent">date range</span> using the start and end month pickers.
            </li>
            <li>
              Enter the 4–6 digit <span className="clr-accent">company code</span>.<br />
              <span className="clr-muted">e.g. 2330 · TSMC &nbsp;|&nbsp; 2317 · Hon Hai</span><br />
              <span className="clr-muted">Not required in Index mode.</span>
            </li>
            <li>
              Select the <span className="clr-accent">exchange</span>:<br />
              <span className="clr-accent">TWSE</span> — Taiwan Stock Exchange (listed)<br />
              <span className="clr-accent">TPEX</span> — OTC / emerging market stocks
            </li>
            <li>
              Confirm the company code is listed on the selected exchange before proceeding.
            </li>
            <li>
              Press <span className="clr-accent">CRAWL DATA</span>.<br />
              <span className="clr-muted">Data is fetched month by month and exported as a UTF-8 CSV file.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

// ── WelcomePage ───────────────────────────────────────────────────────────────
function WelcomePage({ onEnter }: { onEnter: () => void }) {
  const [typed, setTyped]     = useState('')
  const [exiting, setExiting] = useState(false)
  const subtitle = 'TAIWAN MARKET DATA TERMINAL'
  useEffect(() => {
    let i = 0
    const t = setInterval(() => { i++; setTyped(subtitle.slice(0,i)); if(i>=subtitle.length) clearInterval(t) }, 52)
    return () => clearInterval(t)
  }, [])
  const handleEnter = () => { if(exiting) return; setExiting(true); setTimeout(onEnter, 550) }
  return (
    <div className={`welcome-screen ${exiting?'exiting':''}`} onClick={handleEnter}>
      <div className="welcome-grid" />
      <div className="welcome-scan" />
      <div className="welcome-corner tl"/><div className="welcome-corner tr"/>
      <div className="welcome-corner bl"/><div className="welcome-corner br"/>
      <div className="welcome-content">
        <div className="welcome-eyebrow">SYS::INIT — v1.0.0</div>
        <h1 className="welcome-brand">STOCK<span className="clr-accent">INTEL</span></h1>
        <p className="welcome-subtitle">{typed}<span className="blink-cursor">█</span></p>
        <div className="welcome-enter">[ CLICK TO ENTER ]</div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [tab, setTab]                 = useState<AppTab>('markets')
  const [tabKey, setTabKey]           = useState(0)
  const [toast, setToast]             = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (t: Toast) => {
    setToast(t); clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }
  const switchTab = (t: AppTab) => { if(t===tab) return; setTabKey(k=>k+1); setTab(t) }

  if (showWelcome) return <WelcomePage onEnter={() => setShowWelcome(false)} />

  return (
    <div className="app-shell">
      <div className="scanline-overlay" />
      <header className="app-header">
        <div className="header-brand">STOCK<span className="clr-accent">INTEL</span></div>
        <nav className="header-nav">
          {([
            ['markets', '// MARKETS'],
            ['lookup',  '// LOOKUP'],
            ['crawler', '// CRAWLER'],
          ] as [AppTab, string][]).map(([t, label]) => (
            <button key={t} className={`nav-tab ${tab===t?'active':''}`} onClick={() => switchTab(t)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <div className="header-status"><span className="status-dot"/> SYS ONLINE</div>
          <div className="header-social">
            {Object.entries(SOCIAL_LINKS).map(([k, { url, icon }]) => (
              <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="social-icon">{icon}</a>
            ))}
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="page-enter" key={tabKey}>
          {tab === 'markets' && <MarketsPage />}
          {tab === 'lookup'  && <LookupPage  showToast={showToast} />}
          {tab === 'crawler' && <CrawlerPage showToast={showToast} />}
        </div>
      </main>
      {toast && (
        <div className={`toast ${toast.type==='success'?'toast-ok':'toast-err'}`}>
          <span className="toast-pre">{toast.type==='success'?'✓':'✗'}</span>{toast.message}
        </div>
      )}
    </div>
  )
}

export default App
