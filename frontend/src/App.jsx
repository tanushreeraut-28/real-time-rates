import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Globe2, Activity, Clock, ShieldCheck, Wifi, AlertTriangle, CircleAlert, ChevronDown } from 'lucide-react'
import './App.css'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD']
const DISPLAY_CURRENCIES = ['EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/rates'
const REFRESH_INTERVAL_MS = 30000

function relativeTime(isoString) {
  if (!isoString) return 'unknown'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

function App() {
  const [base, setBase] = useState('USD')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [mounted, setMounted] = useState(false)
  const initialLoadRef = useRef(true)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}?base=${base}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      initialLoadRef.current = false
    }
  }, [base])

  useEffect(() => {
    fetchRates()
    const t = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(t)
  }, [fetchRates])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(fetchRates, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [autoRefresh, fetchRates])

  const statusConfig = {
    fresh: {
      color: '#10b981',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      label: 'Live',
      description: 'Real-time rates from public API',
      icon: Wifi,
    },
    stale: {
      color: '#f59e0b',
      bg: '#fffbeb',
      border: '#fde68a',
      label: 'Stale',
      description: 'Using last known good data. Live sources are unavailable.',
      icon: AlertTriangle,
    },
    unavailable: {
      color: '#ef4444',
      bg: '#fef2f2',
      border: '#fecaca',
      label: 'Unavailable',
      description: 'Cannot fetch rates right now. Please try again later.',
      icon: CircleAlert,
    },
  }

  const config = statusConfig[data?.status] || statusConfig.unavailable
  const StatusIcon = config.icon
  const timeLabel = data?.fetched_at ? relativeTime(data.fetched_at) : '--'
  const fullTimeLabel = data?.fetched_at
    ? new Date(data.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--'

  return (
    <div className="app">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <header className={`header ${mounted ? 'header--visible' : ''}`}>
        <div className="header-icon">
          <Activity size={28} strokeWidth={2.2} />
        </div>
        <div className="header-text">
          <h1>Exchange Rates</h1>
          <p className="subtitle">Reliable currency data with transparent freshness</p>
        </div>
        <div className="header-badge">
          <ShieldCheck size={14} />
          <span>Trusted sources</span>
        </div>
      </header>

      <div className={`panel controls ${mounted ? 'panel--visible' : ''}`}>
        <div className="control-group">
          <label className="control-label" htmlFor="base-currency">
            <Globe2 size={16} strokeWidth={2} />
            <span>Base currency</span>
          </label>
          <div className="select-wrapper">
            <select
              id="base-currency"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="select-input"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>
        </div>

        <button onClick={fetchRates} disabled={loading} className="refresh-btn">
          <RefreshCw size={16} strokeWidth={2.2} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        <label className="toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-text">
            <Clock size={14} />
            Auto-refresh
          </span>
        </label>
      </div>

      {data && (
        <div className={`status-bar ${mounted ? 'panel--visible' : ''}`} style={{ borderColor: config.border, background: config.bg }}>
          <div className="status-indicator">
            <span className="pulse-dot" style={{ background: config.color }} />
            <StatusIcon size={18} strokeWidth={2.2} style={{ color: config.color }} />
            <span className="status-text" style={{ color: config.color }}>{config.label}</span>
          </div>
          <div className="status-meta">
            {data.source && (
              <span className="trust-badge" style={{ background: config.bg, color: config.color, borderColor: config.border }}>
                {data.source}
              </span>
            )}
            <span className="meta-item">
              <Clock size={13} />
              Updated {timeLabel}
            </span>
            <span className="full-time">{fullTimeLabel}</span>
          </div>
        </div>
      )}

      {data?.status === 'stale' && (
        <div className={`banner stale-banner ${mounted ? 'panel--visible' : ''}`} style={{ borderColor: config.border, background: config.bg, color: config.color === '#f59e0b' ? '#92400e' : config.color }}>
          <AlertTriangle size={20} strokeWidth={2} />
          <div>
            <strong>Showing cached data</strong>
            <div className="banner-desc">
              {config.description} The rates below were last fetched from <strong>{data.source}</strong> at <strong>{fullTimeLabel}</strong>.
            </div>
          </div>
        </div>
      )}

      {data?.status === 'unavailable' && (
        <div className={`banner error-banner ${mounted ? 'panel--visible' : ''}`} style={{ borderColor: config.border, background: config.bg, color: config.color === '#ef4444' ? '#991b1b' : config.color }}>
          <CircleAlert size={20} strokeWidth={2} />
          <div>
            <strong>Data temporarily unavailable</strong>
            <div className="banner-desc">{config.description}</div>
          </div>
        </div>
      )}

      {error && !data && !loading && (
        <div className={`banner error-banner ${mounted ? 'panel--visible' : ''}`} style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>
          <CircleAlert size={20} strokeWidth={2} />
          <div>
            <strong>Connection error</strong>
            <div className="banner-desc">{error}</div>
          </div>
        </div>
      )}

      {(loading || initialLoadRef.current) ? (
        <div className={`loading-skeleton ${mounted ? 'panel--visible' : ''}`}>
          {DISPLAY_CURRENCIES.filter((c) => c !== base).slice(0, 8).map((currency) => (
            <div key={currency} className="skeleton-card">
              <div className="skeleton-line" />
              <div className="skeleton-line long" />
            </div>
          ))}
        </div>
      ) : data?.rates && Object.keys(data.rates).length > 0 ? (
        <div className={`grid ${mounted ? 'panel--visible' : ''}`}>
          {DISPLAY_CURRENCIES.filter((c) => c !== base).map((currency) => {
            const rate = data.rates[currency]
            if (rate === undefined) return null
            return (
              <div key={currency} className="card">
                <div className="card-header">
                  <span className="currency">{currency}</span>
                  <span className="base-badge">per {base}</span>
                </div>
                <div className="rate">{rate.toFixed(4)}</div>
                <div className="rate-label">1 {base} = {rate.toFixed(4)} {currency}</div>
              </div>
            )
          })}
        </div>
      ) : (
        !loading && !error && (
          <div className={`empty ${mounted ? 'panel--visible' : ''}`}>
            <CircleAlert size={32} strokeWidth={1.5} />
            <p>No rates to display.</p>
          </div>
        )
      )}
    </div>
  )
}

export default App
