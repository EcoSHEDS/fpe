# NIMS Annotator Pair Generation

## Summary
Update `Annotator.vue` so regular FPE stations keep using `/stations/:id/image-pairs`, while NIMS-linked stations generate comparable random image pairs in the browser from USGS NIMS files. Annotation records and S3 uploads will still use the existing FPE `/annotations` flow.

## Key Changes
- Detect NIMS-linked stations with `station.nims_camera_id` in the annotator start flow.
- For regular FPE stations, leave the current backend `getStationRandomImagePairs()` path unchanged.
- For NIMS stations, fetch all NIMS files via the existing frontend NIMS client, normalize them into annotator image objects, filter by:
  - local station/camera timezone hour range, default `7..18`
  - local date range, default unbounded
  - no PII/status filtering, because NIMS does not expose FPE image status or PII flags
- Mirror the database pairing algorithm in frontend:
  - take the filtered image list
  - create two independently shuffled copies
  - zip by index
  - drop pairs where left and right are the same image
  - return up to requested `nPairs`
- If fewer than two usable NIMS images remain after filtering, show the existing “No image pairs found for given inputs” error.
- Keep the current annotation UI, keyboard shortcuts, progress, submit-early behavior, and count updates unchanged.

## Annotation Payload
- Continue creating/updating `annotations` records exactly as regular FPE annotations do.
- Keep the existing `left.imageId` / `right.imageId` fields, but for NIMS use stable string IDs such as `nims:<cameraId>:<filename>`.
- Add NIMS metadata alongside each side so downstream processing can resolve the external image without a database `images.id`:
  - `cameraId`
  - `filename`
  - `timestamp`
  - `url`
- Leave regular FPE annotation JSON unchanged to avoid changing existing consumers.

## Implementation Notes
- Reuse `app/src/lib/nims.js` for `fetchCamera`, `fetchAllFiles`, timezone normalization, and URL construction where possible.
- Add small helper methods inside `Annotator.vue` or a lightweight frontend utility:
  - `isNimsStation(station)`
  - `buildImagePairsFromNimsFiles(station, options)`
  - `shuffle(array)`
  - `annotationImagePayload(image)`
- NIMS image objects should include both display fields and annotation fields:
  - `image_id`
  - `filename`
  - `timestamp`
  - `thumb_url`
  - `full_url`
  - `hour`
  - `nims_camera_id`
- Use `station.timezone || camera.timezone || 'UTC'` for filtering and display, matching the FPE station-centered behavior while still falling back safely to NIMS metadata.

## Test Plan
- Run `npm run lint` and `npm run build` in `app`.
- Manually verify a regular FPE station still fetches pairs from `/stations/:id/image-pairs` and submits unchanged JSON.
- Manually verify a NIMS station:
  - appears in the annotator station table
  - starts without calling `/stations/:id/image-pairs`
  - respects hour/date filters
  - displays paired NIMS thumbnails and timestamps
  - submits annotation records through the existing `/annotations` flow
  - uploads JSON containing stable NIMS image IDs plus metadata
- Verify error states:
  - no station selected
  - invalid pair count/date/hour inputs
  - NIMS API failure
  - fewer than two matching NIMS images

## Assumptions
- NIMS annotations are saved in FPE as annotation records plus S3 JSON, not as rows in the `images` table.
- NIMS image URLs from `smallDir + filename` are acceptable for annotator display.
- The backend does not need a new NIMS pairing endpoint for this step.
