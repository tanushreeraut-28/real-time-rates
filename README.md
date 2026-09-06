# Real-Time Rates

A minimal but reliable currency exchange-rate aggregator. It fetches live rates from public APIs, falls back gracefully when a source is down, and never shows stale data as fresh.

## Approach

The goal was to ship a working submission in about 60 minutes. I prioritized:
1. A real working backend with two public APIs and graceful failure.
2. A clean React frontend that makes freshness obvious.
3. Simple docs so an evaluator can run it immediately.

I avoided databases, Docker, auth, charts, and complex infrastructure because they do not help demonstrate the core product idea: reliability over fake real-time guarantees.

## Project Structure

```
real-time-rates/
├── decisions.md
├── README.md
├── render.yaml
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── venv/
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json
    ├── netlify.toml
    ├── .env.example
    ├── .env
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── App.css
```

## Features

- **Backend** (`FastAPI`): `GET /rates?base=USD`
  - Primary source: frankfurter.dev (ECB-backed)
  - Fallback source: open.er-api.com
  - In-memory cache with stale detection
  - CORS enabled for local and production frontends
  - Configurable request timeout via environment variables
  - No API keys required

- **Frontend** (`React + Vite`):
  - Base currency selector (USD, EUR, GBP, INR, JPY, CAD, AUD, CHF, CNY, SGD)
  - Manual refresh button
  - Auto-refresh every 30 seconds
  - Clear Fresh / Stale / Unavailable status with color coding and badges
  - Source attribution and relative last-updated time
  - Loading skeleton states
  - Clear stale-data warnings and unavailable messages
  - Responsive design for mobile and desktop

## Running the Backend

```bash
cd backend
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000` | Comma-separated allowed origins |
| `REQUEST_TIMEOUT` | `10` | HTTP request timeout in seconds |

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000/rates` | Backend API endpoint |

## API Example

Request:
```
GET http://localhost:8000/rates?base=USD
```

Response:
```json
{
  "base": "USD",
  "rates": {
    "EUR": 0.86044,
    "GBP": 0.7391,
    "INR": 94.49,
    "JPY": 156.25
  },
  "source": "frankfurter.dev",
  "status": "fresh",
  "fetched_at": "2026-09-06T05:47:37.279033+00:00",
  "message": "Live rates fetched successfully."
}
```

## States Explained

| Status | Meaning |
|--------|---------|
| `fresh` | Live data was fetched successfully from a public API this request. |
| `stale` | Both APIs failed, so the backend returned the last successfully cached data for this base currency. The timestamp and source are from the previous fetch. |
| `unavailable` | No live data is available and no usable cached data exists. The UI shows an explicit error. |

## Deployment

### Option A: Render (Backend) + Vercel (Frontend)

**Backend on Render:**
1. Push this repository to GitHub.
2. Create a new Web Service on Render.
3. Connect your GitHub repo and select the `backend` folder as the root directory.
4. Render auto-detects Python. The `render.yaml` blueprint is included for one-click deployment.
5. Set the `CORS_ORIGINS` environment variable to your deployed frontend URL (e.g., `https://your-app.vercel.app`).
6. Deploy. Your backend will be available at `https://real-time-rates-backend.onrender.com`.

**Frontend on Vercel:**
1. Push this repository to GitHub.
2. Import the `frontend` folder into Vercel.
3. Set the `VITE_API_URL` environment variable to your deployed Render backend URL (e.g., `https://real-time-rates-backend.onrender.com/rates`).
4. Deploy. Your frontend will be available at a Vercel URL.

### Option B: Netlify (Frontend) + Render (Backend)

Follow the same Render backend steps above, then:

1. Import the `frontend` folder into Netlify.
2. Set the `VITE_API_URL` environment variable to your deployed backend URL.
3. Netlify will use `netlify.toml` automatically.

### Post-Deployment Checklist

1. Update `CORS_ORIGINS` in Render to include your exact frontend domain.
2. Verify `VITE_API_URL` points to the live backend.
3. Test `GET /rates?base=USD` on the live backend.
4. Open the live frontend and confirm rates load with `status: fresh`.

## Assumptions

- Public APIs used here are free and do not require API keys.
- Users run the frontend on `localhost:5173` and the backend on `localhost:8000` locally.
- A 30-second auto-refresh is acceptable for a free-tier product.
- Conflicting rates from different providers are not averaged; one successful source is shown with attribution.
