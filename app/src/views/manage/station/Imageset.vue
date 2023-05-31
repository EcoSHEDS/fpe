<template>
  <div>
    <v-container class="px-0 pt-0">
      <v-card>
        <v-card-title class="text-h5">
          Selected Photo Set
          <v-btn
            color="primary"
            outlined
            @click="refresh"
            small
            rounded
            class="ml-4"
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
          <v-row v-else-if="error">
            <v-col cols="12">
              <v-alert
                type="error"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
              >
                <div class="font-weight-bold body-1">Photo Set Not Found</div>
                <div>{{ error }}</div>
              </v-alert>
            </v-col>
          </v-row>
          <v-row v-else-if="imageset">
            <v-col cols="12" md="5">
              <v-simple-table dense>
                <tbody>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      ID
                    </td>
                    <td class="font-weight-bold">{{ imageset.id }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      Uploaded
                    </td>
                    <td class="font-weight-bold">{{imageset.created_at | timestampFormat('lll') }} ({{ imageset.created_at | timestampFromNow }})</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      # Photos
                    </td>
                    <td class="font-weight-bold">
                      {{ imageset.n_images ? (+imageset.n_images).toLocaleString() : '' }}
                    </td>
                  </tr>
                  <tr v-if="imageset.status === 'DONE'">
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      Start
                    </td>
                    <td class="font-weight-bold">
                      <span v-if="imageset.status === 'DONE' && imageset.start_timestamp">{{ imageset.start_timestamp | timestampLocalFormat(station.timezone, 'lll z') }}</span>
                    </td>
                  </tr>
                  <tr v-if="imageset.status === 'DONE'">
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      End
                    </td>
                    <td class="font-weight-bold">
                      <span v-if="imageset.status === 'DONE' && imageset.end_timestamp">{{ imageset.end_timestamp | timestampLocalFormat(station.timezone, 'lll z') }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      Description
                    </td>
                    <td class="font-weight-bold">{{ imageset.metadata && imageset.metadata.description ? imageset.metadata.description : 'None' | truncate(100) }}</td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      Upload Status
                    </td>
                    <td class="font-weight-bold"><StatusChip :status="imageset.status"></StatusChip></td>
                  </tr>
                  <tr>
                    <td
                      class="text-right text--secondary"
                      style="width:130px">
                      PII Status
                    </td>
                    <td class="font-weight-bold"><StatusChip :status="imageset.pii_status"></StatusChip></td>
                  </tr>
                </tbody>
              </v-simple-table>
              <div>
                <!-- <v-btn
                  v-if="user && user.isAdmin"
                  color="warning"
                  class="mt-4"
                  outlined
                  block
                  :loading="loadingProcessing"
                  @click="processImageset"
                >
                  <v-icon left>mdi-refresh</v-icon> Re-Process Photo Set (Admin Only)
                </v-btn> -->
                <v-btn
                  color="error"
                  class="mt-4"
                  outlined
                  block
                  :loading="deleter.loading"
                  @click="confirmDeleteImageset"
                >
                  <v-icon left>mdi-delete</v-icon> Delete Photo Set
                </v-btn>
              </div>

              <v-alert
                type="error"
                text
                colored-border
                border="left"
                class="body-2 mt-4"
                v-if="!deleter.loading && deleter.error"
              >
                <div class="font-weight-bold body-1">Failed to Delete Photo Set</div>
                <div>{{ deleter.error }}</div>
              </v-alert>

              <v-alert
                type="error"
                text
                colored-border
                border="left"
                class="body-2 mt-4"
                v-if="!imageDeleter.loading && imageDeleter.error"
              >
                <div class="font-weight-bold body-1">Failed to Delete Photo</div>
                <div>{{ imageDeleter.error }}</div>
              </v-alert>
            </v-col>
            <v-col cols="12" md="7" v-if="imageset">
              <v-alert
                type="warning"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-if="imageset.status === 'UPLOADING'"
              >
                <div class="font-weight-bold body-1">Photos are being uploaded</div>
                <p>
                  This may indicate that the upload was started, but did not finish. If you started this upload but closed the webpage before it was completed or if these photos appear to be stuck in "uploading" state, then it likely means the upload has stalled or failed. In that case, please delete this photo set and try uploading the photos again.
                </p>
                <p class="mb-0">
                  If the number of photos continues to increase over time, then the uploading process is likely proceeding normally and you should check back later to see if it completes.
                </p>
              </v-alert>
              <v-alert
                type="info"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-else-if="imageset.status === 'QUEUED'"
              >
                <div class="font-weight-bold body-1">Photos are queued for processing</div>
                <div>
                  After new photos have been uploaded, it generally takes about a minute for the server to begin processing them.
                </div>
              </v-alert>
              <v-alert
                type="warning"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-else-if="imageset.status === 'PROCESSING'"
              >
                <div class="font-weight-bold">Photos are being processed</div>
                <div class="body-2">
                  Processing time depends on the number of photos in the set, but usually between a couple minutes and half an hour.
                </div>
              </v-alert>
              <v-alert
                type="error"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
                elevation="2"
                v-else-if="imageset.status === 'FAILED'"
              >
                <div class="font-weight-bold body-1">Failed to Process One or More Photos</div>
                <p>
                  The server failed to process one or more of these photos, see error message below. After addressing the issue, please delete this failed photo set instance and try uploading the photos again as a new photo set. If you are unsure about how to fix the problem, please contact us for help.
                </p>
                <div class="font-weight-bold body-1 mt-4">{{ imageset.error_message }}</div>
              </v-alert>
              <div v-else-if="imageset.status === 'DONE'" class="pb-4">
                <v-data-iterator
                  :items="filteredImages"
                  :items-per-page.sync="iterator.itemsPerPage"
                  :page.sync="iterator.page"
                  :sort-by="iterator.sortBy"
                  :sort-desc="iterator.sortDesc"
                  hide-default-footer
                >
                  <template v-slot:header>
                    <v-container>
                      <v-row
                        class="mb-2 align-items-center"
                        elevation="0"
                      >
                        <v-col cols="12" lg="4">
                          <v-menu
                            ref="startMenu"
                            v-model="iterator.startMenu"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto"
                            @input="initializeStartDate"
                          >
                            <template v-slot:activator="{ on, attrs }">
                              <v-text-field
                                v-model="iterator.startDate"
                                class=""
                                label="Select start date"
                                prepend-icon="mdi-calendar"
                                readonly
                                v-bind="attrs"
                                v-on="on"
                                clearable
                                light
                                hide-details
                                @click:clear="iterator.startDate = null"
                              ></v-text-field>
                            </template>
                            <v-date-picker
                              v-model="iterator.startDate"
                              @input="iterator.startMenu = false"
                              no-title
                              scrollable
                              :show-current="false"
                            >
                            </v-date-picker>
                          </v-menu>
                        </v-col>
                        <v-col cols="12" lg="4">
                          <v-menu
                            ref="endMenu"
                            v-model="iterator.endMenu"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto"
                            @input="initializeEndDate"
                          >
                            <template v-slot:activator="{ on, attrs }">
                              <v-text-field
                                v-model="iterator.endDate"
                                class=""
                                label="Select end date"
                                prepend-icon="mdi-calendar"
                                readonly
                                v-bind="attrs"
                                v-on="on"
                                clearable
                                light
                                hide-details
                                @click:clear="iterator.endDate = null"
                              ></v-text-field>
                            </template>
                            <v-date-picker
                              v-model="iterator.endDate"
                              @input="iterator.endMenu = false"
                              no-title
                              scrollable
                              :show-current="false"
                            >
                            </v-date-picker>
                          </v-menu>
                        </v-col>
                        <v-col cols="12" lg="4" class="align-self-end">
                          <span class="body-1 mr-2">Sort:</span>
                          <v-btn-toggle
                            v-model="iterator.sortDesc"
                            mandatory>
                            <v-btn
                              small
                              depressed
                              :value="false"
                            >
                              <v-icon>mdi-arrow-up</v-icon>
                            </v-btn>
                            <v-btn
                              small
                              depressed
                              :value="true">
                              <v-icon>mdi-arrow-down</v-icon>
                            </v-btn>
                          </v-btn-toggle>
                        </v-col>
                        <v-col cols="12" lg="4" class="py-0">
                          <v-checkbox label="Person Detected (p > 0.2)" hide-details class="mt-0" v-model="piiFilters.person"></v-checkbox>
                        </v-col>
                        <v-col cols="12" lg="4" class="py-0">
                          <v-checkbox label="Vehicle Detected (p > 0.8)" hide-details class="mt-0" v-model="piiFilters.vehicle"></v-checkbox>
                        </v-col>
                        <v-col cols="12" lg="4" class="py-0">
                          <v-checkbox label="Animal Detected (p > 0.8)" hide-details class="mt-0" v-model="piiFilters.animal"></v-checkbox>
                        </v-col>
                        <v-col cols="12" lg="4" class="py-0">
                          <v-checkbox label="Manual PII Flag" hide-details class="mt-0" v-model="piiFilters.on"></v-checkbox>
                        </v-col>
                        <v-col cols="12" lg="4" class="py-0">
                          <v-checkbox label="PII Detection Ignored" hide-details class="mt-0" v-model="piiFilters.off"></v-checkbox>
                        </v-col>
                      </v-row>
                    </v-container>
                    <v-divider class="mb-4 pt-0"></v-divider>
                  </template>

                  <template v-slot:default="props">
                    <v-row class="px-4">
                      <v-col
                        v-for="item in props.items"
                        :key="item.id"
                        cols="12"
                        sm="12"
                        md="6"
                        lg="4"
                      >
                        <v-card class="pa-2" elevation="1">
                          <ImagePreview
                            :image="item"
                            :timezone="station.timezone"
                            @click="showImage(item)"
                            @delete="confirmDeleteImage"
                            @flag="toggleImageFlag"
                          ></ImagePreview>
                        </v-card>
                      </v-col>
                    </v-row>
                  </template>

                  <template v-slot:footer>
                    <v-divider class="my-4"></v-divider>
                    <v-row
                      class="mt-4 px-8"
                      align="center"
                      justify="center"
                    >
                      <span class="grey--text">Photos per page</span>
                      <v-menu offset-y>
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn
                            dark
                            text
                            color="grey darken-2"
                            class="ml-2"
                            v-bind="attrs"
                            v-on="on"
                          >
                            {{ iterator.itemsPerPage }}
                            <v-icon>mdi-chevron-down</v-icon>
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item
                            v-for="(number, index) in iterator.itemsPerPageArray"
                            :key="index"
                            @click="updateItemsPerPage(number)"
                          >
                            <v-list-item-title>{{ number }}</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>

                      <v-spacer></v-spacer>

                      <span class="mr-4 grey--text">
                        Page {{ iterator.page }} of {{ numberOfPages }}
                      </span>
                      <v-btn
                        outlined
                        color="grey darken-3"
                        class="mr-1"
                        :disabled="iterator.page === 1"
                        @click="formerPage"
                      >
                        <v-icon>mdi-chevron-left</v-icon>
                      </v-btn>
                      <v-btn
                        outlined
                        color="grey darken-3"
                        class="ml-1"
                        :disabled="iterator.page >= numberOfPages"
                        @click="nextPage"
                      >
                        <v-icon>mdi-chevron-right</v-icon>
                      </v-btn>
                    </v-row>
                  </template>
                </v-data-iterator>
                <v-overlay absolute class="text-center py-8" color="black" v-if="imageDeleter.loading || imageFlagger.loading">
                  <v-progress-circular
                    color="white"
                    indeterminate
                    size="32"
                    width="4"
                  ></v-progress-circular>
                </v-overlay>
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
          All photos within this set will be deleted from the server. This cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>

    <ConfirmDialog ref="confirmDeleteImage">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Are you sure?</div>
        <div>
          This image will be deleted from the server. This cannot be undone.
        </div>
        <div>
          <v-checkbox dense hide-details label="Do not show this warning again" v-model="hideConfirmDeleteImage">
          </v-checkbox>
        </div>
      </v-alert>
    </ConfirmDialog>
    <ImageDialog ref="imageDialog"></ImageDialog>
  </div>
</template>

<script>
import RefresherMixin from '@/mixins/refresher'

import ConfirmDialog from '@/components/ConfirmDialog'
import ImageDialog from '@/components/ImageDialog'
import ImagePreview from '@/components/ImagePreview'
import StatusChip from '@/components/StatusChip'
import evt from '@/events'
import { mapGetters } from 'vuex'

export default {
  name: 'ManageImageset',
  mixins: [RefresherMixin],
  components: {
    ConfirmDialog,
    ImageDialog,
    StatusChip,
    ImagePreview
  },
  data () {
    return {
      loading: false,
      error: null,
      imageset: null,
      deleter: {
        loading: false,
        error: null
      },
      loadingProcessing: false,
      imageDeleter: {
        loading: false,
        error: null
      },
      imageFlagger: {
        loading: false,
        error: null
      },
      iterator: {
        itemsPerPage: 9,
        itemsPerPageArray: [6, 9, 12, 24, 48],
        sortDesc: false,
        page: 1,
        sortBy: 'timestamp',
        startMenu: false,
        endMenu: false,
        startDate: null,
        endDate: null
      },
      hideConfirmDeleteImage: false,
      piiFilters: {
        person: false,
        vehicle: false,
        animal: false,
        on: false,
        off: false
      }
    }
  },
  computed: {
    ...mapGetters(['user']),
    station () {
      return this.$parent.station
    },
    numberOfPages () {
      if (!this.imageset) return 0
      return Math.ceil(this.filteredImages.length / this.iterator.itemsPerPage)
    },
    filteredImages () {
      console.log('filteredImages')
      if (!this.imageset) return []

      const start = this.iterator.startDate
        ? this.$date(this.iterator.startDate).tz(this.station.timezone)
        : null
      const end = this.iterator.endDate
        ? this.$date(this.iterator.endDate).tz(this.station.timezone)
        : null
      const images = this.imageset.images
        .filter(d => {
          if (start === null) return true
          return this.$date(d.timestamp).tz(this.station.timezone).startOf('day').isSameOrAfter(start)
        })
        .filter(d => {
          if (end === null) return true
          return this.$date(d.timestamp).tz(this.station.timezone).startOf('day').isSameOrBefore(end)
        })
        .filter(d => {
          return (!this.piiFilters.person || d.pii_person >= 0.2) &&
            (!this.piiFilters.vehicle || d.pii_vehicle >= 0.8) &&
            (!this.piiFilters.animal || d.pii_animal >= 0.8) &&
            (!this.piiFilters.on || d.pii_on) &&
            (!this.piiFilters.off || d.pii_off)
        })
      return images
    }
  },
  mounted () {
    this.fetch()
  },
  watch: {
    '$route.params.imagesetId' () {
      this.fetch()
    }
  },
  methods: {
    async fetch () {
      this.clearRefresh()
      this.imageset = null
      this.loading = true
      this.error = null
      try {
        const url = `/stations/${this.$route.params.stationId}/imagesets/${this.$route.params.imagesetId}`
        const response = await this.$http.restricted.get(url)
        this.imageset = response.data
        if (this.imageset.status === 'QUEUED' || this.imageset.status === 'PROCESSING') {
          this.queueRefresh()
        }
      } catch (err) {
        this.error = err.message || err.toString()
        console.error(err)
        this.$router.push({
          name: 'manageImagesets'
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
        const url = `/stations/${this.$route.params.stationId}/imagesets/${this.$route.params.imagesetId}`
        const response = await this.$http.restricted.get(url)
        const prevStatus = this.imageset && this.imageset.status
        this.imageset = response.data
        if (this.imageset.status === 'QUEUED' || this.imageset.status === 'PROCESSING') {
          this.queueRefresh()
        } else {
          if (this.imageset.status !== prevStatus) {
            this.$emit('refresh')
          }
        }
      } catch (err) {
        this.error = err.message || err.toString()
        console.error(err)
      } finally {
        this.refresher.loading = false
      }
    },
    async confirmDeleteImageset () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteImageset()
      }
    },
    async deleteImageset () {
      this.deleter.loading = true
      this.deleter.error = null
      try {
        await this.$http.restricted.delete(`/stations/${this.imageset.station_id}/imagesets/${this.imageset.id}`)
        this.deleter.loading = false
        this.$emit('refresh')
        this.$router.push({ name: 'manageImagesets' })
      } catch (err) {
        console.error(err)
        this.deleter.loading = false
        this.deleter.error = err.toString()
      }
    },
    nextPage () {
      if (this.iterator.page + 1 <= this.numberOfPages) {
        this.iterator.page += 1
      }
    },
    formerPage () {
      if (this.iterator.page - 1 >= 1) {
        this.iterator.page -= 1
      }
    },
    updateItemsPerPage (number) {
      this.iterator.itemsPerPage = number
    },
    async showImage (image) {
      await this.$refs.imageDialog.open(image, this.station)
    },
    async confirmDeleteImage (image) {
      const previousHideConfirmDeleteImage = this.hideConfirmDeleteImage
      let ok = true
      if (!this.hideConfirmDeleteImage) {
        ok = await this.$refs.confirmDeleteImage.open(
          'Delete Image',
          { btnColor: 'error' }
        )
        if (!ok) {
          this.hideConfirmDeleteImage = previousHideConfirmDeleteImage
        }
      }
      if (ok) {
        return await this.deleteImage(image)
      }
    },
    async deleteImage (image) {
      if (!image) return
      this.imageDeleter.loading = true
      try {
        await this.$http.restricted.delete(`/stations/${this.imageset.station_id}/imagesets/${this.imageset.id}/images/${image.id}`)
        evt.$emit('notify', 'success', `Photo (${image.id}) has been deleted`)
        this.refresh()
      } catch (err) {
        console.error(err)
        this.imageDeleter.error = err.message || err.toString()
      } finally {
        this.imageDeleter.loading = false
      }
    },
    async toggleImageFlag (image) {
      if (!image) return
      this.imageFlagger.loading = true
      try {
        const payload = {}
        if (image.pii_on) {
          // remove on flag
          payload.pii_on = false
        } else if (image.pii_off) {
          // remove off flag
          payload.pii_off = false
        } else if (image.pii_person >= 0.2 || image.pii_vehicle >= 0.8) {
          // ignore detector
          payload.pii_off = true
        } else {
          // add on flag
          payload.pii_on = true
        }
        await this.$http.restricted.put(`/stations/${this.imageset.station_id}/imagesets/${this.imageset.id}/images/${image.id}`, payload)
        evt.$emit('notify', 'success', `PII flag has been updated for photo (id=${image.id})`)
        this.refresh()
      } catch (err) {
        evt.$emit('notify', 'error', `Failed to update PII flag for photo (id=${image.id})`)
      } finally {
        this.imageFlagger.loading = false
      }
    },
    initializeStartDate () {
      if (this.iterator.startDate === null) {
        if (!this.imageset.start_timestamp) return

        this.iterator.startDate = this.$date(this.imageset.start_timestamp)
          .tz(this.station.timezone)
          .format('YYYY-MM-DD')
      }
    },
    initializeEndDate () {
      if (this.iterator.endDate === null) {
        if (!this.imageset.end_timestamp) return

        this.iterator.endDate = this.$date(this.imageset.end_timestamp)
          .tz(this.station.timezone)
          .format('YYYY-MM-DD')
      }
    },
    async processImageset () {
      if (!this.imageset) return

      try {
        this.loadingProcessing = true
        await this.$http.restricted.post(
          `/stations/${this.imageset.station_id}/imagesets/${this.imageset.id}/process`,
          null
        )
        await this.refresh()
      } catch (err) {
        console.error(err)
      } finally {
        this.loadingProcessing = false
      }
    }
  }
}
</script>
