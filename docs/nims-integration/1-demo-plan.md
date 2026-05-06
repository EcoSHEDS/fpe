# NIMS Explorer Proof Of Concept

## Summary
Build a frontend-only POC in the Vue explorer that injects one synthetic NIMS station, routes it through the existing station viewer, and adapts NIMS camera/file responses into the image shapes `StationPhotos` already expects.

Use the documented NIMS endpoints from USGS: [`/cameras`](https://api.waterdata.usgs.gov/docs/nims) for metadata/base paths and [`/listFiles`](https://api.waterdata.usgs.gov/docs/nims) for filenames. Live checks confirmed the specified camera exists, `listFiles` returns the expected raw items, and both NIMS API responses and S3 image URLs allow browser CORS.

## Key Changes
- Add a small NIMS client module in the app, probably `app/src/lib/nims.js`, with:
  - constants for `camId = MA_West_Branch_Farmington_River_near_New_Boston`
  - `fetchCamera()`
  - `fetchFiles({ after, before, recent, limit })`
  - transforms for NIMS camera metadata into an FPE-like station object
  - transforms for NIMS file rows into FPE-like image objects using `smallDir + filename` for both `thumb_url` and `full_url`

- In `ExplorerHome.vue`, after fetching normal FPE stations:
  - fetch NIMS camera metadata
  - prepend the synthetic station to `stations.all`
  - use a stable synthetic id like `nims:MA_West_Branch_Farmington_River_near_New_Boston`
  - set placeholders needed by existing UI: `private: false`, `status: ACTIVE`, `waterbody_type: ST`, `affiliation_code/name: USGS/NIMS`, empty `variables`, empty `models`, `has_obs: true`, `has_model: false`
  - set `images.start_date`, `images.end_date`, and `images.count` from the fetched NIMS file list or a cached metadata pass

- In `ExplorerStation.vue`, branch on synthetic NIMS ids:
  - for normal numeric ids, keep the current FPE API fetch
  - for `nims:*`, build the station object from NIMS camera data instead of calling `/stations/:id`
  - include a `summary` object matching existing expectations:
    - `summary.images` from NIMS files
    - `summary.values.count = 0`, `summary.values.variables = []`
    - `models = []`
    - `nwis_id = camera.nwisId`

- In `StationPhotos.vue`, branch image loading for NIMS stations:
  - `fetchDailyImages()` should use all NIMS file rows grouped by station-local date and select the image closest to 12:00 local time per day
  - `fetchInstantaneousImages(start, end)` should fetch/filter NIMS files for the selected local-date window and return all image rows
  - keep existing NWIS daily and instantaneous value fetches using `station.nwis_id`, so flow/stage overlays work as they do for FPE stations
  - skip FPE-only variable/model fetches for NIMS by treating `station.summary.values.variables` and `station.models` as empty

- Add lightweight caching in the NIMS client:
  - cache camera metadata for the session
  - cache the full file list for the demo camera after first station selection
  - derive daily and subdaily arrays from the cached rows to avoid repeated `listFiles` calls while zooming

## Image Processing Rules
- Parse NIMS timestamps such as `2024-04-19T15-15-01Z` by converting the time portion to ISO-compatible `15:15:01Z`.
- Build each image as:
  - `id`: `nims:${camId}:${timestamp}`
  - `filename`: NIMS filename
  - `timestamp`: JavaScript `Date`
  - `thumb_url`: `camera.smallDir + filename`
  - `full_url`: `camera.smallDir + filename`
- Daily grouping:
  - convert each timestamp to the station timezone from NIMS, normalized from `US/Eastern` to `America/New_York`
  - group by local `YYYY-MM-DD`
  - choose the row with the smallest absolute difference from local noon
  - set `n_images` to the number of NIMS images on that local date

## Test Plan
- Run `npm run lint` in `app`.
- Manually test `/explorer`:
  - NIMS station appears first in the table and on the map
  - selecting it opens `/explorer/nims:MA_West_Branch_Farmington_River_near_New_Boston`
  - station info shows NIMS/USGS metadata, coordinates, timezone, photos, and NWIS observed data
  - daily timeline renders one local-noon image per day
  - image canvas loads 720px NIMS images without CORS errors
  - NWIS flow/stage series appear when available for `01185500`
  - zooming under 30 days switches to subdaily mode and uses all NIMS images in the selected window
  - Prev/Next/Play work in both daily and subdaily modes

## Assumptions
- Keep this POC frontend-only; no FPE API, database, migration, or backend proxy changes.
- Use unauthenticated NIMS calls for the demo. The docs note API keys are optional for higher rate limits, but the validated responses currently work without one.
- Use `smallDir` images as requested; do not use `thumbDir` because the spec calls for 720px images.
- Do not persist NIMS data into FPE; all NIMS station/image data is synthetic and session-derived.
- `docs/nims-viewer.md` was open in the IDE but not present in this checkout, so this plan is based on `docs/nims-explorer-demo.md` and the linked USGS NIMS docs.
