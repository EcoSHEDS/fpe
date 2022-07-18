<template>
  <v-container style="position:relative">
    <div class="d-flex" v-if="!loading">
      <div class="text-h6">
        <span v-if="error || !station">Error</span>
        <span v-else>{{ station.name | truncate(40) }}</span>
      </div>
      <v-spacer></v-spacer>
      <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
    </div>

    <div style="height:200px" v-if="loading">
      <v-overlay absolute class="text-center py-8" color="grey lighten-2">
        <div class="text-h6 mb-8 grey--text">Loading station...</div>
        <v-progress-circular
          color="grey"
          indeterminate
          size="32"
          width="4"
        ></v-progress-circular>
      </v-overlay>
    </div>

    <div v-else-if="error">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Failed to Fetch Station</div>
        <div class="mb-2">
          An error occurred fetching this station from the server.
        </div>
        <div>{{ error }}</div>
      </v-alert>
    </div>
    <div v-else-if="station">
      <div class="text-subtitle-2 text--secondary">{{ station.affiliation_name | truncate(70) }}</div>
      <PreviewChart :station="station"></PreviewChart>
    </div>
    <div v-else>
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Hmm, something went wrong</div>
        <div>
          Unable to retrieve this station, but no error occurred.
        </div>
      </v-alert>
    </div>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'
import PreviewChart from '@/components/charts/PreviewChart'
export default {
  name: 'StationPreview',
  components: {
    PreviewChart
  },
  props: {
    stationId: {
      type: Number,
      required: true
    }
  },
  data () {
    return {
      loading: false,
      error: null,
      station: null,
      provisionalAffiliations: process.env.VUE_APP_PROVISIONAL_AFFILIATIONS.split(',')
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    this.fetch()
  },
  watch: {
    stationId () {
      this.fetch()
    }
  },
  methods: {
    async fetch () {
      this.loading = true
      try {
        const response = await this.$http.public.get(`/stations/${this.stationId}`)
        this.station = response.data
        this.station.provisional = this.provisionalAffiliations.includes(this.station.affiliation_code)
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
