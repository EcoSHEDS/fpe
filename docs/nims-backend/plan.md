# NIMS Station Backend Support

**Summary**
Add first-class backend/database support for FPE stations linked to a NIMS camera by storing only a `nims_camera_id` on `stations`. Do not store NIMS image metadata. The frontend will use that camera ID to fetch NIMS camera/files directly from USGS NIMS, whose docs confirm `/cameras`, `/listFiles`, `smallDir`, and optional API-key behavior.

**Key Changes**
- Add a nullable `stations.nims_camera_id` column via migration, matching existing `nwis_id` style.
- Return `nims_camera_id` through existing station list/detail APIs automatically through `stations.*`; no new public response wrapper is needed.
- Normalize station input in `postStations`/`putStation`: trim `nims_camera_id`, convert empty string to `null`.
- Validate non-empty `nims_camera_id` on create/update by calling `GET https://api.waterdata.usgs.gov/nims/v0/cameras?camId=...`; reject missing/unknown cameras with `400`.
- Add an API helper such as `api/services/nims.js` using Node’s built-in `fetch`; include `X-Api-Key` when `process.env.NIMS_API_KEY` is set.
- Prevent converting a station with existing FPE uploads into a NIMS-linked station: if `nims_camera_id` is being added and the station already has any datasets or imagesets, reject with `400`.
- Block FPE uploads for NIMS-linked stations:
  - reject dataset creation in `postDatasets`
  - reject imageset creation in `postImagesets`
  - reject imageset presign/process operations defensively if reached
  - return clear `400` messages explaining that NIMS-linked stations use NIMS imagery/data directly.
- Leave station read APIs, permissions, privacy, annotations, and NWIS behavior otherwise unchanged.

**Public API / Interface**
- Station objects gain:
  - `nims_camera_id: string | null`
- Existing create/update station payloads may include:
  - `nims_camera_id`
- No backend image-listing, NIMS proxy, NIMS sync, or NIMS image table is added.
- Existing `nwis_id` remains independent; backend does not auto-fill it from NIMS camera metadata.

**Test Plan**
- Migration test: apply/rollback migration and confirm `stations.nims_camera_id` exists/disappears.
- Station create/update:
  - valid NIMS camera ID is accepted and returned by public/restricted/admin station APIs
  - empty string stores as `null`
  - unknown camera ID returns `400`
  - adding `nims_camera_id` to a station with existing datasets/imagesets returns `400`
  - removing `nims_camera_id` from a station allows normal upload paths again.
- Upload guards:
  - `POST /restricted/stations/:id/datasets` rejects NIMS-linked stations
  - `POST /restricted/stations/:id/imagesets` rejects NIMS-linked stations
  - imageset presign/process endpoints reject defensively.
- Regression checks:
  - ordinary FPE stations can still create datasets/imagesets
  - public station list/detail still work
  - annotations can still reference NIMS-linked stations.

**Assumptions**
- Users add NIMS stations one at a time by creating a normal FPE station and entering `nims_camera_id`.
- The database stores only the NIMS camera ID, not camera metadata, filenames, timestamps, URLs, or summaries.
- Multiple FPE stations may reference the same NIMS camera ID unless product policy later requires uniqueness.
- The existing frontend POC special synthetic `nims:*` station can be replaced later with normal station IDs plus `nims_camera_id`.
- USGS NIMS docs referenced: https://api.waterdata.usgs.gov/docs/nims
