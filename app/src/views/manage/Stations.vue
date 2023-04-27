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
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.name="{ item }">
        {{ item.name | truncate(45) }}
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.waterbody_type="{ item }">
        {{ item.waterbody_type | waterbodyType }}
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.status="{ item }">
        {{ item.status | stationStatus }}
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.summary.images.n_images="{ item }">
        <span v-if="item.summary && item.summary.images && item.summary.images.n_images > 0">
          {{ item.summary.images.n_images.toLocaleString() }}
        </span>
        <span v-else>0</span>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.summary.images.period="{ item }">
        <span v-if="item.summary && item.summary.images && item.summary.images.n_images > 0">
          {{ item.summary.images.start_date | timestampFormat('ll') }} &#8211;
          {{ item.summary.images.end_date | timestampFormat('ll') }}
        </span>
        <span v-else>No Photos</span>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.hasValues="{ item }">
        <v-simple-checkbox :value="item.hasValues" disabled></v-simple-checkbox>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.private="{ item }">
        <v-simple-checkbox :value="item.private" disabled></v-simple-checkbox>
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
          value: 'summary.images.n_images',
          align: 'center',
          width: 120
        },
        {
          text: 'Photo Period',
          value: 'summary.images.period',
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
          d.hasImages = d.summary && d.summary.images && d.summary.images.n_images > 0
          d.hasValues = d.summary && d.summary.values && d.summary.values.n_rows > 0
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
