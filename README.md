# Real-Time Rates

A minimal but reliable currency exchange-rate aggregator. It fetches live rates from public APIs, falls back gracefully when a source is down, and never shows stale data as fresh.

## Approach

The main problem is not just getting exchange rates; it is user trust. A blank "Unable to fetch rates" error is worse than showing clearly labelled last-known-good data.

I prioritized:
1. A real working backend with two public APIs and graceful failure.
2. A frontend that makes freshness obvious.
3. Simple docs so an evaluator can run it immediately.

I avoided databases, Docker, auth, charts, and complex infrastructure because they do not help demonstrate the core product idea: reliability over fake real-time guarantees. This is a 60-minute implementation, so a reliable single endpoint and clear user states are more important than extra features.

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
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |

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

The project is already pushed to GitHub:
https://github.com/tanushreeraut-28/real-time-rates

### Step 1: Deploy Backend to Render

1. Go to https://render.com and sign in.
2. Click **New** → **Web Service**.
3. Connect your GitHub account and select the `real-time-rates` repo.
4. Set these values:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable:
   - `CORS_ORIGINS` = `https://your-frontend.vercel.app` (update after frontend deploys)
   - `REQUEST_TIMEOUT` = `10`
6. Click **Create Web Service**.
7. After deployment, copy the live backend URL (e.g., `https://real-time-rates-backend.onrender.com`).

### Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in.
2. Click **Add New...** → **Project**.
3. Import the `real-time-rates` repo.
4. Set these values:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variable:
    - `VITE_API_URL` = `https://real-time-rates.onrender.com` (use the URL from Step 1, without `/rates`)
6. Click **Deploy**.
7. After deployment, copy the live frontend URL.

### Step 3: Final Configuration

1. Go back to Render and update `CORS_ORIGINS` to your exact Vercel frontend domain.
2. Redeploy the backend if needed.
3. Test the live frontend and confirm rates load with `status: fresh`.

### Step 4: Verify Deployment

Test the live backend directly:
```
GET https://your-backend.onrender.com/rates?base=USD
```

Expected response includes `"status": "fresh"` with live rates.

## Assumptions

- Public APIs used here are free and do not require API keys.
- Users run the frontend on `localhost:5173` and the backend on `localhost:8000` locally.
- A 30-second auto-refresh is acceptable for a free-tier product.
- Conflicting rates from different providers are not averaged; one successful source is shown with attribution.
