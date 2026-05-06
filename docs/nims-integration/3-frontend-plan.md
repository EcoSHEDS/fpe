# NIMS-Linked Station Frontend Support

## Summary
Replace the frontend-only mocked `nims:*` station with normal FPE station records that include `nims_camera_id`. Explorer will load NIMS imagery directly from USGS using that camera ID, while station metadata comes from FPE. Since FPE stores no NIMS image summary, station tables will show `N/A` for NIMS photo count/start/end until image metadata support is added later.

## Key Changes
- Update the NIMS client to accept a station or `nims_camera_id` instead of using the hardcoded demo camera and synthetic station ID.
- Remove synthetic station injection from Explorer station list loading. Use the API-returned station list as-is, and treat any station with `nims_camera_id` as NIMS-linked.
- Update Explorer station detail loading to always fetch the FPE station by real station ID. Remove the `nims:*` route branch.
- Update `StationPhotos.vue` NIMS detection from synthetic ID to `!!station.nims_camera_id`, and pass that camera ID into NIMS image/file helpers.
- Ensure NIMS-linked stations can remain visible in `ExplorerHome` and `StationsTable.vue` even when `images.count` is missing or zero.
- In `StationsTable.vue`, display `N/A` for `# Photos`, `Start`, and `End` when `station.nims_camera_id` is set and FPE image metadata is unavailable.
- Keep normal FPE stations unchanged: existing image-count filtering and date formatting still apply to non-NIMS stations.

## Data Management
- Extend the existing `StationForm.vue` with a `NIMS Camera ID` field.
- Use one form for all station creation/editing.
- Add a lookup action for the NIMS Camera ID that calls the browser-side NIMS `/cameras?camId=...` endpoint and prepopulates:
  - `name` from `camName`
  - `description` from `camDesc`
  - `latitude` from `lat`
  - `longitude` from `lng`
  - `timezone` from `tz`, normalized like the POC
  - optionally `nwis_id` from `nwisId` when present, but still allow user edits
- Include trimmed `nims_camera_id` in create/update payloads; send `null` or empty consistently when the field is cleared.
- Show `nims_camera_id` in station metadata/detail views and management station tables so users can identify NIMS-linked stations.
- On NIMS-linked station management photo/data pages, replace upload instructions/actions with an informational blocked state explaining that imagery/data are loaded directly from NIMS/NWIS and FPE uploads are unavailable.
- Keep permissions, privacy, station delete/edit, annotations, and NWIS behavior unchanged.

## Testing
- Run app lint/build checks after implementation.
- Manually verify Explorer:
  - real DB station with `nims_camera_id` appears in table and map
  - photo count/start/end show `N/A`
  - selecting the station routes to `/explorer/:realStationId`
  - station detail loads FPE metadata and NIMS photos
  - ordinary FPE stations still list, filter, route, and display photos normally
- Manually verify management:
  - creating a station with a valid NIMS Camera ID prepopulates fields and saves `nims_camera_id`
  - user can edit prepopulated fields before saving
  - clearing `nims_camera_id` updates the station back to a normal FPE station
  - invalid camera lookup shows a form error
  - NIMS-linked station photo/data upload pages show blocked state
  - ordinary FPE stations can still create/edit/upload through existing flows

## Assumptions
- Frontend will call USGS NIMS directly, not through a new backend proxy.
- No NIMS image metadata will be stored or summarized in FPE for this step.
- NIMS-linked stations use normal FPE station IDs in routes.
- A station is considered NIMS-linked when `nims_camera_id` is non-empty.
- The existing synthetic demo camera constants can be removed once all NIMS calls are parameterized.
