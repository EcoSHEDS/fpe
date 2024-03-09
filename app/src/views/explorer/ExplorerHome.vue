<template>
  <v-container fluid>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4" class="pb-4">
          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Photo Explorer
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="body-1 black--text pb-0">
            <v-row align="stretch">
              <v-col cols="12" lg="4">
                <v-sheet elevation="2" style="height:400px">
                  <StationsMap
                    :loading="loading"
                    :stations="stations.filtered"
                    :station="stations.selected"
                    @select="select">
                  </StationsMap>
                </v-sheet>
              </v-col>

              <v-col cols="12" lg="8">
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

            <router-view></router-view>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ascending } from 'd3-array'
import { mapGetters } from 'vuex'

import StationsMap from '@/components/explorer/StationsMap'
import StationsTable from '@/components/explorer/StationsTable'

export default {
  name: 'ExplorerHome',
  components: {
    StationsMap,
    StationsTable
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
  async mounted () {
    await this.fetch()
    if (this.$route.params.id) {
      this.stations.selected = this.stations.all.find(d => d.id === +this.$route.params.id)
    }
  },
  watch: {
    '$route.params.id' () {
      this.stations.selected = this.stations.all.find(d => d.id === +this.$route.params.id)
    }
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
        stations.forEach(d => {
          d.has_obs = (d.variables && d.variables.length > 0) || !!d.nwis_id
          d.has_model = (d.models && d.models.length > 0)
        })
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
        this.$router.push({ name: 'explorerStation', params: { id: station.id } })
      } else {
        this.stations.selected = null
        if (this.$route.name === 'explorerStation') {
          this.$router.push({ name: 'explorerHome' })
        }
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
