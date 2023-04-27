<template>
  <v-data-table
    :headers="headers"
    :items="filtered"
    :loading="loading"
    :value="selectedArray"
    :options="{ itemsPerPage: 10 }"
    @click:row="select"
    single-select
    dense
    loading-text="Loading... Please wait"
    class="row-cursor-pointer"
  >
    <template v-slot:top>
      <v-toolbar flat dense>
        <v-toolbar-title class="text-h5">
          Available Stations
        </v-toolbar-title>
      </v-toolbar>

      <v-toolbar flat dense>
        <v-row justify="space-between" class="mt-n8">
          <v-col cols="2" v-if="!$vuetify.breakpoint.mobile">
            <v-select
              :items="affiliations"
              v-model="filters.affiliation"
              label="Affiliation"
              clearable
              hide-details
              @change="filter"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.search"
              append-icon="mdi-magnify"
              label="Search by Name"
              single-line
              hide-details
              @input="filter"
            ></v-text-field>
          </v-col>
          <v-col cols="2" v-if="!$vuetify.breakpoint.mobile">
            <div class="d-flex justify-center">
              <v-switch
                v-model="filters.hasImages"
                label="With Photos"
                hide-details
                @change="filter"
              ></v-switch>
            </div>
          </v-col>
          <v-col cols="2" v-if="!$vuetify.breakpoint.mobile">
            <div class="d-flex justify-center">
              <v-switch
                v-model="filters.hasValues"
                label="With Obs. Data"
                hide-details
                @change="filter"
              ></v-switch>
            </div>
          </v-col>
          <v-col cols="2" v-if="!$vuetify.breakpoint.mobile && user">
            <div class="d-flex justify-center">
              <v-switch
                v-model="filters.userOnly"
                label="My Stations"
                hide-details
                @change="filter"
              ></v-switch>
            </div>
          </v-col>
        </v-row>
      </v-toolbar>
      <div class="body-2 text--secondary mx-4 mb-2">
        <v-icon x-small>mdi-information-outline</v-icon> Click on a row to select a station.
      </div>

      <v-divider></v-divider>
    </template>
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template v-slot:item.name="{ item }">
      {{ item.name | truncate(40) }}
    </template>
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template v-slot:item.waterbody_type="{ item }">
      {{ item.waterbody_type | waterbodyType | truncate(17) }}
    </template>
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template v-slot:item.images.count="{ item }">
      <span v-if="item.images.count > 0">
        {{ item.images.count.toLocaleString() }}
      </span>
      <span v-else>0</span>
    </template>
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template v-slot:item.images.start_date="{ item }">
      <span v-if="item.images.count > 0">
        {{ item.images.start_date | timestampFormat('ll') }}
      </span>
    </template>
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template v-slot:item.images.end_date="{ item }">
      <span v-if="item.images.count > 0">
        {{ item.images.end_date | timestampFormat('ll') }}
      </span>
    </template>
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template v-slot:item.variables="{ item }">
      <v-simple-checkbox :value="item.variables.length > 0" disabled></v-simple-checkbox>
    </template>
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template v-slot:item.private="{ item }">
      <v-simple-checkbox :value="item.private" disabled></v-simple-checkbox>
    </template>
  </v-data-table>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'StationsTable',
  props: ['stations', 'filtered', 'selected', 'loading'],
  data () {
    return {
      filters: {
        affiliation: null,
        search: '',
        hasImages: false,
        hasValues: false,
        userOnly: false
      },
      headers: [
        {
          text: 'Affiliation',
          value: 'affiliation_code',
          align: 'left',
          width: 120
        },
        {
          text: 'Station Name',
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
          text: 'Start',
          value: 'images.start_date',
          align: 'right',
          sortable: true
        },
        {
          text: 'End',
          value: 'images.end_date',
          align: 'right',
          sortable: true
        },
        {
          text: 'Has Obs. Data',
          value: 'variables',
          align: 'center',
          sortable: true,
          width: 140
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['user']),
    affiliations () {
      if (!this.stations) return []
      return this.stations.map(d => d.affiliation_code).sort()
    },
    selectedArray () {
      // wrap in array for v-data-table in StationTable
      return this.selected ? [this.selected] : []
    }
  },
  mounted () {
    if (this.user && this.user.isAdmin) {
      this.headers.push({
        text: 'Private',
        value: 'private',
        align: 'center',
        width: 120
      })
    }
  },
  methods: {
    filter () {
      const filtered = this.stations
        .filter(d => (!this.filters.affiliation || d.affiliation_code === this.filters.affiliation))
        .filter(d => (!this.filters.search || d.name.toLowerCase().includes(this.filters.search.toLowerCase())))
        .filter(d => (!this.filters.hasImages || (d.images.count > 0)))
        .filter(d => (!this.filters.hasValues || (d.variables.length > 0)))
        .filter(d => (!this.filters.userOnly || (this.user && d.user_id === this.user.username)))
      this.$emit('filter', filtered)
    },
    select (station) {
      this.$emit('select', station)
    }
  }
}
</script>
