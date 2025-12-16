<template>
  <v-container fluid>
    <v-row justify="space-around">
      <v-col cols="12" lg="10" xl="10">
        <v-card elevation="4">
          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Photo Annotator
            </v-toolbar-title>
          </v-toolbar>

          <!-- SELECT STATION / INSTRUCTIONS -->
          <v-card-text class="body-1 black--text mb-0">
            <v-row class="justify-space-around">
              <!-- TRAINING REQUIRED -->
              <v-col cols="6" v-if="showTraining">
                <Alert type="warning" class="body-1">
                  <div class="text-h6">Welcome to the FPE Photo Annotator Training</div>
                  <p>You need to complete the required training before you can start annotating photos.</p>
                  <p>During this training, you will annotate 250 pairs of photos from a stream in central Massachusetts. This should take around 30-45 minutes to complete.</p>
                  <p>If you need a break, you can save your progress and come back later to finish.</p>
                  <p>Start by reading the instructions to the right, then click the button below to begin the training.</p>
                  <p>If you have any questions, please contact us at <a href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a>.</p>
                  <v-btn
                    color="primary"
                    @click="startTraining"
                    :loading="loading.training || loading.resume"
                    :disabled="pairs.length > 0 || canResume"
                  >
                    Begin Training
                  </v-btn>
                </Alert>
                <Alert
                  type="info"
                  class="body-1 mt-4"
                  title="Training in progress..."
                  :loading="loading.training"
                  v-if="pairs.length > 0 && !trainingComplete"
                ></Alert>
                <Alert type="info" class="body-1 mt-4" v-if="canResume && pairs.length === 0 && !showTrainingComplete">
                  <div class="text-h6">Resume Training?</div>
                  <p>
                    You have an in-progress training session with
                    <strong>{{ resumeAnnotation.training_completed }}</strong> of
                    <strong>{{ resumeAnnotation.training_total }}</strong>
                    pairs completed
                    ({{ (resumeAnnotation.training_completed / resumeAnnotation.training_total * 100).toFixed(1) }}%).
                  </p>
                  <p>Would you like to continue where you left off, or start over?</p>
                  <div>
                    <v-btn
                      color="primary"
                      @click="resumeTraining"
                      :loading="loading.training"
                      class="mr-2"
                    >
                      <v-icon left>mdi-play</v-icon>
                      Resume Training
                    </v-btn>
                    <v-btn @click="canResume = false; startTraining()">
                      <v-icon left>mdi-restart</v-icon>
                      Start Over
                    </v-btn>
                  </div>
                </Alert>
                <Alert type="success" class="mb-0 body-1 mt-4" v-if="showTrainingComplete">
                  <div class="text-h6">Training Complete!</div>
                  <p>Your results have been sent to the FPE team for review. You will receive an email within 1-2 business days containing further instructions on how to begin annotating photos.</p>
                  <p class="mb-0">Thank you for your time and for being a part of this project!</p>
                </Alert>
                <Alert type="error" class="mt-4 mb-0" title="Error Fetching Training Dataset" v-if="error.training">{{ error.training }}</Alert>
              </v-col>
              <!-- SELECT STATION -->
              <v-col cols="6" v-else>
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

                      <div class="caption px-4 pb-2">
                        <v-icon small left>mdi-information</v-icon>
                        Priority stations are those we are actively seeking more annotations for. Please annotate those first unless there are others you are specifically interested in. Once a station has at least 2,000 <i>daytime</i> annotations, please move on to another.
                      </div>
                      <v-data-table
                        v-model="stationArray"
                        :loading="loading.stations"
                        :headers="headers"
                        :items="stations"
                        :search="search"
                        :items-per-page="5"
                        :sort-by.sync="sortBy"
                        :sort-desc.sync="sortDesc"
                        single-select
                        dense
                        @click:row="selectStation"
                      >
                        <template v-slot:item.annotation_priority="{ item }">
                          <v-simple-checkbox :value="!!item.annotation_priority" :disabled="true"></v-simple-checkbox>
                        </template>
                      </v-data-table>
                    </v-card>
                    <div class="body-2 mt-8 mb-2">
                      Select the variable you want to annotate. This will also be the variable the model will be trained to predict.
                    </div>
                    <v-select
                      v-model="variable"
                      :items="variables"
                      item-text="label"
                      item-value="value"
                      label="Variable"
                      outlined
                      return-object
                      hide-details
                      class="mb-4"
                    ></v-select>
                    <div class="body-2 mt-8 mb-2">
                      Select the number of photo pairs you would like to annotate during this session.
                    </div>
                    <v-text-field
                      v-model.number="nPairs"
                      label="Number of photo pairs"
                      outlined
                      hide-details
                      class="mb-4"
                    ></v-text-field>
                    <p class="body-2 mt-8">The following inputs are optional, and should only be used when requested. Leave blank to defaults, which will include only daytime photos (7:00 am to 6:59 pm) from any available date at the selected station.</p>
                    <v-row>
                      <v-col>
                        <v-text-field
                          v-model="minHour"
                          label="Minimum Photo Hour"
                          outlined
                          hint="Integer (0-23) in 24H time (default = 7 for 7:00 AM)"
                          persistent-hint
                          type="number"
                        ></v-text-field>
                      </v-col>
                      <v-col>
                        <v-text-field
                          v-model="maxHour"
                          label="Maximum Photo Hour"
                          outlined
                          hint="Integer (0-23) in 24H time (default = 18 for 6:59 PM)"
                          persistent-hint
                          type="number"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col>
                        <v-menu
                          v-model="menus.minDate"
                          :close-on-content-click="false"
                          transition="scale-transition"
                          offset-y
                          max-width="290px"
                          min-width="auto"
                        >
                          <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                              v-model="minDate"
                              label="Minimum Photo Date"
                              clearable
                              outlined
                              persistent-hint
                              hint="YYYY-MM-DD format (default = first available)"
                              v-bind="attrs"
                              v-on="on"
                            ></v-text-field>
                          </template>
                          <v-date-picker
                            v-model="minDate"
                            no-title
                            @input="menus.minDate = false"
                          ></v-date-picker>
                        </v-menu>
                      </v-col>
                      <v-col>
                        <v-menu
                          v-model="menus.maxDate"
                          :close-on-content-click="false"
                          transition="scale-transition"
                          offset-y
                          max-width="290px"
                          min-width="auto"
                        >
                          <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                              v-model="maxDate"
                              label="Maximum Photo Date"
                              clearable
                              outlined
                              persistent-hint
                              hint="YYYY-MM-DD format (default = last available)"
                              v-bind="attrs"
                              v-on="on"
                            ></v-text-field>
                          </template>
                          <v-date-picker
                            v-model="maxDate"
                            no-title
                            @input="menus.maxDate = false"
                          ></v-date-picker>
                        </v-menu>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>

                <div class="text-center mt-4">
                  <v-btn large color="primary" @click="start" :loading="loading.station">Start Annotating<v-icon right>mdi-chevron-right</v-icon></v-btn>
                </div>

                <Alert type="error" class="mt-8 mb-0" v-if="error.start">{{ error.start }}</Alert>
              </v-col>

              <v-divider vertical></v-divider>

              <!-- INSTRUCTIONS -->
              <v-col cols="6">
                <v-expansion-panels :value="0">
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      <div class="text-h6">Instructions</div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-sheet>
                        <ol>
                          <li v-if="!showTraining">Select a station on the table (priority stations first, if possible), select the variable you want to annotate, then enter the number of photo pairs you would like to annotate and specify the minimum/maximum hours and dates (optional). Then click <code>Start Annotating</code>.</li>
                          <li v-else>During this training you will be shown a series of photo pairs. Your goal is to determine which photo shows higher flows (or more water) in the stream. You will also be indicating if one or both of the photos show certain types of conditions, as explained below.</li>
                          <li>For each pair of photos:
                            <ol>
                              <li>
                                First, review each photo individually and indicate if that photo shows one of the following conditions by clicking the appropriate button below the photo.
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
                                Next, determine which of the two shows more water, and click the appropriate button below the photo pair (<code>Left</code> or <code>Right</code>). Select <code>About the Same</code> if the photos show similar amounts of water. Select <code>Skip</code> only if you cannot make a valid comparison (e.g., one or both is a bad photo or the camera angle is too inconsistent). Pairs labelled as <code>About the Same</code> will be used for model training while those labelled as <code>Skip</code> will not. You can also use the following keyboard shortcuts to make your selection: <code>j</code> = Left, <code>k</code> = About the Same, <code>l</code> = Right, <code>m</code> = Skip.
                              </li>
                              <li>
                                If you were unsure about your selection or had any other questions or observations about this pair of photos, let us know in the <code>Comments</code> field.
                              </li>
                              <li>
                                When finished with this pair, click <code>Next</code> (or press your Enter key) to load the next pair of photos and repeat these steps.
                              </li>
                            </ol>
                          </li>
                          <li v-if="showTraining">
                            Your progress is automatically saved every few seconds. If you need a break, click <code>Save Progress</code> and you can resume later. When you complete all {{ pairs.length || 250 }} pairs, click <code>Submit</code> to send your results to the FPE team for review. You will receive an email within 1-2 business days with instructions on how to begin annotating photos.
                          </li>
                          <li v-if="!showTraining">
                            When you are finished, click the <code>Submit</code> button to save your annotations to the server.
                          </li>
                          <li v-if="!showTraining">
                            If you need to stop early, go ahead and submit the annotations you have already completed.
                          </li>
                          <li v-if="!showTraining">
                            Once you have completed a batch of annotations, you can do another batch by repeating step 1 above.
                          </li>
                        </ol>
                      </v-sheet>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
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
                  <div class="fpe-image-url text-center"><a :href="fixDataUrl(currentPair.left.image.thumb_url)">{{ currentPair.left.image.filename }}</a></div>
                  <div class="text-center">{{ currentPair.left.image.timestamp | formatTimestamp(station.timezone) }}</div>
                  <v-img
                    lazy-src="img/placeholder.png"
                    max-height="400"
                    :src="fixDataUrl(currentPair.left.image.thumb_url)"
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
                  <div class="fpe-image-url text-center"><a :href="fixDataUrl(currentPair.right.image.thumb_url)">{{ currentPair.right.image.filename }}</a></div>
                  <div class="text-center">{{ currentPair.right.image.timestamp | formatTimestamp(station.timezone) }}</div>
                  <v-img
                    lazy-src="img/placeholder.png"
                    max-height="400"
                    :src="fixDataUrl(currentPair.right.image.thumb_url)"
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

            <div class="text-h6 text-center mb-8 mt-8">{{ variable.question }}</div>
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
                      <v-btn :color="active ? 'primary' : 'default'" :depressed="active" @click="toggle" large>Skip (m)</v-btn>
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
                <v-text-field outlined v-model="currentPair.comment" hide-details label="Any comments?" ref="comment"></v-text-field>
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
                  <div class="text-center mx-auto" style="width:250px">
                    Pair {{ currentIndex + 1 }} of {{ pairs.length }}<br>({{ (completedPairs.length / pairs.length * 100).toFixed(1) }}% complete)
                    <v-progress-linear
                      color="primary"
                      height="10"
                      :value="completedPairs.length / pairs.length * 100"
                      striped
                    ></v-progress-linear>
                    <div class="caption mt-2" v-if="showTraining && lastSavedCount > 0">
                      <v-icon small color="success" :loading="loading.progress">mdi-check-circle</v-icon>
                      Progress saved ({{ lastSavedCount }} pair<span v-if="lastSavedCount > 1">s</span>)
                    </div>
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
            <div v-if="error.submit">
              <Alert type="error" title="Failed to Submit Annotations" class="mx-auto" style="max-width:600px">
                {{ error.submit }}
              </Alert>
            </div>
            <div class="text-center">
              <v-btn
                v-if="showTraining"
                @click="saveProgress(true)"
                color="secondary"
                :loading="loading.progress"
                large
                class="mr-2"
              >
                <v-icon left>mdi-content-save</v-icon>Save Progress
              </v-btn>
              <v-btn
                @click="submit"
                color="primary"
                :loading="loading.submit"
                large
                :disabled="showTraining && completedPairs.length < pairs.length"
              >
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
import { ascending } from 'd3-array'
import { mapGetters } from 'vuex'
import { fixDataUrl } from '@/lib/utils'
import evt from '@/events'
import store from '@/store'

export default {
  name: 'Annotate',
  data () {
    return {
      loading: {
        stations: false,
        station: false,
        training: false,
        submit: false,
        resume: true,
        progress: false
      },
      error: {
        start: null,
        station: null,
        training: null,
        annotation: null,
        submit: null
      },
      trainingComplete: false,
      // Resume functionality
      resumeAnnotation: null,
      canResume: false,
      isResuming: false,
      autoSaveInterval: null,
      lastSavedCount: 0,
      stations: [],
      stationArray: [],
      variables: [
        {
          value: 'FLOW',
          label: 'Flow (Streams and Rivers)',
          question: 'Which photo shows more flow?'
        },
        {
          value: 'STAGE',
          label: 'Water Level (Lakes and Wetlands)',
          question: 'Which photo shows a higher water level?'
        },
        {
          value: 'ICE',
          label: 'Ice Cover',
          question: 'Which photo shows more ice cover?'
        },
        {
          value: 'SNOW',
          label: 'Snow Depth',
          question: 'Which photo shows more snow?'
        },
        {
          value: 'ALGAE',
          label: 'Algal Biomass / Chlorophyll',
          question: 'Which photo shows more algae?'
        },
        {
          value: 'ANIMALS',
          label: 'Animal Counts',
          question: 'Which photo shows more individuals?'
        },
        {
          value: 'OTHER',
          label: 'Other',
          question: 'Which photo shows more of the parameter of interest?'
        }
      ],
      variable: null,
      search: '',
      nPairs: 100,
      minHour: null,
      maxHour: null,
      minDate: null,
      maxDate: null,
      menus: {
        minDate: false,
        maxDate: false
      },
      currentIndex: null,
      startedAt: new Date(),
      pairs: [],
      pairsStationId: null,
      submitEarly: false,
      headers: [
        {
          text: 'Station',
          align: 'start',
          sortable: true,
          value: 'name'
        },
        {
          text: '# Annotations (Total)',
          value: 'n_annotations',
          align: 'end',
          sortable: true
        },
        {
          text: '# Annotations (Daytime)',
          value: 'n_annotations_daytime',
          align: 'end',
          sortable: true
        },
        {
          text: 'Priority',
          value: 'annotation_priority',
          align: 'end',
          sortable: true
        }
      ],
      sortBy: ['annotation_priority', 'n_annotations_daytime'],
      sortDesc: [true, false]
    }
  },
  computed: {
    ...mapGetters(['user', 'dbUser']),
    station () {
      return this.stationArray.length > 0 ? this.stationArray[0] : null
    },
    currentPair () {
      if (this.currentIndex === null) return null
      return this.pairs[this.currentIndex]
    },
    completedPairs () {
      return this.pairs.filter(d => !!d.rank)
    },
    showTraining () {
      return this.dbUser && this.dbUser.training_required
    },
    showTrainingComplete () {
      return this.dbUser && this.dbUser.training_complete
    }
  },
  async mounted () {
    await this.fetchStations()
    this.variable = this.variables[0]

    // Check for resumable training
    if (this.showTraining) {
      await this.checkResumeTraining()
    }

    // TEMPORARY --------------------
    // this.selectStation(this.stations[0])
    // this.nPairs = 2
    // this.fetchStationPairs()
    // ------------------------------
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('beforeunload', this.onBeforeUnload)
  },
  beforeDestroy () {
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('beforeunload', this.onBeforeUnload)

    // Clear auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }
  },
  beforeRouteLeave (to, from, next) {
    if (this.completedPairs.length > 0) {
      const message = 'Are you sure you want to leave? Your annotations will not be saved.'
      if (window.confirm(message)) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  },
  methods: {
    fixDataUrl,
    async fetchStations () {
      this.loading.stations = true
      try {
        let api = this.$http.restricted
        if (this.user.isAdmin) {
          api = this.$http.admin
        }

        const response = await api.get('/annotations/stations')

        const stations = response.data.sort((a, b) => {
          // Sort by annotation_priority (descending) first, then by name (ascending)
          if (b.annotation_priority !== a.annotation_priority) {
            return b.annotation_priority - a.annotation_priority
          }
          return ascending(a.name, b.name)
        })
        stations.forEach(d => {
          d.n_annotations = d.n_annotations || 0
          d.n_annotations_daytime = d.n_annotations_daytime || 0
          d.annotation_priority = d.annotation_priority || 0
        })
        this.stations = stations
      } catch (err) {
        console.error(err)
        evt.$emit('notify', 'error', 'Failed to get stations from server')
      } finally {
        this.loading.stations = false
      }
    },
    async checkResumeTraining () {
      try {
        this.loading.resume = true
        const response = await this.$http.restricted.get('/annotations/training/resume')
        if (response.data.canResume &&
          response.data.annotation.training_completed > 0 &&
          response.data.annotation.status === 'IN_PROGRESS') {
          this.canResume = true
          this.resumeAnnotation = response.data.annotation
        }
      } catch (err) {
        console.error('Failed to check resume status', err)
        evt.$emit('notify', 'error', 'Failed to check resume status')
      } finally {
        this.loading.resume = false
      }
    },
    async resumeTraining () {
      this.loading.training = true
      this.error.training = null
      try {
        // Fetch saved progress from S3
        const url = fixDataUrl(this.resumeAnnotation.url)
        const response = await this.$http.external.get(url)
        const savedProgress = response.data

        // Restore training state - get station
        const stationResponse = await this.$http.restricted.get(
          `/stations/${this.resumeAnnotation.station_id}`
        )
        this.selectStation(stationResponse.data)
        this.pairsStationId = this.resumeAnnotation.station_id

        // Restore variable
        this.variable = this.variables.find(v =>
          v.value === (this.resumeAnnotation.variable || 'FLOW')
        ) || this.variables[0]

        // Restore pairs with saved progress
        this.pairs = savedProgress.allPairs
        this.currentIndex = savedProgress.currentIndex || 0
        this.startedAt = new Date(this.resumeAnnotation.created_at)
        this.isResuming = true
        this.lastSavedCount = savedProgress.completedCount || 0

        // Begin auto-saving
        this.startAutoSave()

        evt.$emit('notify', 'success', 'Training resumed successfully')
      } catch (err) {
        console.error(err)
        this.error.training = err.message || 'Failed to resume training'
        evt.$emit('notify', 'error', 'Failed to resume training')
      } finally {
        this.loading.training = false
      }
    },
    startAutoSave () {
      // Clear any existing interval
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval)
      }

      // Save every 60 seconds
      this.autoSaveInterval = setInterval(() => {
        this.saveProgress()
      }, 5000) // Every minute
    },
    async saveProgress (notify = false) {
      if (
        !this.resumeAnnotation ||
        this.completedPairs.length === 0 ||
        this.lastSavedCount === this.completedPairs.length
      ) return
      this.loading.progress = true

      try {
        const progressData = {
          allPairs: this.pairs,
          currentIndex: this.currentIndex,
          completedCount: this.completedPairs.length
        }

        // Upload to S3
        const s3Response = await this.uploadProgress(progressData)

        // Update annotation record
        await this.$http.restricted.put(
          `/annotations/${this.resumeAnnotation.id}`,
          {
            training_completed: this.completedPairs.length,
            url: s3Response.url,
            duration_sec: (new Date() - this.startedAt) / 1000
          }
        )

        this.lastSavedCount = this.completedPairs.length
        if (notify) {
          evt.$emit('notify', 'success', 'Progress saved! You can resume later.')
        }
      } catch (err) {
        console.error('Auto-save failed', err)
        evt.$emit('notify', 'error', 'Failed to auto-save progress')
      } finally {
        this.loading.progress = false
      }
    },
    async uploadProgress (data) {
      const body = JSON.stringify(data)
      const formData = new FormData()

      Object.keys(this.resumeAnnotation.presignedUrl.fields).forEach(key => {
        formData.append(key, this.resumeAnnotation.presignedUrl.fields[key])
      })
      formData.append('file', body)

      await this.$http.external.post(
        this.resumeAnnotation.presignedUrl.url,
        formData
      )

      return {
        url: `https://${this.resumeAnnotation.s3.Bucket}.s3.amazonaws.com/${this.resumeAnnotation.s3.Key}`
      }
    },
    onBeforeUnload (e) {
      // Only show warning if there are unsaved annotations
      if (!this.showTraining && this.completedPairs.length > 0) {
        e.preventDefault()
        // Modern browsers require returnValue to be set
        e.returnValue = ''
        // Some browsers display this message, but most show a generic message
        return ''
      }
    },
    onKeyUp (e) {
      if (!this.currentPair) return
      if (this.$refs.comment && this.$refs.comment.isFocused) return
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
      this.error.station = null
      this.pairs = []
      this.pairsStationId = null
      try {
        let query = `n_pairs=${this.nPairs}`
        const minHour = parseInt(this.minHour)
        const maxHour = parseInt(this.maxHour)
        if (!isNaN(minHour)) {
          query += `&min_hour=${this.minHour}`
        }
        if (!isNaN(maxHour)) {
          query += `&max_hour=${this.maxHour}`
        }
        if (this.minDate) {
          query += `&min_date=${this.minDate}`
        }
        if (this.maxDate) {
          query += `&max_date=${this.maxDate}`
        }
        const url = `/stations/${this.station.id}/image-pairs?${query}`
        const response = await this.$http.restricted.get(url)

        if (response.data.length === 0) {
          throw new Error('No image pairs found for given inputs')
        }

        this.pairs = response.data.map(d => {
          d.left.timestamp = new Date(d.left.timestamp)
          d.left.hour = this.$luxon.DateTime.fromJSDate(d.left.timestamp).setZone(this.station.timezone).hour
          d.right.timestamp = new Date(d.right.timestamp)
          d.right.hour = this.$luxon.DateTime.fromJSDate(d.right.timestamp).setZone(this.station.timezone).hour
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
        this.pairsStationId = this.station.id
        if (this.pairs.length > 0) {
          this.currentIndex = 0
        }
      } catch (err) {
        console.error(err)
        this.error.station = err.message || err.toString()
        evt.$emit('notify', 'error', 'Failed to get image pairs for selected station')
      } finally {
        this.loading.station = false
      }
    },
    async fetchTrainingPairs () {
      this.loading.training = true
      this.error.training = null
      this.pairs = []
      this.pairsStationId = null
      try {
        let url = '/annotations/training'
        let response = await this.$http.restricted.get(url)

        if (!response.status === 200 || !response.data.url) {
          throw new Error('Failed to get training dataset')
        }

        url = fixDataUrl(response.data.url)
        response = await this.$http.external.get(url)
        if (!response.status === 200 || !response.data.pairs) {
          throw new Error('Failed to get training dataset')
        }

        const { station_id: stationId, pairs } = response.data

        response = await this.$http.restricted.get(`/stations/${stationId}`)
        const station = response.data

        if (!station) {
          throw new Error('Failed to get station')
        }
        this.selectStation(station)
        this.variable = this.variables[0]

        this.pairs = pairs.map(d => {
          d.left.timestamp = new Date(d.left.timestamp)
          d.left.hour = this.$luxon.DateTime.fromJSDate(d.left.timestamp).setZone(this.station.timezone).hour
          d.right.timestamp = new Date(d.right.timestamp)
          d.right.hour = this.$luxon.DateTime.fromJSDate(d.right.timestamp).setZone(this.station.timezone).hour
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
        this.pairsStationId = station.id
        if (this.pairs.length > 0) {
          this.currentIndex = 0
        }

        // Create initial annotation record with IN_PROGRESS status
        const payload = {
          user_id: this.user.username,
          training: true,
          flag: true,
          station_id: station.id,
          variable: this.variable?.value || 'FLOW',
          training_total: pairs.length,
          training_completed: 0,
          training_dataset_url: url,
          status: 'IN_PROGRESS',
          duration_sec: 0,
          n: 0,
          n_daytime: 0
        }

        const annotationResponse = await this.$http.restricted.post('/annotations', payload)
        this.resumeAnnotation = annotationResponse.data

        // Start auto-saving
        this.startAutoSave()
      } catch (err) {
        console.error(err)
        this.error.training = err.message || err.toString()
        evt.$emit('notify', 'error', 'Failed to start training')
      } finally {
        this.loading.training = false
      }
    },
    prevPair () {
      this.error.annotation = null
      this.currentIndex -= 1
    },
    nextPair () {
      this.error.submit = null
      if (!this.currentPair.rank) {
        this.error.annotation = 'Select an option for which photo has more of the variable of interest.'
        return
      }
      if (this.currentIndex < this.pairs.length - 1) {
        this.error.annotation = null
        this.currentIndex += 1
      }
    },
    reset () {
      this.variable = this.variables[0]
      this.pairs = []
      this.pairsStationId = null
      this.error.start = null
      this.error.station = null
      this.error.annotation = null
      this.error.submit = null
      this.currentIndex = null
      this.submitEarly = false
      this.startedAt = new Date()

      // Clear resume state
      this.resumeAnnotation = null
      this.canResume = false
      this.isResuming = false
      this.lastSavedCount = 0
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval)
        this.autoSaveInterval = null
      }
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
        // Clear auto-save on final submit
        if (this.autoSaveInterval) {
          clearInterval(this.autoSaveInterval)
          this.autoSaveInterval = null
        }

        const finishedAt = new Date()
        const durationSeconds = (finishedAt.valueOf() - this.startedAt.valueOf()) / 1000
        const payload = {
          user_id: this.user.username,
          training: this.showTraining,
          flag: this.showTraining,
          station_id: this.pairsStationId,
          variable: this.variable?.value || null,
          duration_sec: durationSeconds,
          n: this.completedPairs.length,
          n_daytime: this.completedPairs
            .filter(d => {
              return d.left.image.hour >= 7 &&
                     d.left.image.hour <= 18 &&
                     d.right.image.hour >= 7 &&
                     d.right.image.hour <= 18
            }).length
        }

        // Use existing annotation if available (training mode)
        let annotation
        if (this.resumeAnnotation) {
          annotation = this.resumeAnnotation
        } else {
          const response = await this.$http.restricted.post('/annotations', payload)
          annotation = response.data
        }

        const s3Response = await this.uploadFile(annotation)
        const updatePayload = {
          status: 'DONE',
          training_completed: this.completedPairs.length,
          ...payload,
          ...s3Response
        }
        await this.$http.restricted.put(`/annotations/${annotation.id}`, updatePayload)

        if (this.showTraining) {
          evt.$emit('notify', 'success', 'Annotations have been submitted')
          const dbUser = { ...this.dbUser, training_complete: true }
          store.dispatch('setDbUser', dbUser)
        } else {
          this.station.n_annotations += payload.n
          this.station.n_annotations_daytime += payload.n_daytime
          evt.$emit('notify', 'success', 'Annotations have been saved')
        }
        this.reset()
      } catch (err) {
        console.error(err)
        this.error.submit = err.message || err.toString()
        evt.$emit('notify', 'error', 'Failed to submit annotations')
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
      if (!this.variable) {
        this.error.start = 'Select a variable to annotate from the dropdown above'
        return
      }
      const nPairs = parseInt(this.nPairs)
      if (isNaN(nPairs) || nPairs <= 0 || nPairs > 10000) {
        this.error.start = 'Number of annotations must be between 1 and 10,000'
        return
      }
      const minHour = parseInt(this.minHour)
      const maxHour = parseInt(this.maxHour)
      if (!isNaN(minHour) && (minHour < 0 || minHour > 23)) {
        this.error.start = 'Minimum hour must be an integer between 0 and 23'
        return
      }
      if (!isNaN(maxHour) && (maxHour < 0 || maxHour > 23)) {
        this.error.start = 'Maximum hour must be an integer between 0 and 23'
        return
      }
      if (!isNaN(minHour) && !isNaN(maxHour) && minHour > maxHour) {
        this.error.start = 'Minimum hour cannot be more than maximum hour'
        return
      }
      if (this.minDate) {
        const minDate = new Date(this.minDate)
        if (isNaN(minDate.valueOf())) {
          this.error.start = 'Minimum date is not valid, must be in YYYY-MM-DD format'
          return
        }
      }
      if (this.maxDate) {
        const maxDate = new Date(this.maxDate)
        if (isNaN(maxDate.valueOf())) {
          this.error.start = 'Maximum date is not valid, must be in YYYY-MM-DD format'
          return
        }
      }
      if (this.minDate && this.maxDate) {
        const minDate = new Date(this.minDate)
        const maxDate = new Date(this.maxDate)
        if (minDate.valueOf() > maxDate.valueOf()) {
          this.error.start = 'Minimum date cannot be after maximum date'
          return
        }
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
    },
    startTraining () {
      // Clear resume state when explicitly starting fresh
      this.canResume = false
      this.resumeAnnotation = null
      this.fetchTrainingPairs()
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

/* Add this new style for the table rows */
.v-data-table__wrapper tbody tr {
  cursor: pointer;
}
</style>
