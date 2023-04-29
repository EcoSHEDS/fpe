<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4">

          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Photo Explorer | <span class="text-subtitle-1">Stations Map</span>
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="body-1 black--text">
            <v-row align="stretch">
              <!-- MAP -->
              <v-col cols="12" lg="6">
                <v-sheet elevation="2" style="height:450px;">
                  <StationsMap
                    :loading="loading"
                    :stations="stations.filtered"
                    :station="stations.selected"
                    @select="select">
                  </StationsMap>
                </v-sheet>
              </v-col>

              <!-- STATION INFO -->
              <v-col cols="12" lg="6">
                <v-sheet elevation="2" rounded class="pa-2">
                  <div v-if="loading" class="text-center grey lighten-2 py-8">
                    <div class="text-h5 mb-8">Loading stations...</div>
                    <v-progress-circular
                      color="grey"
                      indeterminate
                      size="32"
                      width="4"
                    ></v-progress-circular>
                  </div>
                  <Alert v-else-if="error" type="error" class="mb-0" title="Failed to Get Stations">{{ error }}</Alert>
                  <StationDetail
                    v-else-if="stations.selected"
                    :station-id="stations.selected.id"
                    @close="select"
                  ></StationDetail>
                  <Alert v-else type="info" class="mb-0">
                    <div class="body-1">Select a station on the map or from the table below</div>
                  </Alert>
                </v-sheet>
              </v-col>
            </v-row>

            <!-- STATIONS TABLE -->
            <v-row v-if="!error">
              <v-col cols="12">
                <v-sheet elevation="2" rounded>
                  <StationsTable
                    :loading="loading"
                    :stations="stations.all"
                    :filtered="stations.filtered"
                    :selected="stations.selected"
                    @select="select"
                    @filter="filter"
                  ></StationsTable>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ascending } from 'd3'
import { mapGetters } from 'vuex'

import StationsMap from '@/components/explorer/StationsMap'
import StationsTable from '@/components/explorer/StationsTable'
import StationDetail from '@/components/explorer/StationDetail'

export default {
  name: 'explorer',
  components: {
    StationsMap,
    StationsTable,
    StationDetail
  },
  data: () => ({
    loading: true,
    error: null,
    stations: {
      all: [],
      filtered: [],
      selected: null
    }
  }),
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      try {
        let stations = []
        if (this.user && this.user.isAdmin) {
          const response = await this.$http.admin.get('/stations')
          stations = response.data
        } else if (this.user) {
          const publicResponse = await this.$http.public.get('/stations')
          const publicStations = publicResponse.data
          const userResponse = await this.$http.restricted.get(`/users/${this.user.username}/stations`)
          const privateUserStations = userResponse.data.filter(d => d.private)
          stations = [...publicStations, ...privateUserStations]
        } else {
          const response = await this.$http.public.get('/stations')
          stations = response.data
        }
        this.stations.all = stations.sort((a, b) => ascending(a.id, b.id))
        this.stations.filtered = this.stations.all
      } catch (err) {
        console.error(err)
        this.error = err.toString()
      } finally {
        this.loading = false
      }
    },
    select (station) {
      if (station && this.stations.selected !== station) {
        this.stations.selected = station
      } else {
        this.stations.selected = null
      }
    },
    filter (filtered) {
      this.stations.filtered = filtered

      if (!this.stations.filtered.includes(this.stations.selected)) {
        this.select()
      }
    }
  }
}
</script>
