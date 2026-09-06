# Product and Technical Decisions

## APIs

**Primary:** `api.frankfurter.dev` (ECB-backed, lightweight JSON, no key required)
**Fallback:** `open.er-api.com` (independent provider, no key required)

Both are real public APIs. I chose them because:
- No API keys needed, so the evaluator can run immediately.
- They are independent enough that simultaneous outages are unlikely.
- frankfurter returns a clean response structure with `base`, `date`, and `rates`.

## Fallback Strategy

1. Try primary (frankfurter).
2. If it fails, try fallback (open.er-api).
3. If both fail, return last successful in-memory cache **only if it matches the requested base currency**.
4. If there is no matching cache, return `unavailable`.

## Conflicting Data

Different providers publish rates at different times and from different sources. I do **not** average or reconcile conflicting rates. The backend picks one successful source and returns it with clear attribution. This avoids silently mixing data from different snapshots.

## What the User Sees on Failure

- **Stale:** An amber indicator, "Showing cached data" banner, source name, and the original timestamp. The UI never claims stale data is fresh.
- **Unavailable:** A red indicator and an explicit message that rates cannot be fetched right now. The UI shows no rates rather than misleading placeholders.

## Freshness Handling

- Backend sets `fetched_at` to the exact UTC time the live response was received.
- Frontend shows `Live`, `Stale`, or `Unavailable` with color coding.
- Relative time display ("2m ago") makes freshness tangible.
- Auto-refresh polls every 30 seconds. Manual refresh is always available.
- CORS origins are configurable via environment variable for production deployment.

## What Was Intentionally Cut

- No Redis, database, or persistent cache (in-memory only).
- No Docker or deployment scripts.
- No authentication or rate limiting.
- No tests, CI, or monitoring.
- No charts, dashboards, or historical data views.
- No complex retry/backoff logic (single fallback attempt).
- No averaging or normalization across sources.
- No user accounts or premium tiers.

## What I Would Add With More Time

- Server-side polling to warm the cache before users request it.
- A short TTL on cache entries so stale data ages out automatically.
- Health-check endpoint and basic request metrics.
- More robust input validation and standardized error codes.
- Frontend error boundaries and skeleton loading states.
- Ability to request multiple target currencies instead of showing a hardcoded list.
- Rate-change indicators (up/down arrows compared to previous fetch).
