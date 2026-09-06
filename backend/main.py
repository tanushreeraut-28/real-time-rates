from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
from datetime import datetime, timezone
import os

app = FastAPI()

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRIMARY_URL = "https://api.frankfurter.dev/v1/latest"
FALLBACK_URL = "https://open.er-api.com/v6/latest/{base}"
TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "10"))

cache = {
    "base": None,
    "rates": None,
    "source": None,
    "fetched_at": None,
}


def fetch_primary(base: str):
    resp = requests.get(PRIMARY_URL, params={"base": base}, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    return {
        "base": data["base"],
        "rates": data["rates"],
        "source": "frankfurter.dev",
    }


def fetch_fallback(base: str):
    url = FALLBACK_URL.format(base=base)
    resp = requests.get(url, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    return {
        "base": data["base_code"],
        "rates": data["rates"],
        "source": "open.er-api.com",
    }


@app.get("/rates")
def get_rates(base: str = Query("USD", min_length=3, max_length=3)):
    base = base.upper()
    result = None

    try:
        result = fetch_primary(base)
    except Exception:
        try:
            result = fetch_fallback(base)
        except Exception:
            result = None

    if result:
        cache["base"] = result["base"]
        cache["rates"] = result["rates"]
        cache["source"] = result["source"]
        cache["fetched_at"] = datetime.now(timezone.utc).isoformat()

        return {
            "base": result["base"],
            "rates": result["rates"],
            "source": result["source"],
            "status": "fresh",
            "fetched_at": cache["fetched_at"],
            "message": "Live rates fetched successfully.",
        }

    if cache["base"] == base and cache["rates"] is not None:
        return {
            "base": cache["base"],
            "rates": cache["rates"],
            "source": cache["source"],
            "status": "stale",
            "fetched_at": cache["fetched_at"],
            "message": "Live sources unavailable. Showing last known good data.",
        }

    return {
        "base": base,
        "rates": {},
        "source": None,
        "status": "unavailable",
        "fetched_at": None,
        "message": "Exchange rates are currently unavailable. Please try again later.",
    }
