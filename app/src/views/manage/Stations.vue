<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="stations"
      :loading="loading"
      @click:row="clickRow"
      loading-text="Loading... Please wait"
      class="row-cursor-pointer">
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="text-h5">Stations</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="create">
            <v-icon left>mdi-plus</v-icon> New Station
          </v-btn>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to edit a station or upload new photos or data
        </div>
        <v-divider></v-divider>
      </template>
      <template v-slot:item.name="{ item }">
        {{ item.name | truncate(45) }}
      </template>
      <template v-slot:item.waterbody_type="{ item }">
        {{ item.waterbody_type | waterbodyType }}
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip
          color="grey-lighten-2"
          small
          label
        >
          {{ item.status }}
        </v-chip>
      </template>
      <template v-slot:item.images.count="{ item }">
        <span v-if="item.images && item.images.count > 0">
          {{ item.images.count.toLocaleString() }}
        </span>
        <span v-else>0</span>
      </template>
      <template v-slot:item.images.period="{ item }">
        <span v-if="item.images && item.images.count > 0">
          {{ item.images.start_date | formatDate }} &#8211;
          {{ item.images.end_date | formatDate }}
        </span>
        <span v-else>No Photos</span>
      </template>
      <template v-slot:item.hasValues="{ item }">
        <v-simple-checkbox :value="item.hasValues" disabled></v-simple-checkbox>
      </template>
      <template v-slot:item.private="{ item }">
        <v-simple-checkbox :value="item.private" disabled></v-simple-checkbox>
      </template>
      <template v-slot:item.access_level="{ item }">
        <v-chip
          color="grey-lighten-2"
          small
          label
        >
          {{ item.user_id === user.username ? 'OWNER' : 'COLLABORATOR' }}
        </v-chip>
      </template>
    </v-data-table>
    <StationForm ref="stationForm"></StationForm>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import StationForm from '@/components/forms/StationForm'

export default {
  name: 'ManageStations',
  components: { StationForm },
  data () {
    return {
      loading: true,
      stations: [],
      error: null,
      search: '',
      headers: [
        {
          text: 'Id',
          value: 'id',
          align: 'left',
          width: 80
        },
        {
          text: 'Name',
          value: 'name',
          align: 'left'
        },
        {
          text: 'Waterbody Type',
          value: 'waterbody_type',
          align: 'left'
        },
        {
          text: '# Photos',
          value: 'images.count',
          align: 'center',
          width: 120
        },
        {
          text: 'Photo Period',
          value: 'images.period',
          align: 'center',
          sortable: false,
          width: 250
        },
        {
          text: 'Has Obs. Data',
          value: 'hasValues',
          align: 'center',
          sortable: true,
          width: 140
        },
        {
          text: 'Private',
          value: 'private',
          align: 'center',
          sortable: true,
          width: 120
        },
        {
          text: 'Status',
          value: 'status',
          align: 'left'
        },
        {
          text: 'Access Level',
          value: 'access_level',
          align: 'left'
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.restricted.get(`/users/${this.user.username}/stations`)
        this.stations = response.data

        this.stations.forEach(d => {
          d.hasImages = d.images && d.images.count > 0
          d.hasValues = (d.variables && d.variables.length > 0) || !!d.nwis_id
        })
      } catch (err) {
        this.error = err.toString()
      } finally {
        this.loading = false
      }
    },
    async create () {
      const station = await this.$refs.stationForm.open()
      if (station) {
        await this.fetch()
      }
    },
    clickRow (station) {
      this.$router.push({ name: 'manageStation', params: { stationId: station.id } })
    }
  }
}
</script>
