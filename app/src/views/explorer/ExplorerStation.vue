<template>
  <v-row>
    <v-col cols="12">
      <v-sheet class="pa-8 text-center" elevation="4" v-if="loading">
          <div class="text-h5">Loading Station...</div>
          <v-progress-circular
            color="grey"
            indeterminate
            size="32"
            width="4"
            class="mt-8"
          ></v-progress-circular>
      </v-sheet>
      <v-sheet class="pa-8" elevation="4" v-else-if="error || !station">
        <Alert type="error" title="Error">
          <div>There was an error loading the station.</div>
          <div class="mt-4 font-weight-bold" v-if="error">{{ error }}</div>
        </Alert>
      </v-sheet>
      <v-card elevation="4" v-else>
        <v-toolbar flat dense color="grey lighten-4">
          <v-toolbar-title class="text-h6">
            {{ station.name }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon small :to="{ name: 'explorerHome' }" exact>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-row no-gutters>
          <v-col cols="3">
            <StationInfo
              :station="station"
            ></StationInfo>
          </v-col>
          <v-divider vertical></v-divider>
          <v-col cols="9">
            <StationPhotos
              :station="station"
            ></StationPhotos>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters } from 'vuex'
import StationInfo from '@/components/explorer/StationInfo'
import StationPhotos from '@/components/explorer/StationPhotos'

export default {
  name: 'StationViewer',
  components: {
    StationInfo,
    StationPhotos
  },
  data () {
    return {
      loading: true,
      error: null,
      station: null
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    this.fetch()
  },
  watch: {
    '$route.params.id' () {
      this.fetch()
    }
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null
      this.station = null
      try {
        let response
        if (this.user) {
          response = await this.$http.restricted.get(`/stations/${this.$route.params.id}`)
        } else {
          response = await this.$http.public.get(`/stations/${this.$route.params.id}`)
        }
        const station = response.data
        if (response.status !== 200 || !station) {
          throw new Error('Station not found')
        }
        this.station = station
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
