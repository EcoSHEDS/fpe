<template>
  <v-data-table
    :headers="headers"
    :items="filtered"
    :loading="loading"
    :value="selectedArray"
    :options="{ itemsPerPage: 5 }"
    :sort-by.sync="sortBy"
    :sort-desc.sync="sortDesc"
    @click:row="select"
    single-select
    dense
    loading-text="Loading... Please wait"
    class="row-cursor-pointer"
  >
    <template v-slot:top>
      <div class="d-flex align-end px-4 pt-2 pb-4">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search stations"
          single-line
          hide-details
          @input="filter"
          style="max-width: 300px;"
          class="pt-0"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-menu
          v-model="filterMenu"
          :close-on-content-click="false"
          offset-y
        >
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              outlined
              small
              :color="filtersOn ? 'primary' : 'grey darken-2'"
            >
              <v-icon left v-if="filtersOn">mdi-filter</v-icon>
              <v-icon left v-else>mdi-filter-outline</v-icon>
              Filters
            </v-btn>
          </template>
          <v-sheet class="py-2" width="300">
            <div class="mt-2 text-subtitle-1 px-4 font-weight-medium">Filter Stations By:</div>
            <v-divider class="my-2"></v-divider>
            <div class="px-4">
              <v-autocomplete
                :items="affiliations"
                v-model="filters.affiliation"
                label="Select affiliation"
                clearable
                hide-details
                @change="filter"
              ></v-autocomplete>
              <v-switch
                v-model="filters.hasModels"
                label="Has Model Results"
                hide-details
                @change="filter"
                class="my-4"
              ></v-switch>
              <v-switch
                v-model="filters.hasValues"
                label="Has Observed Data"
                hide-details
                @change="filter"
                class="my-4"
              ></v-switch>
              <v-switch
                v-model="filters.userOnly"
                label="My Stations Only"
                hide-details
                @change="filter"
                class="my-4"
              ></v-switch>
            </div>
          </v-sheet>
        </v-menu>
      </div>
      <v-divider></v-divider>
    </template>
    <template v-slot:footer.prepend>
      <div class="ml-2">
        Click on a row to select a station.
      </div>
    </template>
    <template v-slot:item.affiliation_code="{ item }">
      {{ item.affiliation_code | truncate(10) }}
    </template>
    <template v-slot:item.name="{ item }">
      {{ item.name | truncate(40) }}
    </template>
    <!-- <template v-slot:item.waterbody_type="{ item }">
      {{ item.waterbody_type | waterbodyType | truncate(17) }}
    </template> -->
    <template v-slot:item.images.count="{ item }">
      <span v-if="item.images && item.images.count > 0">
        {{ item.images.count.toLocaleString() }}
      </span>
      <span v-else>0</span>
    </template>
    <template v-slot:item.images.start_date="{ item }">
      <span v-if="item.images && item.images.count > 0">
        {{ item.images.start_date | formatDate }}
      </span>
    </template>
    <template v-slot:item.images.end_date="{ item }">
      <span v-if="item.images && item.images.count > 0">
        {{ item.images.end_date | formatDate }}
      </span>
    </template>
    <template v-slot:item.has_obs="{ item }">
      <v-simple-checkbox :value="item.has_obs" disabled></v-simple-checkbox>
    </template>
    <template v-slot:item.has_model="{ item }">
      <v-simple-checkbox :value="item.has_model" disabled></v-simple-checkbox>
    </template>
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
      filterMenu: false,
      search: '',
      sortBy: ['has_model', 'images.count'],
      sortDesc: [true, true],
      filters: {
        affiliation: null,
        hasValues: false,
        hasModels: false,
        userOnly: false
      },
      headers: [
        {
          text: 'Affiliation',
          value: 'affiliation_code',
          align: 'center',
          width: 150
        },
        {
          text: 'Station Name',
          value: 'name',
          align: 'left'
        },
        // {
        //   text: 'Waterbody Type',
        //   value: 'waterbody_type',
        //   align: 'left'
        // },
        {
          text: '# Photos',
          value: 'images.count',
          align: 'right',
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
          text: 'Obs. Data',
          value: 'has_obs',
          align: 'center',
          sortable: true
        },
        {
          text: 'Model',
          value: 'has_model',
          align: 'center',
          sortable: true
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
    },
    filtersOn () {
      return Object.values(this.filters).some(d => !!d)
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
        .filter(d => (!this.search || d.name.toLowerCase().includes(this.search.toLowerCase())))
        .filter(d => (d.images && d.images.count > 0))
        .filter(d => (!this.filters.hasValues || (d.has_obs)))
        .filter(d => (!this.filters.hasModels || (d.models && d.models.length > 0)))
        .filter(d => (!this.filters.userOnly || (this.user && d.user_id === this.user.username)))
      this.$emit('filter', filtered)
    },
    select (station) {
      this.$emit('select', station)
    }
  }
}
</script>
