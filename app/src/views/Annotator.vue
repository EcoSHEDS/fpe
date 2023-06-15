<template>
  <v-container fluid>
    <v-row justify="space-around">
      <v-col cols="12" lg="10" xl="10">
        <v-card elevation="4">

          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Flow Photo Annotator
            </v-toolbar-title>
          </v-toolbar>

          <!-- SELECT STATION / INSTRUCTIONS -->
          <v-card-text class="body-1 black--text mb-0">
            <v-row class="justify-space-around">
              <!-- SELECT STATION -->
              <v-col cols="6">
                <v-row class="justify-space-around">
                  <v-col cols="12">
                    <v-card>
                      <v-card-title>
                        Stations
                        <v-spacer></v-spacer>
                        <v-text-field
                          v-model="search"
                          append-icon="mdi-magnify"
                          label="Search"
                          single-line
                          hide-details
                          dense
                          clearable
                        ></v-text-field>
                      </v-card-title>
                      <v-data-table
                        v-model="stationArray"
                        :loading="loading.stations"
                        :headers="headers"
                        :items="stations"
                        :search="search"
                        :items-per-page="5"
                        :sort-by="['n_annotations']"
                        :sort-desc="[true]"
                        single-select
                        dense
                        @click:row="selectStation"
                      ></v-data-table>
                    </v-card>
                    <v-text-field
                      v-model.number="nPairs"
                      label="Number of photo pairs"
                      outlined
                      hide-details
                      class="mb-4 mt-8"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <div class="text-center">
                  <v-btn large color="primary" @click="start" :loading="loading.station">Start Annotating<v-icon right>mdi-chevron-right</v-icon></v-btn>
                </div>

                <Alert type="error" class="mt-8 mb-0" v-if="error.start">{{ error.start }}</Alert>
              </v-col>

              <v-divider vertical></v-divider>

              <!-- INSTRUCTIONS -->
              <v-col cols="6">
                <v-sheet max-height="400" elevation="2" class="pa-4" style="overflow-y:scroll;">
                  <div class="text-h6">Instructions</div>
                  <v-divider class="mb-2"></v-divider>
                  <ol>
                    <li>Select a station, enter the number of photo pairs you would like to annotate, and click <code>Start Annotating</code>.</li>
                    <li>For each photo pair:
                      <ol>
                        <li>
                          Click the appropriate button below each photo to indicate the following:
                          <ul>
                            <li>
                              <code>Dry</code>: stream is completely dry (no water visible)
                            </li>
                            <li>
                              <code>Disconnected</code>: stream is partially dry with disconnected pools of water
                            </li>
                            <li>
                              <code>Partial Ice/Snow</code>: stream is partially covered by ice/snow (can see some water)
                            </li>
                            <li>
                              <code>Full Ice/Snow</code>: stream is fully covered by ice/snow (cannot see any water)
                            </li>
                            <li>
                              <code>Bad Photo</code>: cannot see water because the photo is not clear (e.g., blurry, too dark, glare)
                            </li>
                          </ul>
                        </li>
                        <li>
                          Indicate which of the two photos has more water (<code>Left</code> or <code>Right</code>). Choose <code>About the Same</code> if the photos show similar amounts of water. Choose <code>Don't Know</code> if you cannot make a valid comparison (e.g., one or both is a bad photo or the camera angle is too different). Keyboard shortcuts: <code>j</code> = Left, <code>k</code> = About the Same, <code>l</code> = Right, <code>m</code> = Don't Know.
                        </li>
                        <li>
                          If you were unsure about which option(s) to select or had any other questions about this pair of photos, let us know in the <code>Comments</code> field.
                        </li>
                        <li>
                          When finished with this pair, click <code>Next</code> (or press your Enter key) to load the next pair and repeat these steps.
                        </li>
                      </ol>
                    </li>
                    <li>
                      When you are finished, click the <code>Submit</code> button to save your annotations to the server.
                    </li>
                    <li>
                      If you need to stop early, go ahead and submit the annotations you have already completed.
                    </li>
                    <li>
                      Once you have completed a batch of annotations, you can do another batch by repeating step 1 above.
                    </li>
                  </ol>
                </v-sheet>
                <div class="text-right text-caption mb-0">Scroll down to see all instructions</div>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- STATION ANNOTATION -->
          <v-card-text class="body-1 black--text" v-if="error.station">
            <v-divider class="my-4"></v-divider>
            <Alert type="error" title="Failed to Get Photos for Selected Station" class="mx-auto" style="max-width:600px">
              {{ error.station }}
            </Alert>
          </v-card-text>
          <v-card-text class="body-1 black--text" v-if="pairs.length > 0">
            <v-divider class="mb-4"></v-divider>

            <v-row v-if="currentPair">
              <v-col cols="6">
                <v-sheet elevation="2" class="pa-4">
                  <div class="fpe-image-url text-center"><a :href="currentPair.left.image.thumb_url">{{ currentPair.left.image.filename }}</a></div>
                  <div class="text-center">{{ currentPair.left.image.timestamp | timestampLocalFormat(station ? station.timezone : 'US/Eastern', 'lll z') }}</div>
                  <v-img
                    lazy-src="img/placeholder.png"
                    max-height="400"
                    :src="currentPair.left.image.thumb_url"
                    :alt="currentPair.left.image.filename"
                    :transition="false"
                    contain
                  >
                  </v-img>
                  <div class="d-flex justify-space-around mt-4 mx-auto" style="max-width:500px">
                    <v-btn-toggle v-model="currentPair.left.attributes" multiple color="error" @change="onClickPhotoAttributes('left')" class="d-block">
                      <v-btn value="DRY" class="px-4 fpe-annotation-class-button-left" large style="width:50%;">
                        <img src="img/annotation/dry.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption fpe-annotation-class-button-label">Dry</span>
                      </v-btn>
                      <v-btn value="DISCONNECTED" class="px-4 fpe-annotation-class-button-left" large style="width:50%">
                        <img src="img/annotation/disconnected.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Disconnected</span>
                      </v-btn>
                      <v-btn value="ICE_PARTIAL" class="px-4 fpe-annotation-class-button-left" large style="width:50%">
                        <img src="img/annotation/ice-partial.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Partial Ice/Snow</span>
                      </v-btn>
                      <v-btn value="ICE" class="px-4 fpe-annotation-class-button-left" large style="width:50%">
                        <img src="img/annotation/ice-full.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Full Ice/Snow</span>
                      </v-btn>
                      <v-btn value="BAD" class="px-4 fpe-annotation-class-button-center" large style="width:100%">
                        <img src="img/annotation/bad-photo.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Bad Photo</span>
                      </v-btn>
                    </v-btn-toggle>
                  </div>
                </v-sheet>
              </v-col>
              <v-col cols="6">
                <v-sheet elevation="2" class="pa-4">
                  <div class="fpe-image-url text-center"><a :href="currentPair.right.image.thumb_url">{{ currentPair.right.image.filename }}</a></div>
                  <div class="text-center">{{ currentPair.right.image.timestamp | timestampLocalFormat(station ? station.timezone : 'US/Eastern', 'lll z') }}</div>
                  <v-img
                    lazy-src="img/placeholder.png"
                    max-height="400"
                    :src="currentPair.right.image.thumb_url"
                    :alt="currentPair.right.image.filename"
                    :transition="false"
                    contain
                  >
                  </v-img>
                  <div class="d-flex justify-space-around mt-4 mx-auto" style="max-width:500px">
                    <v-btn-toggle v-model="currentPair.right.attributes" multiple color="error" @change="onClickPhotoAttributes('right')" class="d-block">
                      <v-btn value="DRY" class="px-4 fpe-annotation-class-button-left" large style="width:50%;">
                        <img src="img/annotation/dry.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption fpe-annotation-class-button-label">Dry</span>
                      </v-btn>
                      <v-btn value="DISCONNECTED" class="px-4 fpe-annotation-class-button-left" large style="width:50%">
                        <img src="img/annotation/disconnected.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Disconnected</span>
                      </v-btn>
                      <v-btn value="ICE_PARTIAL" class="px-4 fpe-annotation-class-button-left" large style="width:50%">
                        <img src="img/annotation/ice-partial.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Partial Ice/Snow</span>
                      </v-btn>
                      <v-btn value="ICE" class="px-4 fpe-annotation-class-button-left" large style="width:50%">
                        <img src="img/annotation/ice-full.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Full Ice/Snow</span>
                      </v-btn>
                      <v-btn value="BAD" class="px-4 fpe-annotation-class-button-center" large style="width:100%">
                        <img src="img/annotation/bad-photo.PNG" style="height:32px;margin-right:12px">
                        <span class="text-caption">Bad Photo</span>
                      </v-btn>
                    </v-btn-toggle>
                  </div>
                </v-sheet>
              </v-col>
            </v-row>

            <div class="text-h6 text-center mb-8 mt-8">Which photo has more water?</div>
            <v-item-group v-model="currentPair.rank" color="primary" class="mt-4 d-flex justify-space-around">
              <v-row>
                <v-col cols="4" class="text-right">
                  <v-item v-slot="{ active, toggle }" value="LEFT">
                    <v-btn :color="active ? 'primary' : 'default'" :depressed="active" @click="toggle" large>Left (j)</v-btn>
                  </v-item>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div>
                    <v-item v-slot="{ active, toggle }" value="SAME">
                      <v-btn :color="active ? 'primary' : 'default'" :depressed="active" @click="toggle" large>About the Same (k)</v-btn>
                    </v-item>
                  </div>
                  <div>
                    <v-item v-slot="{ active, toggle }" value="UNKNOWN" class="mt-4">
                      <v-btn :color="active ? 'primary' : 'default'" :depressed="active" @click="toggle" large>Don't Know (m)</v-btn>
                    </v-item>
                  </div>
                </v-col>
                <v-col cols="4" class="text-left">
                  <v-item v-slot="{ active, toggle }" value="RIGHT">
                    <v-btn :color="active ? 'primary' : 'default'" :depressed="active" @click="toggle" large>Right (l)</v-btn>
                  </v-item>
                </v-col>
              </v-row>
            </v-item-group>

            <v-row justify="center" class="mt-4">
              <v-col cols="6">
                <v-text-field outlined v-model="currentPair.comment" hide-details label="Any comments?"></v-text-field>
              </v-col>
            </v-row>

            <v-row v-if="error.annotation" justify="center">
              <v-col cols="6">
                <Alert type="error">
                  {{ error.annotation }}
                </Alert>
              </v-col>
            </v-row>

            <div class="d-flex align-center mt-6">
              <v-row>
                <v-col cols="4" class="text-right">
                  <v-btn @click="prevPair()" :disabled="currentIndex === 0"><v-icon left>mdi-chevron-left</v-icon>Prev</v-btn>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-center mx-auto" style="width:200px">
                    Photo Pair: {{ currentIndex + 1 }} of {{ pairs.length }}
                    <v-progress-linear
                      color="primary"
                      height="10"
                      :value="currentIndex / (pairs.length - 1) * 100"
                      striped
                    ></v-progress-linear>
                  </div>
                </v-col>
                <v-col cols="4" class="text-left">
                  <v-btn @click="nextPair()" :disabled="currentIndex === pairs.length - 1">Next (Enter)<v-icon right>mdi-chevron-right</v-icon></v-btn>
                </v-col>
              </v-row>
            </div>
          </v-card-text>

          <v-divider v-if="pairs.length > 0"></v-divider>

          <!-- SUBMIT -->
          <v-card-actions class="pa-4 d-block" v-if="pairs.length > 0">
            <div v-if="error.submit" class="mb-8">
              <Alert type="error" title="Submission Error" class="mx-auto" style="max-width:600px">
                {{ error.submit }}
              </Alert>
            </div>
            <div v-if="submitEarly && completedPairs.length < pairs.length" class="mb-4">
              <Alert type="warning" title="Need to Finish Early?" class="mx-auto" style="max-width:600px">
                <p>
                  It looks like you have annotated {{ completedPairs.length.toLocaleString() }} of the {{ pairs.length.toLocaleString() }} total photo pairs for this station.
                </p>
                <p>
                  If you need to finish early, click <code>Submit</code> again to save the {{ completedPairs.length.toLocaleString() }} annotations you have completed so far.
                </p>
                <div class="text-right">
                  <v-btn @click="submitEarly = false">Close</v-btn>
                </div>
              </Alert>
            </div>
            <div v-if="completedPairs.length === pairs.length">
              <Alert type="success" title="All Done!" class="mx-auto" style="max-width:600px">
                Click submit to save your data to the server
              </Alert>
            </div>
            <div class="text-center">
              <v-btn @click="submit" color="primary" :loading="loading.submit" large>
                <v-icon left>mdi-upload</v-icon>Submit
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ascending } from 'd3'
import { mapGetters } from 'vuex'
import evt from '@/events'
export default {
  name: 'Annotate',
  data () {
    return {
      loading: {
        stations: false,
        station: false,
        submit: false
      },
      error: {
        start: null,
        station: null,
        annotation: null,
        submit: null
      },
      stations: [],
      stationArray: [],
      search: '',
      nPairs: 100,
      currentIndex: null,
      startedAt: new Date(),
      pairs: [],
      submitEarly: false,
      headers: [
        {
          text: 'Station',
          align: 'start',
          sortable: true,
          value: 'name'
        },
        {
          text: '# Annotations',
          value: 'n_annotations',
          align: 'end',
          sortable: true
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['user']),
    station () {
      return this.stationArray.length > 0 ? this.stationArray[0] : null
    },
    currentPair () {
      if (this.currentIndex === null) return null
      return this.pairs[this.currentIndex]
    },
    completedPairs () {
      return this.pairs.filter(d => !!d.rank)
    }
  },
  async mounted () {
    await this.fetchStations()
    // TEMPORARY --------------------
    // this.selectStation(this.stations[0])
    // this.nPairs = 2
    // this.fetchStationPairs()
    // ------------------------------
    window.addEventListener('keyup', this.onKeyUp)
  },
  beforeDestroy () {
    window.removeEventListener('keyup', this.onKeyUp)
  },
  methods: {
    async fetchStations () {
      this.loading.stations = true
      try {
        const response = await this.$http.restricted.get('/annotations/stations')
        const stations = response.data.sort((a, b) => ascending(a.name, b.name))
        stations.forEach(d => {
          d.n_annotations = d.n_annotations || 0
        })
        this.stations = stations
      } catch (err) {
        console.error(err)
        evt.$emit('notify', 'error', 'Failed to get stations from server')
      } finally {
        this.loading.stations = false
      }
    },
    onKeyUp (e) {
      if (!this.currentPair) return
      if (e.code === 'KeyJ') {
        this.currentPair.rank = 'LEFT'
      } else if (e.code === 'KeyK') {
        this.currentPair.rank = 'SAME'
      } else if (e.code === 'KeyL') {
        this.currentPair.rank = 'RIGHT'
      } else if (e.code === 'KeyM') {
        this.currentPair.rank = 'UNKNOWN'
      } else if (e.code === 'Enter') {
        this.nextPair()
      }
    },
    async fetchStationPairs () {
      if (!this.station) return
      this.loading.station = true
      try {
        const response = await this.$http.public.get(`/stations/${this.station.id}/image-pairs?n_pairs=${this.nPairs}`)
        this.pairs = response.data.map(d => {
          return {
            left: {
              image: d.left,
              attributes: []
            },
            right: {
              image: d.right,
              attributes: []
            },
            rank: null,
            comment: null
          }
        })
        if (this.pairs.length > 0) {
          this.currentIndex = 0
        }
      } catch (err) {
        console.error(err)
        this.error.station = err.message || err.toString()
      } finally {
        this.loading.station = false
      }
    },
    prevPair () {
      this.error.annotation = null
      this.currentIndex -= 1
    },
    nextPair () {
      this.error.submit = null
      if (!this.currentPair.rank) {
        this.error.annotation = 'Select an option for which photo has more water.'
        return
      }
      if (this.currentIndex < this.pairs.length - 1) {
        this.error.annotation = null
        this.currentIndex += 1
      }
    },
    reset () {
      this.pairs = []
      this.error.start = null
      this.error.station = null
      this.error.annotation = null
      this.error.submit = null
      this.currentIndex = null
      this.submitEarly = false
      this.startedAt = new Date()
    },
    async submit () {
      this.error.submit = null

      if (this.completedPairs.length === 0) {
        this.error.submit = 'At least one photo pair must be annotated been annotated'
        return
      }

      if (!this.submitEarly && this.completedPairs.length < this.pairs.length) {
        this.submitEarly = true
        return
      }

      this.submitEarly = false

      this.loading.submit = true
      try {
        const finishedAt = new Date()
        const durationSeconds = (finishedAt.valueOf() - this.startedAt.valueOf()) / 1000
        const payload = {
          user_id: this.user.username,
          station_id: this.station.id,
          duration_sec: durationSeconds,
          n: this.completedPairs.length
        }
        const response = await this.$http.restricted.post('/annotations', payload)
        const annotation = response.data

        const s3Response = await this.uploadFile(annotation)
        const updatePayload = {
          status: 'DONE',
          ...s3Response
        }
        await this.$http.restricted.put(`/annotations/${annotation.id}`, updatePayload)

        this.station.n_annotations += payload.n

        this.reset()
        evt.$emit('notify', 'success', 'Annotations have been saved')
      } catch (err) {
        console.log(err)
        this.error.submit = err.message || err.toString()
      } finally {
        this.loading.submit = false
      }
    },
    async uploadFile (annotation) {
      const annotations = this.completedPairs
        .map(d => {
          return {
            left: {
              imageId: d.left.image.image_id,
              attributes: d.left.attributes
            },
            right: {
              imageId: d.right.image.image_id,
              attributes: d.right.attributes
            },
            rank: d.rank,
            comment: d.comment
          }
        })
      const body = JSON.stringify(annotations)
      const formData = new FormData()
      Object.keys(annotation.presignedUrl.fields).forEach((key) => {
        formData.append(key, annotation.presignedUrl.fields[key])
      })
      formData.append('file', body)

      const response = await this.$http.external.post(annotation.presignedUrl.url, formData)

      return {
        url: `https://${annotation.s3.Bucket}.s3.amazonaws.com/${annotation.s3.Key}`,
        s3: response.data.s3
      }
    },
    start () {
      this.error.start = null
      this.error.annotation = null
      this.error.submit = null

      if (!this.station) {
        this.error.start = 'Select a station in the table above'
        return
      }
      if (!this.nPairs || this.nPairs <= 0 || this.nPairs > 10000) {
        this.error.start = 'Number of annotations must be between 1 and 10,000'
        return
      }

      this.startedAt = new Date()
      this.fetchStationPairs()
    },
    onClickPhotoAttributes (side) {
      if (!side) return
      if (this.currentPair.left.attributes.includes('BAD') ||
          this.currentPair.left.attributes.includes('ICE') ||
          this.currentPair.right.attributes.includes('BAD') ||
          this.currentPair.right.attributes.includes('ICE')
      ) {
        this.currentPair.rank = 'UNKNOWN'
      } else if (this.currentPair.rank === 'UNKNOWN') {
        this.currentPair.rank = null
      }
    },
    selectStation (station) {
      if (station === this.station) {
        this.stationArray = []
      } else {
        this.stationArray = [station]
      }
    }
  }
}
</script>

<style>
.fpe-image-url {
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.fpe-annotation-class-button-left {
  border-left-width: 0.8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}
.fpe-annotation-class-button-center {
  border-left-width: 0.8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}
.fpe-annotation-class-button-left > .v-btn__content {
  justify-content: start !important;
  align-items: center !important;
}
.fpe-annotation-class-button-center > .v-btn__content {
  justify-content: middle !important;
  align-items: center !important;
}
.fpe-annotation-class-button-label {
  font-size: 0.5rem !important;
}

</style>
