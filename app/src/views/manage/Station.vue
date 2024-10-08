<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4">
          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
              <span class="text-h5">Manage Station | </span>
              <span class="body-1">{{ station ? station.name : 'Loading...' }}</span>
            </v-toolbar-title>
            <v-toolbar-title class="text-h6" v-else>
              <span class="text-h5">{{ station ? station.name : 'Loading...' }}</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn text @click="$router.push({ name: 'manage' })">
              <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to All Stations</span><span v-else>Back</span>
            </v-btn>
          </v-toolbar>
          <v-tabs class="elevation-2 mb-4" grow :vertical="$vuetify.breakpoint.mobile">
            <v-tab :to="{ name: 'manageStation' }" exact>
              <v-icon left>mdi-map-marker</v-icon> Information
            </v-tab>
            <v-tab :to="{ name: 'manageImagesets' }" exact>
              <v-icon left>mdi-image-multiple-outline</v-icon> Photos
            </v-tab>
            <v-tab :to="{ name: 'manageDatasets' }" exact>
              <v-icon left>mdi-chart-line</v-icon> Data
            </v-tab>
            <v-tab :to="{ name: 'managePermissions' }" exact v-if="station && user.username === station.user_id">
              <v-icon left>mdi-account-multiple</v-icon> Permissions
            </v-tab>
          </v-tabs>
          <router-view></router-view>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ManageStation',
  data () {
    return {
      station: null
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    this.fetch()
  },
  methods: {
    fetch () {
      this.$http.public.get(`/stations/${this.$route.params.stationId}`)
        .then(response => response.data)
        .then(data => {
          this.station = data
        })
    }
  }
}
</script>
