<template>
  <div class="fpe-map-container">
    <v-overlay color="grey lighten-2" :value="loading" absolute style="z-index:5000">
    </v-overlay>
    <l-map
      ref="map"
      style="width:100%;height:100%"
      :center="[41,-100]"
      :zoom="3"
      @ready="$emit('ready', map)"
    >
      <l-control-layers position="topright"></l-control-layers>
      <l-control-scale position="bottomleft"></l-control-scale>
      <l-tile-layer
        v-for="tile in basemaps"
        :key="tile.name"
        :name="tile.name"
        :visible="tile.visible"
        :url="tile.url"
        :attribution="tile.attribution"
        :options="tile.options"
        layer-type="base"
      ></l-tile-layer>
      <l-circle-marker
        v-for="s in stations"
        :key="s.id"
        :lat-lng="[s.latitude, s.longitude]"
        color="#3388ff"
        :radius="6"
        :weight="3"
        :opacity="0.8"
        :fill-opacity="0.05"
        @click="$emit('select', s)"
      >
        <l-tooltip>
          <div class="text-subtitle-1">{{s.name}}</div>
          <div class="text-subheading">{{s.affiliation_name}}</div>
        </l-tooltip>
      </l-circle-marker>
      <l-circle-marker
        v-if="station"
        key="selected"
        :lat-lng="[station.latitude, station.longitude]"
        color="orangered"
        :radius="6"
        :weight="3"
        @click="$emit('select')"
      >
        <l-tooltip>
          <div class="text-subtitle-1">{{station.name}}</div>
          <div class="text-subheading">{{station.affiliation_name}}</div>
        </l-tooltip>
      </l-circle-marker>
    </l-map>
    <slot v-if="ready"></slot>
  </div>
</template>

<script>
import { LMap, LTileLayer, LControlLayers, LControlScale, LCircleMarker, LTooltip } from 'vue2-leaflet'

const basemaps = [
  {
    name: 'ESRI World Imagery',
    visible: true,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  {
    name: 'USGS Imagery',
    visible: false,
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
    attribution: '<a href="http://www.doi.gov">U.S. Department of the Interior</a> | <a href="http://www.usgs.gov">U.S. Geological Survey</a> | <a href="http://www.usgs.gov/laws/policies_notices.html">Policies</a>',
    options: {
      maxZoom: 16
    }
  },
  {
    name: 'USGS Topo',
    visible: false,
    url: 'https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    attribution: '<a href="http://www.doi.gov">U.S. Department of the Interior</a> | <a href="http://www.usgs.gov">U.S. Geological Survey</a> | <a href="http://www.usgs.gov/laws/policies_notices.html">Policies</a>',
    options: {
      maxZoom: 16
    }
  },
  {
    name: 'USGS Hydrography',
    visible: false,
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}',
    attribution: '<a href="http://www.doi.gov">U.S. Department of the Interior</a> | <a href="http://www.usgs.gov">U.S. Geological Survey</a> | <a href="http://www.usgs.gov/laws/policies_notices.html">Policies</a>',
    options: {
      maxZoom: 16
    }
  },
  {
    name: 'OpenStreetMap',
    visible: false,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'No Basemap',
    visible: false,
    url: '',
    attribution: ''
  }
]

export default {
  name: 'StationsMap',
  props: {
    loading: {
      type: Boolean,
      required: false,
      default: false
    },
    station: {
      type: Object,
      required: false
    },
    stations: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  components: {
    LMap,
    LControlLayers,
    LControlScale,
    LTileLayer,
    LCircleMarker,
    LTooltip
  },
  data: () => ({
    basemaps,
    ready: false,
    map: null
  }),
  computed: {
    selectedStationId () {
      return this.station ? this.station.id : null
    }
  },
  mounted () {
    this.map = this.$refs.map.mapObject
    this.ready = true

    this.fitToStations()
  },
  watch: {
    stations (val, old) {
      if (!old || old.length === 0) this.fitToStations()
    }
  },
  methods: {
    fitToStations () {
      if (!this.stations || this.stations.length === 0) return

      if (this.stations.length === 1) {
        return this.map.setView([
          this.stations[0].latitude,
          this.stations[0].longitude
        ], 12)
      }

      const latitudes = this.stations.map(d => d.latitude)
      const longitudes = this.stations.map(d => d.longitude)
      const minX = Math.min(...longitudes)
      const maxX = Math.max(...longitudes)
      const minY = Math.min(...latitudes)
      const maxY = Math.max(...latitudes)
      const bounds = [
        [minY, minX],
        [maxY, maxX]
      ]
      this.map.fitBounds(bounds, { padding: [50, 50] })
    }
  }
}
</script>

<style>
.fpe-map-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
