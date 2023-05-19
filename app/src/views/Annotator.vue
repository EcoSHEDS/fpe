<template>
  <v-container fluid>
    <v-row justify="space-around">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="4">

          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Flow Photo Annotator
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="body-1 black--text" v-if="loading.stations">
            Loading...
          </v-card-text>
          <v-card-text class="body-1 black--text" v-else>
            <v-row class="justify-space-around">
              <v-col cols="6" class="text-center">
                <v-row class="justify-space-around">
                  <v-col cols="8">
                    <v-autocomplete
                      v-model="station"
                      :items="stations"
                      item-text="name"
                      return-object
                      hide-details
                      label="Select a station"
                      outlined
                      class="my-4"
                      clearable
                    ></v-autocomplete>
                    <v-text-field
                      v-model.number="nPairs"
                      label="Number of annotations"
                      outlined
                      hide-details
                      class="my-4"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <div class="text-center my-4">
                  <v-btn large color="primary" :disabled="!station" @click="start" :loading="loading.pairs">Start Annotating</v-btn>
                </div>
              </v-col>
              <v-divider vertical></v-divider>
              <v-col cols="6">
                <v-sheet max-height="250" style="overflow-y:auto;">
                  <div class="text-h6">Instructions</div>
                  <ol>
                    <li>Select a station, enter the number of annotations you would like to perform, and click <code>Start Annotating</code>.</li>
                    <li>For each photo pair:
                      <ol>
                        <li>
                          Click the appropriate button below each photo to indicate the following:
                          <ul>
                            <li>
                              <code><v-icon left>mdi-water-off-outline</v-icon>Dry</code>: stream is completely dry (no water visible)
                            </li>
                            <li>
                              <code><v-icon left>mdi-snowflake</v-icon> Ice/Snow</code>: stream is fully covered by snow and/or ice (cannot see water surface)
                            </li>
                            <li>
                              <code><v-icon left>mdi-image-remove</v-icon>Bad Photo</code>: cannot see the water level because the photo is not clear (e.g., too blurry, too dark, too much glare, etc.)
                            </li>
                          </ul>
                        </li>
                        <li>
                          Indicate which which of the two photos has more water (<code>Left</code> or <code>Right</code>). Choose <code>About the Same</code> if the photos show similar amounts of water. Choose <code>Can't Tell</code> if one or both photos is a bad photo (too blurry, dark, glare, etc.). Note these options can be selected using keyboard shortcuts (<code>j</code> = Left, <code>k</code> = About the Same, <code>l</code> = Right, <code>m</code> = Can't Tell).
                        </li>
                        <li>
                          If you had any questions or noteable observations about these photos, enter them in the <code>Comments</code> field.
                        </li>
                        <li>
                          When finished with this pair, click <code>Next</code> (or press your Enter key) to load the next pair and repeat these steps.
                        </li>
                      </ol>
                    </li>
                    <li>
                      After you have annotated all of the pairs, a new <code>Submit</code> button will appear. Click this button to save your annotations to the server. Note that none of the annotations will be saved until they are submitted!
                    </li>
                    <li>
                      Once you have completed a batch of annotations, you can do another batch by repeating step 1 above.
                    </li>
                  </ol>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text v-if="pairs.length === 0 && error">
            <v-row>
              <v-col cols="6">
                <Alert type="error" title="Error" class="mb-0">
                  {{ error }}
                </Alert>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="body-1 black--text" v-if="pairs.length > 0">
            <v-divider class="mb-4"></v-divider>
            <v-row v-if="currentPair">
              <v-col cols="6">
                <!-- <pre>Image ID: {{ currentPair.left.image.image_id }}</pre> -->
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
                <div class="d-flex justify-space-around my-4" v-on:keyup.left="selectLeft">
                  <v-btn-toggle v-model="currentPair.left.attributes" multiple color="error">
                    <v-btn value="DRY" class="px-4" small>
                      <v-icon left>mdi-water-off-outline</v-icon>Dry
                    </v-btn>
                    <v-btn value="ICE" class="px-4" small>
                      <v-icon left>mdi-snowflake</v-icon> Ice/Snow
                    </v-btn>
                    <v-btn value="BAD" class="px-4" small>
                      <v-icon left>mdi-image-remove</v-icon>Bad Photo
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>
              <v-col cols="6">
                <!-- <pre>Image ID: {{ currentPair.right.image.image_id }}</pre> -->
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
                <div class="d-flex justify-space-around my-4">
                  <v-btn-toggle v-model="currentPair.right.attributes" multiple color="error">
                    <v-btn value="DRY" class="px-4" small>
                      <v-icon left>mdi-water-off-outline</v-icon>Dry
                    </v-btn>
                    <v-btn value="ICE" class="px-4" small>
                      <v-icon left>mdi-snowflake</v-icon> Ice/Snow
                    </v-btn>
                    <v-btn value="BAD" class="px-4" small>
                      <v-icon left>mdi-image-remove</v-icon>Bad Photo
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>
            </v-row>

            <div class="text-h6 text-center mb-8 mt-4">Which photo has more water?</div>
            <v-item-group v-model="currentPair.rank" color="primary" class="mt-4 d-flex justify-space-around">
              <v-row>
                <v-col cols="4" class="text-center">
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
                      <v-btn :color="active ? 'primary' : 'default'" :depressed="active" @click="toggle" large>Can't Tell (m)</v-btn>
                    </v-item>
                  </div>
                </v-col>
                <v-col cols="4" class="text-center">
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

            <v-row v-if="error" justify="center">
              <v-col cols="6">
                <Alert type="error" title="Error">
                  {{ error }}
                </Alert>
              </v-col>
            </v-row>

            <v-row v-if="(currentIndex === pairs.length - 1 && currentPair.rank !== null)" justify="center" class="mt-4">
              <v-col cols="6">
                <v-alert type="success">
                  <div class="text-h6">All Done!</div>
                  <p>Click submit to save your data to the server</p>
                  <v-btn @click="submit" light :loading="loading.submit"><v-icon left>mdi-upload</v-icon>Submit</v-btn>
                </v-alert>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-space-around align-center">
              <v-btn @click="currentIndex -= 1" :disabled="currentIndex === 0"><v-icon left>mdi-chevron-left</v-icon>Prev</v-btn>
              <div class="text-center" style="width:200px">
                Photo Pair: {{ currentIndex + 1 }} of {{ pairs.length }}
                <v-progress-linear
                  color="primary"
                  height="10"
                  :value="currentIndex / (pairs.length - 1) * 100"
                  striped
                ></v-progress-linear>
              </div>
              <v-btn @click="nextPair()" :disabled="currentIndex === pairs.length - 1">Next (Enter)<v-icon right>mdi-chevron-right</v-icon></v-btn>
            </div>
          </v-card-text>
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
        pairs: false,
        submit: false
      },
      error: null,
      stations: [],
      station: null,
      nPairs: 100,
      currentIndex: null,
      startedAt: new Date(),
      pairs: [],
      annotating: false
    }
  },
  computed: {
    ...mapGetters(['user']),
    currentPair () {
      if (this.currentIndex === null) return null
      return this.pairs[this.currentIndex]
    }
  },
  mounted () {
    this.fetchStations()
    // this.fetchPairs()
    window.addEventListener('keyup', this.onKeyUp)
  },
  beforeDestroy () {
    window.removeEventListener('keyup', this.onKeyUp)
  },
  methods: {
    async fetchStations () {
      this.loading.stations = true
      try {
        const response = await this.$http.public.get('/stations')
        this.stations = response.data.sort((a, b) => ascending(a.name, b.name))
      } catch (err) {
        console.error(err)
        this.error = 'Failed to get stations from server'
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
    async fetchPairs () {
      if (!this.station) return
      this.loading.pairs = true
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
        this.error = err.message || err.toString()
      } finally {
        this.loading.pairs = false
      }
    },
    nextPair () {
      if (!this.currentPair.rank) {
        this.error = 'Select an option for which photo has more water.'
        return
      }
      if (this.currentIndex < this.pairs.length - 1) {
        this.error = null
        this.currentIndex += 1
      }
    },
    reset () {
      this.pairs = []
      this.error = null
      this.currentIndex = null
      this.startedAt = new Date()
      this.annotating = false
    },
    async submit () {
      this.loading.submit = true
      try {
        const finishedAt = new Date()
        const durationSeconds = (finishedAt.valueOf() - this.startedAt.valueOf()) / 1000
        const payload = {
          user_id: this.user.username,
          station_id: this.station.id,
          duration_sec: durationSeconds,
          n: this.pairs.length
        }
        const response = await this.$http.restricted.post('/annotations', payload)
        const annotation = response.data

        const s3Response = await this.uploadFile(annotation)
        const updatePayload = {
          status: 'DONE',
          ...s3Response
        }
        await this.$http.restricted.put(`/annotations/${annotation.id}`, updatePayload)

        this.reset()
        evt.$emit('notify', 'success', 'Annotations have been saved')
      } catch (err) {
        console.log(err)
        this.error = err.message || err.toString()
      } finally {
        this.loading.submit = false
      }
    },
    async uploadFile (annotation) {
      const annotations = this.pairs.map(d => {
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
      this.error = null
      if (!this.station) {
        this.error = 'Select a station'
        return
      }
      if (!this.nPairs || this.nPairs <= 0 || this.nPairs > 10000) {
        this.error = 'Number of pairs must be between 1 and 10,000'
        return
      }

      this.annotating = true
      this.startedAt = new Date()
      this.fetchPairs()
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
</style>
