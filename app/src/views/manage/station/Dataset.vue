<template>
  <div>
    <v-container class="px-0 pt-0">
      <v-card>
        <v-card-title class="text-h5">
          Selected File
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            outlined
            @click="refresh"
            small
            rounded
          >
            <v-icon small left v-if="!refresher.loading">mdi-refresh</v-icon>
            <v-progress-circular
              indeterminate
              size="14"
              width="2"
              class="ml-0 mr-2"
              v-else
            ></v-progress-circular>
            Refresh
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text>
          <v-row v-if="loading">
            <v-col cols="12">Loading...</v-col>
          </v-row>
          <v-row v-else-if="!!error">
            <v-col cols="12">
              <v-alert
                type="error"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
              >
                <div class="font-weight-bold body-1">File Not Found</div>
                <div>{{ error }}</div>
              </v-alert>
            </v-col>
          </v-row>
          <v-row v-else-if="dataset">
            <v-col cols="12" md="5">
              <v-simple-table dense>
                <tbody>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      ID
                    </td>
                    <td class="font-weight-bold">{{ dataset.id }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      Uploaded
                    </td>
                    <td class="font-weight-bold">
                      {{dataset.created_at | formatTimestamp('local', 'DD t') }} ({{ dataset.created_at | timestampFromNow }})
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      Filename
                    </td>
                    <td class="font-weight-bold">
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <a download :href="dataset.url" v-on="on">{{ dataset.filename | truncate(32) }}</a>
                        </template>
                        <span>{{ dataset.filename }}</span>
                      </v-tooltip>
                    </td>
                  </tr>
                  <tr v-if="dataset.status === 'DONE'">
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      # Rows
                    </td>
                    <td class="font-weight-bold">{{ dataset.n_rows ? dataset.n_rows.toLocaleString() : '' }}</td>
                  </tr>
                  <tr v-if="dataset.status === 'DONE'">
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      Start
                    </td>
                    <td class="font-weight-bold">
                      <span v-if="dataset.start_timestamp">{{ dataset.start_timestamp | formatTimestamp(station.timezone, 'DD ttt') }}</span>
                    </td>
                  </tr>
                  <tr v-if="dataset.status === 'DONE'">
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      End
                    </td>
                    <td class="font-weight-bold">
                      <span v-if="dataset.end_timestamp">{{ dataset.end_timestamp | formatTimestamp(station.timezone, 'DD ttt') }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      Additional Info
                    </td>
                    <td class="font-weight-bold">{{ dataset.metadata && dataset.metadata.description ? dataset.metadata.description : 'None' | truncate(100) }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:140px">
                      Status
                    </td>
                    <td class="font-weight-bold"><StatusChip :status="dataset.status"></StatusChip></td>
                  </tr>
                </tbody>
              </v-simple-table>
              <v-btn
                color="primary"
                class="my-4"
                outlined
                block
                download
                :href="dataset.url"
                :disabled="!dataset.url"
              >
                <v-icon left>mdi-download</v-icon> Download File
              </v-btn>
              <v-btn
                color="error"
                class="mt-4"
                outlined
                block
                :loading="deleter.loading"
                @click="confirmDeleteDataset"
              >
                <v-icon left>mdi-delete</v-icon> Delete File
              </v-btn>

              <v-alert
                type="error"
                text
                colored-border
                border="left"
                class="body-2 mb-0 mt-4"
                :value="!deleter.loading && deleter.error"
              >
                <div class="font-weight-bold body-1">Failed to Delete File</div>
                <div class="mt-2">{{ deleter.error }}</div>
              </v-alert>
            </v-col>
            <v-col cols="12" md="7" v-if="dataset">
              <v-alert
                type="warning"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-if="dataset.status === 'UPLOADING'"
              >
                <div class="font-weight-bold body-1">File is uploading</div>
                <div>
                  This may indicate that the upload was started, but did not finish. If you started this upload but closed the webpage before it was completed or if this file appears to be stuck in "uploading" state, then it likely means the upload has stalled or failed. In that case, please delete this file and try uploading it again.
                </div>
              </v-alert>
              <v-alert
                type="info"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-else-if="dataset.status === 'QUEUED'"
              >
                <div class="font-weight-bold body-1">File is queued for processing</div>
                <div>
                  This file has been successfully uploaded and is now queued for processing. It generally takes about a minute for the server to begin processing a new file.
                </div>
              </v-alert>
              <v-alert
                type="warning"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-else-if="dataset.status === 'PROCESSING'"
              >
                <div class="font-weight-bold body-1">File is being processed</div>
                <div>
                  Processing time depends on the size of the files, but usually takes less than a minute.
                </div>
              </v-alert>
              <v-alert
                type="error"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-else-if="dataset.status === 'FAILED'"
              >
                <div class="font-weight-bold body-1">Failed to Process Dataset</div>
                <p>
                  The server failed to process this dataset, see error message below. After addressing the issue, please delete this failed dataset and try uploading the file again as a new dataset. If you are unsure about how to fix the problem, please contact us for help.
                </p>
                <div class="font-weight-bold body-1 mt-4">{{ dataset.error_message || 'Unknown Error' }}</div>
              </v-alert>
              <div v-else-if="dataset.status === 'DONE'">
                <Alert v-if="dataset.series.length === 0" type="error" title="No Timeseries in Dataset File">
                  This file was successfully processed, but does not appear to have any timeseries data. Please check the file and re-upload if necessary.
                </Alert>
                <div
                  v-else
                  v-for="series in dataset.series"
                  :key="series.id"
                  class="px-0 mb-4"
                >
                  <DatasetTimeseriesChart :series="series" :timezone="station.timezone"></DatasetTimeseriesChart>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
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
          The timeseries data and original file will be deleted from the server. This cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </div>
</template>

<script>
import RefresherMixin from '@/mixins/refresher'

import ConfirmDialog from '@/components/ConfirmDialog'
import StatusChip from '@/components/StatusChip'
import DatasetTimeseriesChart from '@/components/charts/DatasetTimeseriesChart'

export default {
  name: 'ManageDataset',
  mixins: [RefresherMixin],
  components: {
    ConfirmDialog,
    DatasetTimeseriesChart,
    StatusChip
  },
  data () {
    return {
      loading: false,
      error: null,
      dataset: null,
      deleter: {
        loading: false,
        error: null
      }
    }
  },
  computed: {
    station () {
      return this.$parent.station
    }
  },
  mounted () {
    this.fetch()
  },
  watch: {
    '$route.params.datasetId' () {
      this.fetch()
    }
  },
  methods: {
    async fetch () {
      this.clearRefresh()
      this.dataset = null
      this.loading = true
      this.error = null

      try {
        const url = `/stations/${this.$route.params.stationId}/datasets/${this.$route.params.datasetId}`
        const response = await this.$http.public.get(url)
        this.dataset = response.data
        if (this.dataset.status === 'QUEUED' || this.dataset.status === 'PROCESSING') {
          this.queueRefresh()
        }
      } catch (err) {
        console.log(err)
        this.error = err.message || err.toString()
        this.$router.push({
          name: 'manageDatasets'
        })
      } finally {
        this.loading = false
        this.$vuetify.goTo(document.body.scrollHeight)
      }
    },
    async refresh () {
      this.clearRefresh()
      this.refresher.loading = true
      try {
        const url = `/stations/${this.$route.params.stationId}/datasets/${this.$route.params.datasetId}`
        const response = await this.$http.public.get(url)
        const prevStatus = this.dataset && this.dataset.status
        this.dataset = response.data
        if (this.dataset.status === 'QUEUED' || this.dataset.status === 'PROCESSING') {
          this.queueRefresh()
        } else {
          if (this.dataset.status !== prevStatus) {
            this.$emit('refresh')
          }
        }
      } catch (err) {
        console.log(err)
        this.error = 'Failed to get imageset'
      } finally {
        this.refresher.loading = false
      }
    },
    async confirmDeleteDataset () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteDataset()
      }
    },
    async deleteDataset () {
      this.deleter.loading = true
      this.deleter.error = null
      try {
        await this.$http.restricted.delete(`/stations/${this.dataset.station_id}/datasets/${this.dataset.id}`)
        this.deleter.loading = false
        this.$emit('refresh')
        this.$router.push({ name: 'manageDatasets' })
      } catch (e) {
        console.error(e)
        this.deleter.loading = false
        this.deleter.error = e.toString()
      }
    }
  }
}
</script>
