<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4">

          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Photo Explorer | <span class="text-subtitle-1">Find a Station</span>
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="body-1 black--text">
            <v-row align="stretch">
              <!-- MAP -->
              <v-col cols="12" md="6">
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
              <v-col cols="12" md="6">
                <v-sheet elevation="2" rounded class="pa-2">
                  <div v-if="loading" class="text-center grey lighten-2 py-8">
                    <div class="text-h5 mb-8 grey--text">Loading stations...</div>
                    <v-progress-circular
                      color="grey"
                      indeterminate
                      size="32"
                      width="4"
                    ></v-progress-circular>
                  </div>
                  <div v-else-if="error">
                    <v-alert
                      type="error"
                      text
                      colored-border
                      border="left"
                      class="body-2 mb-0"
                    >
                      <div class="font-weight-bold body-1">Failed to Get Stations</div>
                      <div>{{ error }}</div>
                    </v-alert>
                  </div>
                  <StationPreview
                    v-else-if="stations.selected"
                    :station-id="stations.selected.id"
                    @close="select"
                  ></StationPreview>
                  <div v-else>
                    <v-container v-if="!stations.selected">
                      <v-alert
                        type="info"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0"
                        :icon="$vuetify.breakpoint.mobile ? 'mdi-chevron-up-circle' : 'mdi-chevron-left-circle'"
                      >
                        <div class="body-1">
                          Select a station on the map or from the table below
                        </div>
                      </v-alert>
                    </v-container>
                  </div>
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

import StationsMap from '@/components/StationsMap'
import StationsTable from '@/components/StationsTable'
import StationPreview from '@/components/StationPreview'

export default {
  name: 'ExplorerMap',
  components: {
    StationsMap,
    StationsTable,
    StationPreview
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

        this.stations.all.forEach(d => {
          d.hasImages = d.summary && d.summary.images && d.summary.images.n_images > 0
          d.hasValues = d.summary && d.summary.values && d.summary.values.n_rows > 0
        })
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
