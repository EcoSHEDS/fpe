<template>
  <div class="pt-4" style="min-height: 400px">
    <v-overlay v-if="loading" absolute class="rounded">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <div v-else-if="error" class="px-4">
      <Alert type="error" title="Server Error">
        <div>There was an error loading the station.</div>
        <div class="mt-4 font-weight-bold">{{ error }}</div>
      </Alert>
    </div>
    <div v-else>
      <div class="text-center">
        <canvas ref="image" class="elevation-4"></canvas>
      </div>

      <div style="max-width: 600px;" class="d-flex mx-auto my-4">
        <v-btn
          rounded
          outlined
          color="primary"
          @click="prevImage"
          :disabled="player.playing"
          class="mx-1"
          title="Previous Image"
        >
          <v-icon>mdi-menu-left</v-icon> Prev
        </v-btn>
        <v-btn
          rounded
          outlined
          color="primary"
          @click="nextImage"
          :disabled="player.playing"
          class="mx-1"
          title="Next Image"
        >
          <v-icon>mdi-menu-right</v-icon> Next
        </v-btn>
        <v-divider vertical class="mx-4"></v-divider>
        <v-btn
          v-if="!player.playing"
          rounded
          outlined
          color="primary"
          @click="startPlaying"
          title="Start Playing"
        >
          <v-icon small>mdi-play</v-icon> Play
        </v-btn>
        <v-btn
          v-else
          rounded
          color="error"
          @click="stopPlaying"
          title="Stop Playing"
        >
          <v-icon small>mdi-stop</v-icon> Stop
        </v-btn>
        <v-slider
          v-model="player.speed"
          color="black"
          label="Speed"
          min="1"
          max="100"
          step="1"
          hide-details
          class="ml-4"
          title="Animation Speed"
        ></v-slider>
      </div>

      <!-- <div v-if="image">
        <pre>{{ timeRange }}</pre>
        <pre>{{ imagesInTimeRange.length }}</pre>
      </div> -->

      <div class="mt-4" style="padding-left:1px">
        <v-tabs v-model="tab" background-color="grey lighten-4">
          <v-tab>Timeseries</v-tab>
          <v-tab>Distributions</v-tab>
          <v-tab>Scatterplots</v-tab>
          <!-- <v-tab>Models</v-tab> -->
          <v-spacer></v-spacer>

          <v-divider vertical class="mx-4"></v-divider>
          <div style="width:300px;margin-top:8px;" class="pr-4">
            <v-select
              v-model="selectedSeries"
              :items="series"
              item-text="name"
              placeholder="Select variable(s)"
              multiple
              return-object
              hide-details
              dense
              menu-props="offsetY"
              style="margin-bottom:8px"
            >
              <template v-slot:selection="{ index }">
                <span
                  v-if="index === 0"
                >
                  {{ selectedSeries.length }} variables selected
                </span>
              </template>
            </v-select>
          </div>
        </v-tabs>

        <v-tabs-items v-model="tab">
          <v-tab-item :transition="false">
            <PhotoTimeseriesChart
              v-if="ready"
              :loading="loadingData"
              :station="station"
              :images="images"
              :series="selectedSeries"
              :scale-values="scaleValues"
              :image="image"
              :mode="mode"
              :instantaneous="instantaneous"
              @hover="addImageToQueue"
              @zoom="setTimeRange"
              @update:scaleValues="scaleValues = $event"
              ref="chart"
            >
            </PhotoTimeseriesChart>
          </v-tab-item>
          <v-tab-item :transition="false">
            <DistributionChart
              v-if="ready"
              :station="station"
              :images="imagesInTimeRange"
              :series="selectedSeries"
              :image="image"
              :time-range="timeRange"
              :mode="mode"
              @hover="addImageToQueue"
            >
            </DistributionChart>
          </v-tab-item>
          <v-tab-item :transition="false">
            <ScatterplotChart
              v-if="ready"
              :station="station"
              :images="imagesInTimeRange"
              :series="selectedSeries"
              :scale-values="scaleValues"
              :image="image"
              :time-range="timeRange"
              :mode="mode"
              @hover="addImageToQueue"
              @update:scaleValues="scaleValues = $event"
            >
            </ScatterplotChart>
          </v-tab-item>
        </v-tabs-items>

        <v-divider class="mt-2"></v-divider>

        <div class="px-4 mt-4">
          <Alert type="error" color="grey darken-2" title="Provisional Data Statement">
            These data are preliminary or provisional and are subject to revision. They are being provided to meet the need for timely best science. The data have not received final approval by the U.S. Geological Survey (USGS) and are provided on the condition that neither the USGS nor the U.S. Government shall be held liable for any damages resulting from the authorized or unauthorized use of the data.
          </Alert>
        </div>
      </div>

      <!-- <div>
        <v-btn @click="save">Save PNG</v-btn>
        <v-btn @click="saveGif">Save GIF</v-btn>
      </div> -->
      <!-- <pre>hover: {{ image }}</pre> -->
    </div>
  </div>
</template>

<script>
import { rank, rollup, mean, max } from 'd3-array'
import { csv } from 'd3-fetch'
import { scaleUtc } from 'd3-scale'
import nwis from '@/lib/nwis'
import PhotoTimeseriesChart from '@/components/charts/PhotoTimeseriesChart'
import DistributionChart from '@/components/charts/DistributionChart'
import ScatterplotChart from '@/components/charts/ScatterplotChart'
// import { Canvg } from 'canvg'

const MODE_DAY_MINIMUM = 30 // minimum number of days for mode='DAY'

export default {
  name: 'StationPhotos',
  props: ['station'],
  components: {
    PhotoTimeseriesChart,
    DistributionChart,
    ScatterplotChart
  },
  data () {
    return {
      loading: true,
      loadingData: false,
      error: null,
      ready: false,
      tab: 0,

      scaleValues: false,

      image: null,
      images: [],
      series: [],
      selectedSeries: [],
      models: [],
      instantaneous: null,
      timeRange: null,
      timeRangeDuration: null,
      mode: 'DAY',

      queue: [],
      drawing: false,
      imageError: false,

      maxHeight: 400,
      imageAspectRatio: null,

      player: {
        timeout: null,
        playing: false,
        speed: 50
      }
    }
  },
  computed: {
    imagesInTimeRange () {
      if (!this.timeRange) return this.images
      if (this.mode === 'INST' && this.instantaneous) {
        return this.instantaneous.images.filter(d => d.timestamp >= this.timeRange[0] && d.timestamp <= this.timeRange[1])
      }
      return this.images.filter(d => d.dateUtc >= this.timeRange[0] && d.dateUtc <= this.timeRange[1])
    }
  },
  async mounted () {
    await this.init()
  },
  watch: {
    'player.speed' (val) {
      this.changeSpeed()
    }
  },
  methods: {
    async init () {
      this.loading = true
      this.error = null
      try {
        const images = await this.fetchDailyImages()
        // console.log(images[0])

        const startDate = images[0].date
        const endDate = images[images.length - 1].date

        const variableIds = this.station.summary.values.variables
          .map(d => d.variable_id)

        const models = await this.fetchModels()
        const series = await this.fetchDailySeries(variableIds, startDate, endDate, models)

        images.forEach(d => {
          d.values = []
          series.forEach(s => {
            const datum = s.data.find(v => v.date === d.date)
            d.values.push({
              variableId: s.variableId,
              name: s.name,
              source: s.source,
              value: datum?.value,
              rank: datum?.rank
            })
          })
        })

        this.images = Object.freeze(images)
        this.series = Object.freeze(series)
        this.selectedSeries = this.series.slice()
        this.models = Object.freeze(models)
        this.ready = true
        this.nextImage()
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    async fetchInstantaneous () {
      // console.log('fetchInstantaneous', this.timeRange)
      if (!this.timeRange) return

      this.loadingData = true

      const startDate = this.$date(this.timeRange[0]).subtract(1, 'day')
      const endDate = this.$date(this.timeRange[1]).add(1, 'day')

      const images = await this.fetchInstantaneousImages(startDate, endDate)
      const series = await this.fetchInstantaneousSeriesData(this.series, this.models, startDate, endDate)

      images.forEach(d => {
        d.values = []
      })
      series.forEach(s => {
        const values = s.data.filter(d => d.value !== null)
        const valueScale = scaleUtc(values.map(d => d.timestamp), values.map(d => d.value))
        const rankScale = scaleUtc(values.map(d => d.timestamp), values.map(d => d.rank))
        images.forEach(d => {
          const nextIndex = values.findIndex(v => v.timestamp >= d.timestamp)
          // only add if image timestamp within 60 minutes from prev or next value
          if (nextIndex > 0 &&
              ((values[nextIndex].timestamp - d.timestamp) < 60 * 60 * 1000) &&
              ((d.timestamp - values[nextIndex - 1].timestamp) < 60 * 60 * 1000)) {
            d.values.push({
              variableId: s.variableId,
              name: s.name,
              source: s.source,
              value: valueScale(d.timestamp),
              rank: rankScale(d.timestamp)
            })
          }
        })
      })

      // console.log('fetchInstantaneous: done')

      this.loadingData = false

      return {
        images,
        series
      }
    },
    async fetchInstantaneousImages (startDate, endDate) {
      const response = await this.$http.public.get(`/stations/${this.station.id}/images?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`)
      const images = response.data
      images.forEach(d => {
        d.timestamp = new Date(d.timestamp)
      })
      return images
    },
    async fetchInstantaneousSeriesData (series, models, startDate, endDate) {
      const instSeries = []
      for (const s of series) {
        if (s.source === 'FPE') {
          const values = await this.fetchInstantaneousValues(s.variableId, startDate, endDate)
          if (values.length > 0) {
            instSeries.push({
              variableId: s.variableId,
              name: `OBS. ${s.variableId} [FPE]`,
              source: 'FPE',
              data: values
            })
          }
        } else if (s.source === 'NWIS') {
          const values = await this.fetchInstantaneousNwisValues(this.station.nwis_id, startDate, endDate, s.variableId)
          if (values.length > 0) {
            instSeries.push({
              variableId: s.variableId,
              name: `OBS. ${s.variableId} [NWIS]`,
              source: 'NWIS',
              data: values
            })
          }
        }
      }
      for (const model of models) {
        const values = model.values.filter(d => d.timestamp >= startDate && d.timestamp <= endDate)
        instSeries.push({
          variableId: 'SCORE',
          name: `MODEL SCORE [${model.code}]`,
          source: 'MODEL',
          data: values
        })
      }

      instSeries.forEach(s => {
        const values = s.data.map(d => d.value)
        const ranks = rank(values)
        const maxRank = max(ranks)
        s.data.forEach((d, i) => {
          d.rank = ranks[i] / maxRank
        })
      })

      return instSeries
    },
    async fetchInstantaneousValues (variableId, startDate, endDate) {
      const response = await this.$http.public.get(`/stations/${this.station.id}/values?variable=${variableId}&start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`)
      const values = response.data
      // values.forEach(d => {
      //   d.dateUtc = this.$date.utc(d.date)
      //   d.dateLocal = this.$date.tz(d.date, this.station.timezone)
      //   d.value = d.mean
      // })
      return values
    },
    async fetchInstantaneousNwisValues (nwisId, startDate, endDate, variable) {
      const values = await nwis.getInstantaneousValues(nwisId, startDate.toISOString().substring(0, 10), endDate.toISOString().substring(0, 10), variable)
      // values.forEach(d => {
      //   d.dateUtc = this.$date.utc(d.date)
      //   d.dateLocal = this.$date.tz(d.date, this.station.timezone)
      //   d.value = d.mean
      // })
      return values
    },
    async fetchDailySeries (variableIds, startDate, endDate, models) {
      const series = []
      for (const variableId of variableIds) {
        const values = await this.fetchDailyValues(variableId, startDate, endDate)
        if (values.length > 0) {
          series.push({
            variableId,
            name: `OBS. ${variableId} [FPE]`,
            source: 'FPE',
            data: values
          })
        }
      }

      if (this.station.nwis_id) {
        const flowValues = await this.fetchDailyNwisValues(this.station.nwis_id, startDate, endDate, 'FLOW_CFS')
        if (flowValues.length > 0) {
          series.push({
            variableId: 'FLOW_CFS',
            name: 'OBS. FLOW_CFS [NWIS]',
            source: 'NWIS',
            data: flowValues
          })
        }
        const stageValues = await this.fetchDailyNwisValues(this.station.nwis_id, startDate, endDate, 'STAGE_FT')
        if (stageValues.length > 0) {
          series.push({
            variableId: 'STAGE_FT',
            name: 'OBS. STAGE_FT [NWIS]',
            source: 'NWIS',
            data: stageValues
          })
        }
      }

      if (models.length > 0) {
        models.forEach(model => {
          series.push({
            variableId: 'SCORE',
            name: `MODEL SCORE [${model.code}]`,
            source: 'MODEL',
            data: model.dailyValues.filter(d => d.date >= startDate && d.date <= endDate)
          })
        })
      }

      series.forEach(s => {
        const values = s.data.map(d => d.value)
        const ranks = rank(values)
        const maxRank = max(ranks)
        s.data.forEach((d, i) => {
          d.rank = ranks[i] / maxRank
        })
      })

      return series
    },
    async fetchDailyImages () {
      const response = await this.$http.public.get(`/stations/${this.station.id}/daily/images`)
      const images = response.data
      return images.map(d => ({
        ...d.image,
        date: d.date,
        dateUtc: this.$date.utc(d.date),
        dateLocal: this.$date.tz(d.date, this.station.timezone)
      }))
    },
    async fetchDailyValues (variableId, startDate, endDate) {
      const response = await this.$http.public.get(`/stations/${this.station.id}/daily/values?variableId=${variableId}&start=${startDate}&end=${endDate}`)
      const values = response.data
      values.forEach(d => {
        d.dateUtc = this.$date.utc(d.date)
        d.dateLocal = this.$date.tz(d.date, this.station.timezone)
        d.value = d.mean
      })
      return values
    },
    async fetchDailyNwisValues (nwisId, startDate, endDate, variable) {
      const values = await nwis.getDailyValues(nwisId, startDate, endDate, variable)
      values.forEach(d => {
        d.dateUtc = this.$date.utc(d.date)
        d.dateLocal = this.$date.tz(d.date, this.station.timezone)
        d.value = d.mean
      })
      return values
    },
    async fetchModelPredictions (model) {
      if (!model || !model.predictions_url) return []
      const values = await csv(model.predictions_url, d => {
        return {
          date: d.timestamp.substring(0, 10),
          // dateUtc: this.$date.utc(d.timestamp.substring(0, 10)),
          timestamp: new Date(d.timestamp),
          value: +d.score
        }
      })
      return values
    },
    async fetchModels () {
      const models = this.station.models
      for (const model of models) {
        model.values = await this.fetchModelPredictions(model)
        const dailyRollup = rollup(model.values, v => {
          return mean(v, d => d.value)
        }, d => d.date)
        model.dailyValues = Array.from(dailyRollup, ([date, value]) => {
          return {
            date,
            dateUtc: this.$date.utc(date),
            dateLocal: this.$date.tz(date, this.station.timezone),
            value
          }
        })
      }
      return models
    },
    addImageToQueue (image) {
      if (!image) return

      this.queue.push(image)

      if (!this.drawing) {
        this.drawImageFromQueue()
      }
    },
    popImageQueue () {
      if (this.queue.length > 4) {
        this.queue.splice(0, this.queue.length - 5)
      }
      return this.queue.shift()
    },
    async drawImageFromQueue (tries = 0) {
      if (!this.$refs.image) {
        if (tries >= 10) {
          this.drawing = false
          return
        }
        return await new Promise(resolve => {
          setTimeout(() => {
            this.drawImageFromQueue(tries + 1)
            resolve()
          }, 100)
        })
      }

      const canvas = this.$refs.image
      const ctx = canvas.getContext('2d')

      const image = this.popImageQueue()

      this.imageError = false
      this.drawing = true
      if (!image) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.image = null
        this.drawing = false
        if (this.queue.length > 0) {
          this.drawImageFromQueue()
        }
      } else {
        this.image = image
        const imageElement = new Image()
        imageElement.crossOrigin = 'anonymous'
        imageElement.onload = () => {
          if (!this.imageAspectRatio) {
            this.imageAspectRatio = imageElement.width / imageElement.height
            let canvasWidth = canvas.parentElement.clientWidth
            let canvasHeight = Math.floor(canvasWidth / this.imageAspectRatio)
            if (canvasHeight > this.maxHeight) {
              canvasHeight = this.maxHeight
              canvasWidth = Math.floor(canvasHeight * this.imageAspectRatio)
            }
            canvas.setAttribute('width', canvasWidth + 'px')
            canvas.setAttribute('height', canvasHeight + 'px')
          }
          ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
          if (this.queue.length > 0) {
            this.drawImageFromQueue()
          } else {
            this.drawing = false
          }
        }
        imageElement.onerror = () => {
          this.imageError = true
        }
        imageElement.src = image.thumb_url
      }
    },
    nextImage () {
      if (this.imagesInTimeRange.length === 0) return

      // start with first image
      if (!this.image) {
        this.addImageToQueue(this.imagesInTimeRange[0])
      } else {
        // find index of current image
        const index = this.imagesInTimeRange.findIndex(d => d.id === this.image.id)
        if (index < this.imagesInTimeRange.length - 1) {
          // next image
          this.addImageToQueue(this.imagesInTimeRange[index + 1])
        } else {
          // current image is last, jump first image
          this.addImageToQueue(this.imagesInTimeRange[0])
        }
      }
    },
    prevImage () {
      if (this.imagesInTimeRange.length === 0) return

      // start with last image
      if (!this.image) {
        this.addImageToQueue(this.imagesInTimeRange[this.imagesInTimeRange.length - 1])
      } else {
        // find index of current image
        const index = this.imagesInTimeRange.findIndex(d => d.id === this.image.id)
        if (index === 0) {
          // current image is last, jump to last image
          this.addImageToQueue(this.imagesInTimeRange[this.imagesInTimeRange.length - 1])
        } else {
          // previous image
          this.addImageToQueue(this.imagesInTimeRange[index - 1])
        }
      }
    },
    changeSpeed () {
      if (this.player.playing) {
        this.stopPlaying()
        this.startPlaying()
      }
    },
    startPlaying () {
      this.player.playing = true
      this.player.timeout = setInterval(this.nextImage, 5000 / this.player.speed)
    },
    stopPlaying () {
      clearTimeout(this.player.timeout)
      this.player.playing = false
    },
    async setTimeRange (range) {
      // console.log('setTimeRange', range)
      this.timeRange = range
      if (!this.timeRange) {
        this.timeRangeDuration = null
        this.mode = 'DAY'
        this.instantaneous = null
      } else {
        this.timeRangeDuration = (this.timeRange[1] - this.timeRange[0]) / (1000 * 60 * 60 * 24)
        if (this.timeRangeDuration && this.timeRangeDuration > MODE_DAY_MINIMUM) {
          this.mode = 'DAY'
          this.instantaneous = null
        } else {
          this.mode = 'INST'
          this.instantaneous = await this.fetchInstantaneous()
        }
      }
    }
    // chartCanvas () {
    //   const svgString = this.$refs.chart.chart.container.innerHTML

    //   // Create a Canvas element
    //   const canvas = document.createElement('canvas')
    //   document.body.appendChild(canvas)
    //   const ctx = canvas.getContext('2d')

    //   const v = Canvg.fromString(ctx, svgString)
    //   v.start()
    //   return canvas
    // },
    // generateCanvas () {
    //   const imageCanvas = this.$refs.image
    //   const chartCanvas = this.chartCanvas()

    //   // combine image and chart canvases
    //   const canvas = document.createElement('canvas')
    //   canvas.width = imageCanvas.width
    //   canvas.height = imageCanvas.height + chartCanvas.height
    //   const ctx = canvas.getContext('2d')
    //   ctx.drawImage(imageCanvas, 0, 0)
    //   ctx.drawImage(chartCanvas, 0, imageCanvas.height)

    //   ctx.font = '10px sans-serif'
    //   ctx.fillStyle = 'rgba(0,0,0,0.5)'
    //   ctx.fillText(`USGS FPE: usgs.gov/apps/ecosheds/fpe/#/explorer/${this.station.id}`, 10, canvas.height - 8)
    //   return canvas
    // },
    // save () {
    //   const canvas = this.generateCanvas()
    //   const link = document.createElement('a')
    //   link.download = 'image.png'
    //   link.href = canvas.toDataURL()
    //   link.click()
    //   canvas.remove()
    // },
    // saveGif () {
    //   // Create a new GIF instance
    //   const gif = new GIF({ // eslint-disable-line
    //     workers: 2,
    //     quality: 10
    //   })

    //   const canvas = this.generateCanvas()

    //   // Assuming 'canvas' is your canvas element
    //   // Add each canvas frame to the GIF
    //   gif.addFrame(canvas, { delay: 200 }) // delay in ms

    //   // More addFrame calls if you have more canvas states

    //   // When you're done adding frames, render the GIF
    //   gif.on('finished', function (blob) {
    //     window.open(URL.createObjectURL(blob))
    //     // Create an image element to display the GIF
    //     // const img = document.createElement('img')
    //     // img.src = URL.createObjectURL(blob)
    //     // document.body.appendChild(img)

    //     // const link = document.createElement('a')
    //     // link.download = 'image.gif'
    //     // link.href = img.toDataURL()
    //     // link.click()
    //     // canvas.remove()
    //   })

    //   // Start creating the GIF
    //   gif.render()
    // }
  }
}
</script>
