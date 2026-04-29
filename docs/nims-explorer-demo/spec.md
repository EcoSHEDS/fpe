# NIMS Viewer Proof of Concept

Goal: adapt FPE web application to display images from NIMS

NIMS documentation:
- [Getting Started](https://api.waterdata.usgs.gov/docs/nims)
- [Swagger API](https://api.waterdata.usgs.gov/nims/v0/docs)

Use images in the `smallDir` directory for the viewer as these images are properly sized (720px max).

For purposes of this demo, use camera ID: `MA_West_Branch_Farmington_River_near_New_Boston`

## Add NIMS Station

When fetching stations from the FPE API, the front end should insert a this NIMS station at the start of the station list so it appears at the top of the table. Later, we'll update the database and API to include stations from NIMS. For now, we'll just have the web app manually insert a NIMS station.

Fetch the station meta data (name, description, lat, lon, etc.) from the NIMS API: `GET https://api.waterdata.usgs.gov/nims/v0/cameras?camId=MA_West_Branch_Farmington_River_near_New_Boston`

```json
[
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "nwisId": "01185500",
    "camName": "West Branch Farmington River near New Boston",
    "camDesc": "West Branch Farmington River near New Boston, MA",
    "lat": "42.0788611",
    "lng": "-73.0728833",
    "stateAbrv": "MA",
    "tz": "US/Eastern",
    "createdDate": "2024-06-16T12:51:42.420Z",
    "modifiedDate": "2024-06-16T12:51:42.420Z",
    "TL_enabled": true,
    "hideCam": false,
    "overlayDir": "https://usgs-nims-images.s3.amazonaws.com/overlay/MA_West_Branch_Farmington_River_near_New_Boston/",
    "thumbDir": "https://usgs-nims-images.s3.amazonaws.com/thumbnail/MA_West_Branch_Farmington_River_near_New_Boston/",
    "smallDir": "https://usgs-nims-images.s3.amazonaws.com/720/MA_West_Branch_Farmington_River_near_New_Boston/",
    "tlDir": "https://usgs-nims-images.s3.amazonaws.com/timelapse/MA_West_Branch_Farmington_River_near_New_Boston/",
    "ingest": {
      "period": "daylight",
      "intr": 15,
      "specificArr": []
    },
    "locus": "aws"
  }
]
```

Then transform the result from NIMS to match the FPE station structure, here's an example from FPE. Match as many of the common fields as possible. For those without matches, generate sensible placeholders:

```json
{
  "id": 146,
  "user_id": "00e73e95-d83b-461d-8724-a63680550f52",
  "name": "Red River near Terral",
  "description": "Red River, US-81, near Terral, OK",
  "latitude": 33.877785,
  "longitude": -97.93426,
  "timezone": "America/Chicago",
  "metadata": {
    "imageset": {
      "useAffiliation": true,
      "source": null,
      "methodology": "SPYPOINT FORCE-20 trail camera and security housing were affixed to the southeast wall of the US-81 bridge facing downstream (southeast) of the Red River.",
      "citation": "Oklahoma Water Resources Board. (2022). Timelapse Cameras Standard Operating Procedure. https://www.owrb.ok.gov/\n\nFor time-lapse camera SOP contact Justin Wright of the Oklahoma Water Resources Board"
    }
  },
  "created_at": "2023-05-19T21:22:31.401Z",
  "updated_at": "2023-05-19T21:23:34.702Z",
  "private": false,
  "nwis_id": "07315500",
  "waterbody_type": "ST",
  "status": "ACTIVE",
  "annotation_priority": false,
  "affiliation_code": "OWRB",
  "affiliation_name": "Oklahoma Water Resources Board",
  "images": {
    "start_date": "2023-04-17",
    "end_date": "2025-09-29",
    "count": 22747
  },
  "variables": [],
  "models": []
}
```

## Fetch and Pre-process Images

When the user selects the NIMS station, then have the explorer page fetch the list of all images for that station: `GET https://api.waterdata.usgs.gov/nims/v0/listFiles?camId=WI_Chippewa_River_at_Grand_Ave_at_Eau_Claire&rawItem=true&limit=10000`

Use `limit=10000`, and also `rawItem=true` to get both the filename and the timestamps.

This will likely be paginated as the NIMS API returns a limited set. Use the `after` / `before` filters by date/time (ISO 8601 or NIMS-standard string (YYYY-MM-DDThh:mm:ssZ), inclusive) to get the full list of images.

The results should have the format:

```json
[
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T15-15-01Z.jpg",
    "timestamp": "2024-04-19T15-15-01Z",
    "fs": 861725
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T15-00-02Z.jpg",
    "timestamp": "2024-04-19T15-00-02Z",
    "fs": 870174
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T14-45-01Z.jpg",
    "timestamp": "2024-04-19T14-45-01Z",
    "fs": 882423
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T14-30-01Z.jpg",
    "timestamp": "2024-04-19T14-30-01Z",
    "fs": 850341
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T14-15-01Z.jpg",
    "timestamp": "2024-04-19T14-15-01Z",
    "fs": 757399
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T14-00-01Z.jpg",
    "timestamp": "2024-04-19T14-00-01Z",
    "fs": 844876
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T13-45-01Z.jpg",
    "timestamp": "2024-04-19T13-45-01Z",
    "fs": 860788
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T13-30-01Z.jpg",
    "timestamp": "2024-04-19T13-30-01Z",
    "fs": 860764
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T13-15-01Z.jpg",
    "timestamp": "2024-04-19T13-15-01Z",
    "fs": 842179
  },
  {
    "camId": "MA_West_Branch_Farmington_River_near_New_Boston",
    "filename": "MA_West_Branch_Farmington_River_near_New_Boston___2024-04-19T13-01-06Z.jpg",
    "timestamp": "2024-04-19T13-01-06Z",
    "fs": 861579
  }
]
```

Then have the web app manually extract one image for day (the daily images) based on the image closest to noon in the local timezone of the station within each day.

Also fetch the streamflow data from NWIS using the station's `nwis_id` similar to FPE stations.
