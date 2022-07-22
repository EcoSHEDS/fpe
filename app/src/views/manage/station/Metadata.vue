<template>
  <v-container grid-list-xs>
    <v-row v-if="loading">
      <v-col cols="12">
        <div class="text-h6">Loading...</div>
      </v-col>
    </v-row>
    <v-row v-else-if="!!error" justify="space-around">
      <v-col cols="12" md="8">
        <v-alert
          type="error"
          text
          colored-border
          border="left"
          class="body-2 mb-0"
          elevation="2"
        >
          <div class="font-weight-bold body-1">Station Not Found</div>
          <div>{{ error }}</div>
        </v-alert>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title class="text-h5 py-2">
            Station Information
          </v-card-title>
          <v-divider></v-divider>
          <v-simple-table dense>
            <tbody>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:100px">
                  ID
                </td>
                <td class="font-weight-bold">{{ station.id }}</td>
              </tr>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:100px">
                  Name
                </td>
                <td class="font-weight-bold">{{ station.name }}</td>
              </tr>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:100px">
                  Description
                </td>
                <td class="font-weight-bold">{{ station.description }}</td>
              </tr>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:100px">
                  Latitude
                </td>
                <td class="font-weight-bold">{{ station.latitude.toFixed(4) }}</td>
              </tr>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:100px">
                  Longitude
                </td>
                <td class="font-weight-bold">{{ station.longitude.toFixed(4) }}</td>
              </tr>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:100px">
                  Timezone
                </td>
                <td class="font-weight-bold">{{ station.timezone }}</td>
              </tr>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:100px">
                  Private
                </td>
                <td class="font-weight-bold">{{ station.private }}</td>
              </tr>
            </tbody>
          </v-simple-table>
          <v-divider></v-divider>
          <div class="mx-4 mt-4 pb-4">
            <div class="mb-4">
              <v-btn block outlined color="primary" @click="edit">
                <v-icon left>mdi-pencil</v-icon> Edit Station
              </v-btn>
            </div>
            <div>
              <v-btn block outlined color="error" @click="confirmDelete" :loading="deleter.loading">
                <v-icon left>mdi-delete</v-icon> Delete Station
              </v-btn>
            </div>
          </div>
          <v-card-text v-if="!deleter.loading && deleter.error">
            <v-alert
              type="error"
              text
              colored-border
              border="left"
              class="body-2 mb-0"
            >
              <div class="font-weight-bold body-1">Failed to Delete Station</div>
              <div>{{ deleter.error }}</div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <v-card height="500" elevation="2">
          <StationsMap
            :loading="loading"
            :stations="[station]"
            :station="station">
          </StationsMap>
        </v-card>
      </v-col>
    </v-row>

    <StationForm ref="stationForm"></StationForm>

    <ConfirmDialog ref="confirmDelete">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Are you sure?</div>
        <div>
          All of the datasets and images associated with this station set will be deleted from the server. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-container>
</template>

<script>
import ConfirmDialog from '@/components/ConfirmDialog'
import StationForm from '@/components/forms/StationForm'
import StationsMap from '@/components/StationsMap'
import evt from '@/events'

export default {
  name: 'ManageMetadata',
  components: { StationsMap, ConfirmDialog, StationForm },
  data () {
    return {
      loading: true,
      error: null,
      station: null,
      deleter: {
        loading: false,
        error: null
      }
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null
      try {
        const response = await this.$http.public.get(`/stations/${this.$route.params.stationId}`)
        this.station = response.data
        // this.loading = false
      } catch (err) {
        console.log(err)
        this.error = err.message || err.toString()
      }
      this.loading = false
    },
    async edit () {
      const station = await this.$refs.stationForm.open(this.station)
      if (station) {
        await this.fetch()
      }
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteStation()
      }
    },
    async deleteStation () {
      this.deleter.loading = true
      this.deleter.error = null
      try {
        await this.$http.restricted.delete(`/stations/${this.station.id}`)
        evt.$emit('notify', 'success', `Station (${this.station.name}) has been deleted`)
        this.deleter.loading = false
        this.$router.push({ name: 'manage' })
      } catch (err) {
        console.log(err)
        this.deleter.error = err.message || err.toString()
      }
    }
  }
}
</script>

<style>

</style>
