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
              To upload photos for this station:
            </p>
            <ol class="mb-4">
              <li>
                Specify the <strong>Photo Source and Methodology</strong>
              </li>
              <li>
                Upload batch of photos by clicking <strong>Upload Photos</strong> below
              </li>
            </ol>
            <p class="mb-0">
              A batch upload of multiple photos constitutes a <strong>Photo Set</strong>. Each photo set should contain a continuous sequence of photos collected at a fixed position (i.e. a single deployment). Multiple photo sets may be uploaded to extend the dataset as new photos are collected. Each photo set must be based on the same data source and methodology as defined for this station. Lastly, each photo set must cover a distinct period (no overlapping deployments).
            </p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card elevation="2" height="100%">
          <v-card-title class="text-h5 py-2">
            Photo Source and Methodology
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="black--text body-1">
            <div v-if="stationHasImagesetMetadata">
              <v-simple-table dense>
                <tbody>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:100px">
                      Source
                    </td>
                    <td class="font-weight-medium">{{ station.metadata.imageset.useAffiliation ? dbUser.affiliation_name : station.metadata.imageset.source | truncate(80) }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:100px">
                      Methodology
                    </td>
                    <td class="font-weight-medium">{{ station.metadata.imageset.methodology | truncate(190) }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:100px">
                      Citation
                    </td>
                    <td class="font-weight-medium">{{ station.metadata.imageset.citation | truncate(190) }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
              <v-btn outlined color="primary" @click="openMetadataForm" class="mt-4">
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
                <div class="font-weight-bold body-1">Photo Source and Methodology Required</div>
                <div>
                  Before you can upload photos, you must define the source and methodology used to obtain those photos.
                </div>
              </v-alert>
              <v-btn color="success" @click="openMetadataForm" block>
                <v-icon left>mdi-pencil</v-icon> Enter Photos Source and Methodology
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="stationHasImagesetMetadata">
      <v-col cols="12">
        <v-card elevation="2">
          <v-data-table
            ref="table"
            :headers="table.headers"
            :items="imagesets"
            :loading="loading"
            :sort-by="['updated_at']"
            :sort-desc="[true]"
            loading-text="Loading... Please wait"
            @click:row="select"
            single-select
            v-model="table.selected"
            class="row-cursor-pointer">
            <template v-slot:top>
              <v-toolbar flat>
                <div class="text-h5">Photo Sets</div>
                <v-btn
                  color="primary"
                  outlined
                  @click="refresh"
                  class="ml-4"
                  small
                  rounded
                >
                  <v-icon small :left="!$vuetify.breakpoint.mobile" v-if="!refresher.loading">mdi-refresh</v-icon>
                  <v-progress-circular
                    indeterminate
                    size="14"
                    width="2"
                    class="mr-2"
                    v-else
                  ></v-progress-circular>
                  <span v-if="!$vuetify.breakpoint.mobile">Refresh</span>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="success" :to="{ name: 'newImageset' }" :disabled="station.status === 'DISCONTINUED'">
                  <v-icon left>mdi-upload</v-icon> Upload Photos
                </v-btn>
              </v-toolbar>
              <div class="mx-4 d-flex">
                <div>Click on a row to select a photo set.</div>
                <v-spacer></v-spacer>
                <div v-if="station.status === 'DISCONTINUED'">
                  <v-icon left color="error" small>mdi-alert</v-icon>
                  Photo uploading disabled because station is discontinued
                </div>
              </div>
              <v-divider></v-divider>
            </template>
            <template v-slot:item.created_at="{ item }">
              {{ item.created_at | timestampFormat('lll') }}
            </template>
            <template v-slot:item.period="{ item }">
              <span v-if="item.status === 'DONE' && item.start_timestamp">
                {{ item.start_timestamp | timestampFormat('ll') }} &#8211;
                {{ item.end_timestamp | timestampFormat('ll') }}
              </span>
            </template>
            <template v-slot:item.n_images="{ item }">
              {{ item.n_images !== null ? (+item.n_images).toLocaleString() : '' }}
            </template>
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
    <ImagesetMetadataForm ref="imagesetMetadataForm"></ImagesetMetadataForm>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'

import RefresherMixin from '@/mixins/refresher'

import ImagesetMetadataForm from '@/components/forms/ImagesetMetadataForm'
import StatusChip from '@/components/StatusChip'

export default {
  name: 'ManageImagesets',
  mixins: [RefresherMixin],
  components: {
    ImagesetMetadataForm,
    StatusChip
  },
  data () {
    return {
      loading: true,
      error: null,
      imagesets: [],
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
            text: 'Period',
            value: 'period',
            align: 'center'
          },
          {
            text: '# Photos',
            value: 'n_images',
            align: 'center'
          },
          {
            text: 'Status',
            value: 'status',
            align: 'center'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['dbUser']),
    station () {
      return this.$parent.$parent.station
    },
    stationHasImagesetMetadata () {
      return this.station && this.station.metadata && this.station.metadata.imageset
    },
    hasPending () {
      if (!this.imagesets) return false
      return this.imagesets
        .map(d => d.status)
        .some(d => ['UPLOADING', 'QUEUED', 'PROCESSING'].includes(d))
    }
  },
  async mounted () {
    await this.fetch()
    if (this.$route.params.imagesetId) {
      const row = this.imagesets
        .find(d => d.id === parseInt(this.$route.params.imagesetId))
      this.table.selected = [row]
    }
  },
  watch: {
    '$route.params.imagesetId' (id) {
      if (!this.imagesets) return
      if (this.$route.params.imagesetId) {
        const row = this.imagesets
          .find(d => d.id === parseInt(this.$route.params.imagesetId))
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
        const response = await this.$http.public.get(`/stations/${this.$route.params.stationId}/imagesets`)
        this.imagesets = response.data
        if (this.hasPending) {
          this.queueRefresh()
        }
      } catch (err) {
        this.error = 'Failed to get imagesets'
        console.log(err)
      } finally {
        this.loading = false
      }
    },
    async refresh () {
      this.clearRefresh()
      this.refresher.loading = true
      try {
        const response = await this.$http.public.get(`/stations/${this.$route.params.stationId}/imagesets`)
        this.imagesets = response.data
        if (this.hasPending) {
          this.queueRefresh()
        }
      } catch (err) {
        this.error = 'Failed to get imagesets'
        console.log(err)
      } finally {
        this.refresher.loading = false
      }
    },
    select (imageset, row) {
      if (+this.$route.params.imagesetId === imageset.id) {
        row.select(false)
        this.$router.push({
          name: 'manageImagesets'
        })
        return
      }
      row.select(true)
      this.$router.push({
        name: 'manageImageset',
        params: {
          imagesetId: imageset.id
        }
      })
    },
    async openMetadataForm () {
      const result = await this.$refs.imagesetMetadataForm.open(this.station)

      if (result) {
        this.$parent.$parent.fetch()
      }
    }
  }
}
</script>
