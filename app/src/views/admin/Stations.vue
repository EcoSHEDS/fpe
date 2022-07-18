<template>
  <div>
    <v-alert
      type="error"
      text
      colored-border
      border="left"
      class="body-2 mb-0"
      v-if="error"
    >
      <div class="body-1 font-weight-bold">Error Occurred</div>
      <div>{{ error }}</div>
    </v-alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="stations"
      :loading="loading"
      loading-text="Loading... Please wait"
      :sort-by="['updated_at']"
      :sort-desc="[true]"
      @click:row="select"
      single-select
      class="row-cursor-pointer"
      v-else>
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Stations</div>
          <v-btn
            color="primary"
            outlined
            @click="fetch"
            class="ml-4"
            small
            rounded
          >
            <v-icon small left v-if="!loading">mdi-refresh</v-icon>
            <v-progress-circular
              indeterminate
              size="14"
              width="2"
              class="mr-2"
              v-else
            ></v-progress-circular>
            Refresh
          </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.user.attributes.email="{ item }">
        {{ item.user.attributes.email | truncate(32) }}
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestampFormat('ll') }}
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.name="{ item }">
        {{ item.name | truncate(32) }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  name: 'AdminStations',
  data () {
    return {
      loading: true,
      stations: [],
      error: null,
      search: '',
      headers: [
        {
          text: 'User',
          value: 'user.attributes.email',
          align: 'left'
        },
        {
          text: 'Id',
          value: 'id',
          align: 'left'
        },
        {
          text: 'Created at',
          value: 'created_at',
          align: 'left'
        },
        {
          text: 'Name',
          value: 'name',
          align: 'left'
        },
        {
          text: 'Latitude',
          value: 'latitude',
          align: 'right'
        },
        {
          text: 'Longitude',
          value: 'longitude',
          align: 'right'
        },
        {
          text: 'Private',
          value: 'private',
          align: 'center'
        }
      ]
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetchUsers () {
      const response = await this.$http.admin.get('/users')
      return response.data
    },
    async fetch () {
      this.loading = true
      this.error = null
      try {
        const users = await this.fetchUsers()
        const userMap = new Map(users.map(d => [d.id, d]))
        const response = await this.$http.admin.get('/stations')
        const stations = response.data

        stations.forEach(d => {
          d.created_at = new Date(d.created_at)
          d.updated_at = new Date(d.updated_at)
          d.user = userMap.get(d.user_id)
        })
        this.stations = stations
      } catch (err) {
        console.log(err)
        if (err.response && err.response.data) {
          this.error = err.response.data.message || err.toString()
        } else {
          this.error = err.message || err.toString()
        }
      } finally {
        this.loading = false
      }
    },
    select (row) {
      console.log('select', row)
    }
  }
}
</script>
