<template>
  <v-container>
    <v-row align="stretch">
      <v-col cols="12" md="6">
        <v-card elevation="2" height="100%">
          <v-card-title class="text-h5 py-2">
            Instructions
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="black--text body-1">
            <p>
              To upload flow and/or stage data for this station:
            </p>
            <ol class="mb-4">
              <li>
                Specify the <strong>Data Source and Methodology</strong>
              </li>
              <li>
                Upload a data file by clicking <strong>Upload File</strong> below
              </li>
            </ol>
            <p>
              You can upload multiple files to extend the dataset as new data are collected. Each file should cover a distinct period (no overlaps). All files must contain data based on the same data source and methodology as defined for this station.
            </p>
            <p class="mb-0">
              Please only upload data during periods when photos were collected. Do not upload data when no photos were collected.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card elevation="2" height="100%">
          <v-card-title class="text-h5 py-2">
            Data Source and Methodology
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="black--text body-1">
            <div v-if="stationHasDatasetMetadata">
              <v-simple-table dense>
                <tbody>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:100px">
                      Source
                    </td>
                    <td class="font-weight-medium">{{ station.metadata.dataset.useAffiliation ? affiliation.affiliation_name : station.metadata.dataset.source | truncate(80) }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:100px">
                      Methodology
                    </td>
                    <td class="font-weight-medium">{{ station.metadata.dataset.methodology | truncate(190) }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:100px">
                      Citation
                    </td>
                    <td class="font-weight-medium">{{ station.metadata.dataset.citation || 'None' | truncate(190) }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:100px">
                      Flags
                    </td>
                    <td class="font-weight-medium">{{ station.metadata.dataset.flags || 'None' | truncate(90) }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
              <v-btn color="primary" outlined @click="openMetadataForm" class="mt-4">
                <v-icon left>mdi-pencil</v-icon> Edit
              </v-btn>
            </div>
            <div v-else>
              <v-alert
                type="warning"
                text
                colored-border
                border="left"
                class="body-2"
              >
                <div class="font-weight-bold body-1">Data Source and Methodology Required</div>
                <div>
                  Before you can upload data files, you must define the source and methodology used to obtain those data.
                </div>
              </v-alert>
              <v-btn color="success" @click="openMetadataForm" block>
                <v-icon left>mdi-pencil</v-icon> Enter Data Source and Methodology
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="stationHasDatasetMetadata">
      <v-col cols="12">
        <v-card elevation="2">
          <v-data-table
            ref="table"
            :headers="table.headers"
            :items="datasets"
            :loading="loading"
            :sort-by="['updated_at']"
            :sort-desc="[true]"
            loading-text="Loading... Please wait"
            no-data-text="No files have been uploaded"
            @click:row="select"
            single-select
            v-model="table.selected"
            class="row-cursor-pointer">
            <template v-slot:top>
              <v-toolbar flat v-if="$vuetify.breakpoint.mobile">
                <div class="text-h5">Uploaded Files</div>
                <v-btn
                  color="primary"
                  outlined
                  @click="refresh"
                  class="ml-4"
                  small
                  rounded
                >
                  <v-icon small v-if="!refresher.loading">mdi-refresh</v-icon>
                  <v-progress-circular
                    indeterminate
                    size="14"
                    width="2"
                    v-else
                  ></v-progress-circular>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="success" :to="{ name: 'newDataset' }">
                  <v-icon left>mdi-upload</v-icon> Upload File
                </v-btn>
              </v-toolbar>
              <v-toolbar flat v-else>
                <div class="text-h5">Uploaded Files</div>
                <v-btn
                  color="primary"
                  outlined
                  @click="refresh"
                  class="ml-4"
                  small
                  rounded
                >
                  <v-icon small left v-if="!refresher.loading">mdi-refresh</v-icon>
                  <v-progress-circular
                    indeterminate
                    size="14"
                    width="2"
                    class="mr-2"
                    v-else
                  ></v-progress-circular>
                  Refresh
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="success" :to="{ name: 'newDataset' }">
                  <v-icon left>mdi-upload</v-icon> Upload File
                </v-btn>
              </v-toolbar>
              <div class="text--secondary mx-4">
                Click on a row to select a file.
              </div>
              <v-divider></v-divider>
            </template>
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item.created_at="{ item }">
              {{ item.created_at | timestampFormat('lll') }}
            </template>
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item.period="{ item }">
              <span v-if="item.start_timestamp">
                {{ item.start_timestamp | timestampLocalFormat(station.timezone, 'll') }} &#8211;
                {{ item.end_timestamp | timestampLocalFormat(station.timezone, 'll') }}
              </span>
            </template>
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item.filename="{ item }">
              {{ item.filename | truncate(32) }}
            </template>
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item.n_rows="{ item }">
              {{ item.n_rows ? item.n_rows.toLocaleString() : '' }}
            </template>
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item.actions="{ item }">
              <v-icon
                small
                @click="deleteDataset(item)">
                mdi-delete
              </v-icon>
            </template>
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item.status="{ item }">
              <StatusChip :status="item.status"></StatusChip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12">
        <router-view @refresh="refresh"></router-view>
      </v-col>
    </v-row>
    <DatasetMetadataForm ref="datasetMetadataForm"></DatasetMetadataForm>
  </v-container>
</template>

<script>
import RefresherMixin from '@/mixins/refresher'

import DatasetMetadataForm from '@/components/forms/DatasetMetadataForm'
import StatusChip from '@/components/StatusChip'
import { mapGetters } from 'vuex'

export default {
  name: 'ManageDatasets',
  mixins: [RefresherMixin],
  components: {
    DatasetMetadataForm,
    StatusChip
  },
  data () {
    return {
      loading: true,
      error: null,
      datasets: [],
      table: {
        selected: [null],
        headers: [
          {
            text: 'Id',
            value: 'id',
            align: 'center'
          },
          {
            text: 'Uploaded',
            value: 'created_at',
            align: 'center'
          },
          {
            text: 'Filename',
            value: 'filename',
            align: 'center'
          },
          {
            text: 'Period',
            value: 'period',
            align: 'center'
          },
          {
            text: '# Rows',
            value: 'n_rows',
            align: 'center'
          },
          {
            text: 'Status',
            value: 'status',
            align: 'center'
          }
          // {
          //   text: 'Actions',
          //   value: 'actions'
          // }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['affiliation']),
    station () {
      return this.$parent.$parent.station
    },
    stationHasDatasetMetadata () {
      return this.station && this.station.metadata && this.station.metadata.dataset
    },
    hasPending () {
      if (!this.datasets) return false
      return this.datasets
        .map(d => d.status)
        .some(d => ['UPLOADING', 'QUEUED', 'PROCESSING'].includes(d))
    }
  },
  async mounted () {
    await this.fetch()
    if (this.$route.params.datasetId) {
      const row = this.datasets
        .find(d => d.id === parseInt(this.$route.params.datasetId))
      this.table.selected = [row]
    }
  },
  watch: {
    '$route.params.datasetId' (id) {
      if (!this.datasets) return
      if (this.$route.params.datasetId) {
        const row = this.datasets
          .find(d => d.id === parseInt(this.$route.params.datasetId))
        this.table.selected = [row]
      } else {
        this.table.selected = [null]
      }
    }
  },
  methods: {
    async fetch () {
      this.clearRefresh()
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.public.get(`/stations/${this.$route.params.stationId}/datasets`)
        this.datasets = response.data
        if (this.hasPending) {
          this.queueRefresh()
        }
      } catch (err) {
        this.error = 'Failed to get datasets'
        console.log(err)
      } finally {
        this.loading = false
      }
    },
    async refresh () {
      this.clearRefresh()
      this.refresher.loading = true
      try {
        const response = await this.$http.public.get(`/stations/${this.$route.params.stationId}/datasets`)
        this.datasets = response.data
        if (this.hasPending) {
          this.queueRefresh()
        }
      } catch (err) {
        this.error = 'Failed to get datasets'
        console.log(err)
      } finally {
        this.refresher.loading = false
      }
    },
    select (dataset, row) {
      if (+this.$route.params.datasetId === dataset.id) {
        row.select(false)
        this.$router.push({
          name: 'manageDatasets'
        })
        return
      }
      row.select(true)
      this.$router.push({
        name: 'manageDataset',
        params: {
          datasetId: dataset.id
        }
      })
    },
    async openMetadataForm () {
      const result = await this.$refs.datasetMetadataForm.open(this.station)

      if (result) {
        this.$parent.$parent.fetch()
      }
    }
  }
}
</script>
