<template>
  <div style="height:100%;min-height:100px">
    <div v-if="loading.images" style="position:relative;height:100%">
      <v-overlay absolute color="grey lighten-2">
        <div class="text-h3 text-center grey--text">
          <div>
            Loading
          </div>
          <v-progress-circular
            color="grey"
            indeterminate
            size="32"
            width="4"
            class="mt-8"
          ></v-progress-circular>
        </div>
      </v-overlay>
    </div>
    <div v-else-if="error" class="px-4 pb-4">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Failed to Get Station Photos and Data</div>
        <div>{{ error }}</div>
      </v-alert>
    </div>
    <div v-else>
      <!-- IMAGES -->
      <v-container class="mt-n4 pt-0">
        <v-row align="stretch" class="mt-0">
          <v-col cols="12" md="7">
            <div class="elevation-1 pa-2">
              <div
                v-if="!hover || !hover.image"
                class="d-flex flex-column justify-center align-center"
                style="width:100%;min-height:300px;background-color:rgb(0,0,0,0.05)"
              >
                <div>
                  <v-icon x-large>mdi-image-outline</v-icon>
                </div>
                <div class="text-h6 text--secondary mt-4">
                  Flow Photo
                </div>
              </div>
              <div
                v-else-if="imageError"
                class="d-flex flex-column justify-center align-center"
                style="width:100%;height:300px;background-color:rgb(0,0,0,0.05)"
              >
                <div>
                  <v-icon x-large>mdi-image-off-outline</v-icon>
                </div>
                <div class="text-h6 text--secondary mt-4">
                  Photo Unavailable
                </div>
              </div>
              <canvas ref="canvas" width="385" height="303" v-show="!!hover && hover.image && !imageError" @click="showImage(hover.image)" style="cursor:pointer"></canvas>
              <ImageDialog ref="imageDialog"></ImageDialog>
            </div>
          </v-col>
          <v-col cols="12" md="5">
            <div v-if="hover && !$vuetify.breakpoint.mobile">
              <v-simple-table dense class="my-0 black--text" v-if="hover.mode === 'daily'" style="white-space: nowrap">
                <tbody>
                  <tr>
                    <td class="py-2 pl-0">
                      <div class="text-subtitle-2 text--secondary">Date</div>
                      <div class="font-weight-bold">{{ hover.dateUtc | timestampFormat('ll') }}</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="py-2 pl-0">
                      <div class="text-subtitle-2 text--secondary">Photo Timestamp</div>
                      <div class="font-weight-bold">
                        {{ $date(hover.image.timestamp).tz(station.timezone) | timestampFormat('lll z') }}
                      </div>
                    </td>
                  </tr>
                  <tr v-if="variableId">
                    <td class="py-2 pl-0">
                      <div class="text-subtitle-2 text--secondary">Obs. Daily Mean {{ variable.selected.label }}</div>
                      <div v-if="hover.value" class="font-weight-bold">
                        {{ hover.value.mean | d3Format('.3r') }} {{ variable.selected.id === 'OTHER' ? '' : variable.selected.units }}
                        <span v-if="hover.nwis">(FPE)</span>
                      </div>
                      <div v-if="hover.nwis" class="font-weight-bold">
                        {{ hover.nwis.mean | d3Format('.3r') }}
                        {{ variable.selected.id !== 'OTHER' ? variable.selected.units : '' }}
                        (NWIS)
                      </div>
                      <div v-if="!hover.value && !hover.nwis" class="font-weight-bold">
                        N/A
                      </div>
                    </td>
                  </tr>
                  <tr v-if="isFinite(hover.p)">
                    <td class="py-2 pl-0">
                      <div class="text-subtitle-2 text--secondary">
                        Percentile of Daily Mean {{ variable.selected.label }}
                      </div>
                      <div class="font-weight-bold">
                        {{ hover.p * 100 | d3Format('.3r') }}%
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
              <v-simple-table dense class="my-0 black--text" v-else-if="hover.mode === 'instantaneous'">
                <tbody>
                  <tr>
                    <td class="py-2 pl-0">
                      <div class="text-subtitle-2 text--secondary">Photo Timestamp</div>
                      <div class="font-weight-bold">
                        {{ hover.image.timestamp | timestampFormat('lll z') }}
                      </div>
                    </td>
                  </tr>
                  <tr v-if="variableId">
                    <td class="py-2 pl-0">
                      <div class="text-subtitle-2 text--secondary">Obs. {{ variable.selected.label }}</div>
                      <div v-if="hover.value" class="font-weight-bold">
                        {{ hover.value | d3Format('.3r') }} {{ variable.selected.id === 'OTHER' ? '' : variable.selected.units }}
                        <span v-if="hover.nwis">(FPE)</span>
                      </div>

                      <div v-if="hover.nwis" class="font-weight-bold">
                        {{ hover.nwis | d3Format('.3r') }}
                        {{ variable.selected.id !== 'OTHER' ? variable.selected.units : '' }}
                        (NWIS)
                      </div>
                      <div v-if="!hover.value && !hover.nwis" class="font-weight-bold">
                        N/A
                      </div>
                    </td>
                  </tr>
                  <tr v-if="isFinite(hover.p)">
                    <td class="py-2 pl-0">
                      <div class="text-subtitle-2 text--secondary">
                        Percentile of Instantaneous {{ variable.selected.label }}
                      </div>
                      <div class="font-weight-bold">
                        {{ hover.p * 100 | d3Format('.3r') }}%
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
              <v-alert
                type="error"
                text
                dense
                colored-border
                border="left"
                class="body-2 mb-0 mt-0"
                v-else
              >
                <div class="font-weight-bold body-1">Something Went Wrong</div>
                <div>Hmm, there should be an image, but the data are not available</div>
              </v-alert>
              <v-divider></v-divider>
              <v-alert
                type="error"
                text
                dense
                colored-border
                border="left"
                class="body-2 mb-0 mt-4"
                v-if="!!imageError"
              >
                <div class="font-weight-bold body-1">Failed to Load Image</div>
              </v-alert>
            </div>
            <div v-else>
              <v-alert
                color="info"
                border="left"
                colored-border
                text
                dense
                class="body-2 mb-0 pr-0"
              >
                <p>
                  Hover over <span class="font-weight-bold" v-if="tab === 0">Timeseries</span><span class="font-weight-bold" v-else-if="tab === 1">Distribution</span> plot below to view photos.
                </p>
                <p>
                  Click and drag over the <span class="font-weight-bold">Time Period</span> chart to focus on a specific period.
                </p>
                <p class="mb-0">
                   Charts show <span class="font-weight-bold">daily</span> (mid-day) photos and mean/range of selected variable when time period &gt; 30 days. Select a shorter period to view all <span class="font-weight-bold">instantaneous</span> photos and data.
                </p>
              </v-alert>
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="7" class="pt-0">
            <v-row>
              <v-col cols="3">
                <v-btn
                  block
                  rounded
                  color="primary"
                  @click="startAutoplay()"
                  v-if="!player.playing"
                >
                  <v-icon small>mdi-play</v-icon> Play
                </v-btn>
                <v-btn
                  block
                  rounded
                  color="primary"
                  @click="stopAutoplay()"
                  v-else
                >
                  <v-icon small>mdi-stop</v-icon> Stop
                </v-btn>
              </v-col>
              <v-col cols="9">
                <v-slider
                  v-model="player.speed"
                  label="Speed"
                  min="0.5"
                  max="50"
                  step="0.1"
                  hide-details
                ></v-slider>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>

      <v-divider></v-divider>

      <!-- CHARTS -->
      <v-container>
        <div class="d-flex">
          <v-tabs
            v-model="tab"
          >
            <v-tab>
              Timeseries
            </v-tab>
            <v-tab>
              Distribution
            </v-tab>
          </v-tabs>
          <v-spacer></v-spacer>
          <v-select
            :items="variableOptions"
            v-model="variable.selected"
            label="Select variable"
            item-text="label"
            item-value="value"
            hide-details
            dense
            mandatory
            return-object
            class="mt-4"
            v-if="!$vuetify.breakpoint.mobile"
          ></v-select>
        </div>

        <div v-if="$vuetify.breakpoint.mobile">
          <v-select
            :items="variableOptions"
            v-model="variable.selected"
            label="Select variable"
            item-text="label"
            item-value="value"
            hide-details
            dense
            mandatory
            return-object
            class="mt-8 mb-2"
          ></v-select>
        </div>

        <v-tabs-items v-model="tab">
          <v-tab-item>
            <div class="
              text-subtitle-1
              font-weight-bold
              text--secondary
              mt-2
              d-flex"
            >
              <div>Timeseries for Selected Period</div>
              <v-spacer></v-spacer>
              <div>
                <span class="font-weight-regular">Mode:</span> <span v-if="mode === 'daily'">Daily</span><span v-else>Instantaneous</span>
              </div>
              <v-tooltip bottom max-width="400px">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    icon
                    x-small
                    v-bind="attrs"
                    v-on="on"
                    class="mt-1"
                  >
                    <v-icon small>mdi-help-circle</v-icon>
                  </v-btn>
                </template>
                <div class="body-1">
                  <div v-if="mode === 'daily'">
                    Showing <strong>daily mean and range (min/max)</strong> of selected variable, and only <strong>one image per day</strong> (closest to midday).
                  </div>
                  <div v-else>
                    Showing <strong>all instantaneous values</strong> of selected variable, and <strong>all images</strong> on each day.
                  </div>

                  <div v-if="mode === 'daily'" class="mt-2">
                    <strong>To view all data and images</strong>, select a shorter time period (≤ 30 days).
                  </div>
                </div>
              </v-tooltip>
            </div>

            <div class="text-body-2 secondary--text mb-2 mt-0 pt-0">
              <i>Hover to view each photo.</i>
            </div>

            <TimeseriesChart
              :station="station"
              :variable="variable.selected"
              :daily="daily"
              :instantaneous="instantaneous"
              :mode="mode"
              :focus="focus"
              :hover="hover"
              :play="tab === 0 && player.playing"
              :speed="player.speed"
              @hover="setHover"
            ></TimeseriesChart>

            <v-overlay color="grey lighten-2" absolute v-if="loading.instantaneous" class="text-center">
              <div class="text-h5 text-center grey--text">
                <div>
                  Loading
                </div>
                <v-progress-circular
                  color="grey"
                  indeterminate
                  size="32"
                  width="4"
                  class="mt-2"
                ></v-progress-circular>
              </div>
            </v-overlay>
          </v-tab-item>
          <v-tab-item>
            <div class="text-subtitle-1 font-weight-bold text--secondary mt-2 d-flex">
              <div>Cumulative Distribution for Select Period</div>
              <v-spacer></v-spacer>
              <div>
                <span class="font-weight-regular">Mode:</span> <span v-if="mode === 'daily'">Daily</span><span v-else>Instantaneous</span>
              </div>
              <v-tooltip bottom max-width="400px" v-if="variable.selected.value">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    icon
                    x-small
                    v-bind="attrs"
                    v-on="on"
                    class="mt-1"
                  >
                    <v-icon small>mdi-help-circle</v-icon>
                  </v-btn>
                </template>
                <div class="body-1">
                  <div v-if="mode === 'daily'">
                    <p>
                      Cumulative distribution of <strong>daily mean</strong> values <strong>during selected time period</strong>.
                    </p>
                    <p>
                      Only <strong>one photo</strong> (closest to midday) is shown per day based on the daily mean value of that day.
                    </p>
                  </div>
                  <div v-else>
                    <p>
                      Cumulative distribution of <strong>instantaneous values</strong> and <strong>all photos</strong> during selected time period.
                    </p>
                    <p>
                      For each photo, flow/stage value is estimated by linear interpolation based on the photo timestamp. Values used for interpolation must be measured within one hour of photo.
                    </p>
                  </div>
                </div>
              </v-tooltip>
            </div>

            <div class="text-body-2 secondary--text mb-2 mt-0 pt-0">
              <i>Hover to view each photo.</i>
            </div>

            <DistributionChart
              :station="station"
              :variable="variable.selected"
              :daily="daily"
              :instantaneous="instantaneous"
              :mode="mode"
              :focus="focus"
              :hover="hover"
              :play="tab === 1 && player.playing"
              :speed="player.speed"
              :nwis="!!station.nwis_id"
              @hover="setHover"
            ></DistributionChart>
            <div v-if="station.nwis_id" class="body-2">
              Note: Distribution computed using only data from NWIS.
            </div>

            <v-overlay color="grey lighten-2" absolute v-if="loading.instantaneous" class="text-center">
              <div class="text-h5 text-center grey--text">
                <div>
                  Loading
                </div>
                <v-progress-circular
                  color="grey"
                  indeterminate
                  size="32"
                  width="4"
                  class="mt-2"
                ></v-progress-circular>
              </div>
            </v-overlay>
          </v-tab-item>
        </v-tabs-items>

        <v-divider class="my-2"></v-divider>
        <div class="text-subtitle-1 font-weight-bold text--secondary mt-2 d-flex">
          <span>Select a Time Period</span>
          <v-spacer></v-spacer>
          <div>
            <span class="font-weight-regular">Selected:</span>
            <span v-if="focus && (this.daily.values.length > 0 || this.daily.nwis.length > 0)">
              {{ focus[0] | timestampLocalFormat(station.timezone, 'll') }} -
              {{ focus[1] | timestampLocalFormat(station.timezone, 'll') }}
              ({{ $date(focus[1]).diff($date(focus[0]), 'day') + 1 }} days)
            </span>
            <span v-else>None</span>
          </div>
          <v-tooltip bottom max-width="400px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                x-small
                v-bind="attrs"
                v-on="on"
                class="mt-1"
              >
                <v-icon small>mdi-help-circle</v-icon>
              </v-btn>
            </template>
            <p class="body-1">
              Click and drag to select a time period. Click outside the period to reset.
            </p>
            <p class="body-1 mb-0">
              Select a time period ≤ 30 days to view <span class="font-weight-bold">instantaneous</span> photos and data in the <span class="font-weight-bold">Timeseries</span> and <span class="font-weight-bold">Distribution</span> plots.
            </p>
          </v-tooltip>
        </div>
        <div class="text-body-2 secondary--text mb-2 mt-0 pt-0">
          <i>Click and drag to focus on a shorter period of time.</i>
        </div>
        <ContextChart
          :station="station"
          :variable="variable.selected"
          :daily="daily"
          @brush="setFocus"
        ></ContextChart>

        <v-row v-if="provisional" class="my-0 py-0">
          <v-col class="py-0">
            <v-alert
              color="error"
              dense
              text
              colored-border
              border="left"
              class="mb-0 mt-2 body-2"
            >
              <div class="font-weight-bold body-1 d-flex align-center">
                <v-icon color="error" left>mdi-alert</v-icon>
                <div class="body-2 font-weight-medium">Charts May Contain Provisional Data</div>
                <v-spacer></v-spacer>
                <v-btn xs text color="default" @click="$refs.provisionalDialog.open()">Read More</v-btn>
              </div>
            </v-alert>

            <InfoDialog title="Provisional Data Statement" ref="provisionalDialog">
              <p>Data are provisional and subject to revision until they have been thoroughly reviewed and received final approval. Current condition data relayed by satellite or other telemetry are automatically screened to not display improbable values until they can be verified.</p>

              <p>Provisional data may be inaccurate due to instrument malfunctions or physical changes at the measurement site. Subsequent review based on field inspections and measurements may result in significant revisions to the data.</p>

              <p class="mb-0">Data users are cautioned to consider carefully the provisional nature of the information before using it for decisions that concern personal or public safety or the conduct of business that involves substantial monetary or operational consequences. Information concerning the accuracy and appropriate uses of these data or concerning other hydrologic data may be obtained from the USGS.</p>
            </InfoDialog>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
import { interpolateValuesAtTimestamp } from '@/lib/utils'
import { variables } from '@/lib/constants'
import nwis from '@/lib/nwis'

import ImageDialog from '@/components/ImageDialog'
import InfoDialog from '@/components/InfoDialog'
import ContextChart from '@/components/charts/ContextChart'
import TimeseriesChart from '@/components/charts/TimeseriesChart'
import DistributionChart from '@/components/charts/DistributionChart'

export default {
  name: 'StationViewer',
  props: ['station'],
  components: {
    ImageDialog,
    ContextChart,
    TimeseriesChart,
    DistributionChart,
    InfoDialog
  },
  data () {
    return {
      loading: {
        images: true,
        values: true,
        instantaneous: false
      },
      error: null,
      imageError: false,
      tab: 0,
      daily: {
        images: [],
        values: [],
        nwis: []
      },
      instantaneous: null,
      mode: 'daily',
      focus: null,
      hover: null,
      variable: {
        selected: null
      },
      provisional: false,
      queue: [],
      drawing: false,
      aspectRatio: null,
      player: {
        playing: false,
        speed: 25
      }
    }
  },
  computed: {
    variableOptions () {
      const options = [
        {
          id: null,
          label: 'None (Photos Only)',
          name: 'None',
          units: null
        }
      ]
      if (!this.station) {
        return options
      } else if (!this.station.summary.values || this.station.summary.values.n_rows === 0) {
        if (!!this.station.nwis_id) {
          options.push(variables.find(d => d.id === 'FLOW_CFS'))
        }
        return options
      } else {
        const stationVariableIds = this.station.summary.values.variables.map(d => d.variable_id)
        if (!stationVariableIds.includes('FLOW_CFS') && !!this.station.nwis_id) {
          options.push(variables.find(d => d.id === 'FLOW_CFS'))
        }
        variables.forEach(v => {
          if (stationVariableIds.includes(v.id)) {
            options.push(v)
          }
        })
      }
      return options
    },
    variableId () {
      if (!this.variable.selected || !this.variable.selected.id) return null
      return this.variable.selected.id
    },
    focusUtc () {
      if (!this.focus) return this.focus
      return this.focus.map(d => this.$date(d).tz(this.station.timezone).utc(true))
    }
  },
  mounted () {
    this.init()
  },
  watch: {
    variableOptions (options) {
      this.autoselectVariable()
    },
    variableId () {
      // workaround to trigger timeseries chart update
      this.fetchDaily()
      this.setFocus(this.focus ? [...this.focus] : this.focus)
    },
    tab () {
      this.setHover()
      this.stopAutoplay()
    },
    focus () {
      this.stopAutoplay()
    }
  },
  methods: {
    init () {
      this.autoselectVariable()
      this.fetchDaily()
    },
    autoselectVariable () {
      const values = this.variableOptions.map(d => d.id)
      if (values.includes('FLOW_CFS') || !!this.station.nwis_id) {
        this.variable.selected = this.variableOptions.find(d => d.id === 'FLOW_CFS')
      } else if (values && values.length > 0) {
        this.variable.selected = this.variableOptions.find(d => d.id === values[0])
      } else {
        this.variable.selected = this.variableOptions.find(d => d.id === null)
      }
    },
    async fetchDaily () {
      this.loading.images = true
      this.loading.values = true
      this.error = null
      this.provisional = this.station.provisional
      try {
        await this.fetchDailyImages()
        await this.fetchDailyValues()
        await this.fetchDailyNwis()
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading.images = false
        this.loading.values = false
      }
    },
    async fetchDailyValues () {
      this.provisional = this.station.provisional
      const variableId = this.variable.selected.id
      this.daily.values = []
      if (this.daily.images.length > 0) {
        const startDate = this.daily.images[0].date
        const endDate = this.daily.images[this.daily.images.length - 1].date
        const values = await this.$http.public
          .get(`/stations/${this.station.id}/daily/values?variableId=${variableId}&start=${startDate}&end=${endDate}`)
          .then(d => d.data)
        values.forEach(d => {
          d.dateUtc = this.$date.utc(d.date)
          d.dateLocal = this.$date.tz(d.date, this.station.utczone)
        })
        this.daily.values = Object.freeze(values)
      }
    },
    async fetchDailyNwis () {
      const variableId = this.variable.selected.id
      this.daily.nwis = []
      if (this.daily.images.length > 0 && variableId === 'FLOW_CFS' && !!this.station.nwis_id) {
        const startDate = this.daily.images[0].date
        const endDate = this.daily.images[this.daily.images.length - 1].date
        const nwisValues = await nwis.getDailyFlows(this.station.nwis_id, startDate, endDate)
        nwisValues.forEach(d => {
          d.dateUtc = this.$date.utc(d.date)
          d.dateLocal = this.$date.tz(d.date, this.station.utczone)
        })
        if (nwisValues.some(d => d.provisional)) {
          this.provisional = true
        }
        this.daily.nwis = Object.freeze(nwisValues)
      } else {
        this.daily.nwis = []
      }
    },
    async fetchDailyImages () {
      const images = await this.$http.public
        .get(`/stations/${this.station.id}/daily/images`)
        .then(d => d.data)

      images.forEach(d => {
        d.dateUtc = this.$date.utc(d.date)
        d.dateLocal = this.$date.tz(d.date, this.station.utczone)
      })
      this.daily.images = Object.freeze(images)
    },
    async setFocus (focus) {
      if (!focus) return

      const deltaDays = this.$date(focus[1]).diff(this.$date(focus[0]), 'day')

      if (deltaDays <= 30) {
        const instantaneous = await this.fetchInstantaneous(focus)
        this.instantaneous = Object.freeze(instantaneous)
        this.mode = 'instantaneous'
      } else {
        this.instantaneous = null
        this.mode = 'daily'
      }
      this.focus = focus
    },
    async setHover (hover) {
      // console.log('setHover()', hover, this.queue.length)
      const nextInQueue = this.queue.length ? this.queue[this.queue.length - 1] : null

      if (nextInQueue && hover) {
        // hover is already at end of queue
        if (nextInQueue.image.id === hover.image.id) return
      } else if (this.hover && hover) {
        // hover is already being shown
        if (this.hover.image.id === hover.image.id) return
      }

      this.queue.push(hover)

      if (!this.drawing) {
        this.drawImage()
      }
    },
    shiftQueue () {
      if (this.queue.length > 0) {
        this.queue.shift()
      }
      if (this.queue.length > 5) {
        this.queue.splice(0, this.queue.length - 5)
      }
    },
    drawImage () {
      if (!this.$refs.canvas) return
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')

      const hover = this.queue.length && this.queue[0]

      this.imageError = false
      this.drawing = true
      if (!hover || !hover.image) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.hover = null
        this.shiftQueue()
        if (this.queue.length > 0) {
          this.drawImage()
        } else {
          this.drawing = false
        }
      } else {
        const imageElement = new Image()
        imageElement.crossOrigin = 'anonymous'
        imageElement.onload = () => {
          if (!this.aspectRatio) {
            this.aspectRatio = imageElement.width / imageElement.height
            // canvas.height = canvas.width / this.aspectRatio
            canvas.setAttribute('width', canvas.parentElement.clientWidth + 'px')
            canvas.setAttribute('height', Math.floor(canvas.parentElement.clientWidth / this.aspectRatio) + 'px')
          }
          ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
          this.hover = hover
          this.shiftQueue()
          // this.drawImage()
          if (this.queue.length > 0) {
            this.drawImage()
          } else {
            this.drawing = false
          }
        }
        imageElement.onerror = (err) => {
          console.log(err)
          this.hover = hover
          this.imageError = true
          this.shiftQueue()
          if (this.queue.length > 0) {
            this.drawImage()
          } else {
            this.drawing = false
          }
        }
        imageElement.src = hover.image.thumb_url
      }
    },
    async fetchInstantaneous (focus) {
      this.loading.instantaneous = true
      try {
        const images = await this.fetchInstantaneousImages(focus)
        const values = await this.fetchInstantaneousValues(focus)
        const nwis = await this.fetchInstantaneousNwis(focus)

        if (values.length > 0) {
          images.forEach(d => {
            d.value = interpolateValuesAtTimestamp(values, d.timestamp)
          })
        }
        if (nwis.length > 0) {
          images.forEach((d, i) => {
            d.nwis = interpolateValuesAtTimestamp(nwis, d.timestamp)
          })
        }
        return { images, values, nwis }
      } catch (err) {
        console.error(err)
      } finally {
        this.loading.instantaneous = false
      }
    },
    async fetchInstantaneousImages (focus) {
      if (!focus) return []
      const url = `/stations/${this.$route.params.stationId}/images`
      const response = await this.$http.public.get(url, {
        params: {
          // start: this.$date(focus[0]).subtract(1, 'day').toISOString(),
          // end: this.$date(focus[1]).add(1, 'day').toISOString()
          start: this.$date(focus[0]).toISOString(),
          end: this.$date(focus[1]).toISOString()
        }
      })
      const images = response.data
      images.forEach(d => {
        d.timestampRaw = d.timestamp
        d.timestamp = this.$date(d.timestamp).tz(this.station.timezone)
        d.timestampUtc = this.$date(d.timestampRaw).add(d.timestamp.utcOffset() / 60, 'hour').toDate()
      })
      return images.filter(d => d.timestamp.isBetween(focus[0], focus[1], null, '[]'))
    },
    async fetchInstantaneousValues (focus) {
      if (!this.variableId || !focus) return []
      const url = `/stations/${this.$route.params.stationId}/values`
      const response = await this.$http.public.get(url, {
        params: {
          variable: this.variableId,
          start: this.$date(focus[0]).subtract(1, 'day').toISOString(),
          end: this.$date(focus[1]).add(1, 'day').toISOString()
        }
      })
      const values = response.data
      values.forEach((d, i) => {
        d.timestampRaw = d.timestamp
        d.timestamp = this.$date(d.timestamp).tz(this.station.timezone)
        d.timestampUtc = this.$date(d.timestampRaw).add(d.timestamp.utcOffset() / 60, 'hour')
      })
      return values
    },
    async fetchInstantaneousNwis (focus) {
      if (!this.variableId || !focus || !this.station.nwis_id) return []

      const startDate = this.$date(focus[0]).subtract(1, 'day').toISOString().substr(0, 10)
      const endDate = this.$date(focus[1]).add(1, 'day').toISOString().substr(0, 10)
      const values = await nwis.getInstantaneousFlows(this.station.nwis_id, startDate, endDate)
      values.forEach((d, i) => {
        d.timestampRaw = d.timestamp
        d.timestamp = this.$date(d.timestamp).tz(this.station.timezone)
        d.timestampUtc = this.$date(d.timestampRaw).add(d.timestamp.utcOffset() / 60, 'hour')
      })
      return values
    },
    async showImage (image) {
      if (!image || !image.id) return

      try {
        const response = await this.$http.public.get(`/images/${image.id}`)
        await this.$refs.imageDialog.open(response.data, this.station)
      } catch (err) {
        console.log(err)
      }
    },
    startAutoplay () {
      this.player.playing = true
    },
    stopAutoplay () {
      this.player.playing = false
      this.queue = []
    }
  }
}
</script>
