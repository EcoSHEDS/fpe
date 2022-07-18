<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4">
          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5" v-if="$vuetify.breakpoint.mobile">
              <span v-if="loading">Loading</span>
              <span v-else-if="!!station">{{ station.name }}</span>
            </v-toolbar-title>
            <v-toolbar-title class="text-h5" v-else>
              Photo Explorer |
              <span class="text-subtitle-1" v-if="loading">Loading</span>
              <span class="text-subtitle-1" v-else-if="!!station">{{ station.name }}</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn color="default" text small :to="{ name: 'explorer' }" exact>
              <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Stations Map</span><span v-else>Back</span>
            </v-btn>
          </v-toolbar>

          <v-card-text class="body-1 black--text" style="position:relative;height:100%;width:100%">
            <v-row v-if="loading" justify="space-around">
              <v-col cols="6">
                <div>
                  <div class="text--secondary" style="height:300px"></div>
                  <v-overlay color="grey lighten-2" absolute>
                    <div class="text-h3 text-center grey--text">
                      <div>Loading</div>
                      <v-progress-circular
                        color="grey"
                        indeterminate
                        size="32"
                        width="4"
                        class="mt-8"
                      ></v-progress-circular>
                    </div>
                  </v-overlay>
                </div>
              </v-col>
            </v-row>
            <v-row v-else-if="error" justify="space-around">
              <v-col cols="6" height="200px">
                <div class="text-h3 text-center">Error</div>
              </v-col>
            </v-row>
            <v-row v-else-if="station" align="stretch">
              <!-- INFO -->
              <v-col cols="12" md="4">
                <v-sheet elevation="2" rounded style="height:100%">
                  <StationSummary :station="station"></StationSummary>
                </v-sheet>
              </v-col>

              <!-- DATA -->
              <v-col cols="12" md="8">
                <v-sheet elevation="2" rounded style="height:100%" class="pt-4">
                  <v-alert
                    type="error"
                    text
                    colored-border
                    border="left"
                    class="body-2 mx-4"
                    v-if="!station.summary || !station.summary.images || station.summary.images.n_images === 0"
                  >
                    <div class="font-weight-bold body-1">No Photos Available</div>
                    <div>This station does not have any photos. Please go back to the <router-link :to="{ name: 'explorer' }">stations map</router-link> and select a different station.</div>
                  </v-alert>
                  <StationCharts :station="station" v-else></StationCharts>
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
import StationSummary from '@/components/explorer/StationSummary'
import StationCharts from '@/components/explorer/StationCharts'

export default {
  name: 'ExplorerStation',
  components: {
    StationSummary,
    StationCharts
  },
  data: () => ({
    loading: true,
    error: null,
    station: null,
    provisionalAffiliations: process.env.VUE_APP_PROVISIONAL_AFFILIATIONS.split(',')
  }),
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      try {
        const response = await this.$http.public.get(`/stations/${this.$route.params.stationId}`)
        this.station = response.data
        this.station.provisional = this.provisionalAffiliations.includes(this.station.affiliation_code)
        this.station.stats = {
          data: {
            days: (Math.random() < 0.5) * Math.floor(Math.random() * 10000),
            start: null,
            end: null
          },
          images: {
            count: Math.floor(Math.random() * 10000),
            start: 'Aug 1, 2019',
            end: 'Sep 30, 2020'
          }
        }
        if (this.station.stats.data.days > 0) {
          this.station.stats.data.start = 'Aug 1, 2019'
          this.station.stats.data.end = 'Sep 30, 2020'
        }
      } catch (err) {
        console.error(err)
        this.error = err.message || err.toString()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
