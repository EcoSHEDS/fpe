<template>
  <div class="pt-4">
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

      <v-container style="max-width: 550px;">
        <v-row>
          <v-col cols="3">
            <v-btn
              block
              rounded
              color="primary"
              @click="player.playing = !player.playing"
              v-if="!player.playing"
            >
              <v-icon small>mdi-play</v-icon> Play
            </v-btn>
            <v-btn
              block
              rounded
              color="primary"
              @click="player.playing = !player.playing"
              v-else
            >
              <v-icon small>mdi-stop</v-icon> Stop
            </v-btn>
          </v-col>
          <v-col cols="9">
            <v-slider
              v-model="player.speed"
              label="Speed"
              min="1"
              max="100"
              step="1"
              hide-details
            ></v-slider>
          </v-col>
        </v-row>
      </v-container>

      <div class="mt-4" style="padding-left:1px">
        <v-tabs v-model="tab" background-color="grey lighten-4">
          <v-tab>Timeseries</v-tab>
          <v-tab>Distributions</v-tab>
          <v-tab>Scatterplots</v-tab>
          <!-- <v-tab>Models</v-tab> -->
          <v-spacer></v-spacer>

          <v-divider vertical class="mx-4"></v-divider>
          <div style="margin-top:-6px;">
            <v-switch
              v-model="scaleValues"
              label="Show as Rank Percentile (0-100%)"
              :disabled="tab === 1"
            >
            </v-switch>
          </div>
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
          <v-tab-item>
            <TimeseriesChart
              v-if="ready"
              :station="station"
              :images="images"
              :series="selectedSeries"
              :play="player.playing"
              :speed="player.speed"
              :scale-values="scaleValues"
              @hover="onHover"
              ref="chart">
            </TimeseriesChart>
          </v-tab-item>
          <v-tab-item>
            <DistributionChart
              v-if="ready"
              :station="station"
              :images="images"
              :series="selectedSeries"
              :play="player.playing"
              :speed="player.speed"
              @hover="onHover"
              ref="chart">
            </DistributionChart>
          </v-tab-item>
          <v-tab-item>
            <ScatterplotChart
              v-if="ready"
              :station="station"
              :images="images"
              :series="selectedSeries"
              :play="player.playing"
              :speed="player.speed"
              :scale-values="scaleValues"
              @hover="onHover"
              ref="chart">
            </ScatterplotChart>
          </v-tab-item>
          <!-- <v-tab-item>
          </v-tab-item> -->
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
import nwis from '@/lib/nwis'
import TimeseriesChart from '@/components/charts/TimeseriesChart'
import DistributionChart from '@/components/charts/DistributionChart'
import ScatterplotChart from '@/components/charts/ScatterplotChart'
// import { Canvg } from 'canvg'

export default {
  name: 'StationPhotos',
  props: ['station'],
  components: {
    TimeseriesChart,
    DistributionChart,
    ScatterplotChart
  },
  data () {
    return {
      loading: true,
      error: null,
      ready: false,
      tab: 0,
      scaleValues: false,

      images: [],
      series: [],
      selectedSeries: [],
      models: [],

      queue: [],
      drawing: false,
      imageShown: null,
      imageError: false,

      maxHeight: 500,
      imageAspectRatio: null,

      player: {
        playing: false,
        speed: 50
      }
    }
  },
  computed: {
  },
  async mounted () {
    await this.init()
  },
  watch: {},
  methods: {
    async init () {
      this.loading = true
      this.error = null
      try {
        const images = await this.fetchDailyImages()

        const startDate = images[0].date
        const endDate = images[images.length - 1].date

        const variableIds = this.station.summary.values.variables
          .map(d => d.variable_id)

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
          const values = await this.fetchDailyNwisValues(this.station.nwis_id, startDate, endDate)
          if (values.length > 0) {
            series.push({
              variableId: 'FLOW_CFS',
              name: 'OBS. FLOW_CFS [NWIS]',
              source: 'NWIS',
              data: values
            })
          }
        }

        const models = await this.fetchModels()
        if (models.length > 0) {
          models.forEach(model => {
            series.push({
              variableId: 'SCORE',
              name: `MODEL SCORE [${model.code}]`,
              source: 'MODEL',
              data: model.values.filter(d => d.date >= startDate && d.date <= endDate)
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

        this.images = Object.freeze(images)
        this.series = Object.freeze(series)
        this.selectedSeries = this.series.slice()
        this.models = Object.freeze(models)
        this.ready = true
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    async fetchDailyImages () {
      const response = await this.$http.public.get(`/stations/${this.station.id}/daily/images`)
      const images = response.data
      images.forEach(d => {
        d.dateUtc = this.$date.utc(d.date)
        d.dateLocal = this.$date.tz(d.date, this.station.utczone)
      })
      return images
    },
    async fetchDailyValues (variableId, startDate, endDate) {
      const response = await this.$http.public.get(`/stations/${this.station.id}/daily/values?variableId=${variableId}&start=${startDate}&end=${endDate}`)
      const values = response.data
      values.forEach(d => {
        d.dateUtc = this.$date.utc(d.date)
        d.dateLocal = this.$date.tz(d.date, this.station.utczone)
        d.value = d.mean
      })
      return values
    },
    async fetchDailyNwisValues (nwisId, startDate, endDate) {
      const values = await nwis.getDailyFlows(nwisId, startDate, endDate)
      values.forEach(d => {
        d.dateUtc = this.$date.utc(d.date)
        d.dateLocal = this.$date.tz(d.date, this.station.utczone)
        d.value = d.mean
      })
      return values
    },
    async fetchDailyModelPredictions (model) {
      if (!model || !model.predictions_url) return []
      const values = await csv(model.predictions_url, d => {
        return {
          date: d.timestamp.substring(0, 10),
          // dateUtc: this.$date.utc(d.timestamp.substring(0, 10)),
          timestamp: new Date(d.timestamp),
          score: +d.score
        }
      })
      const dailyRollup = rollup(values, v => {
        return mean(v, d => d.score)
      }, d => d.date)
      const dailyValues = Array.from(dailyRollup, ([date, value]) => {
        return {
          date,
          dateUtc: this.$date.utc(date),
          value
        }
      })
      return dailyValues
    },
    async fetchModels () {
      const models = this.station.models
      for (const model of models) {
        model.values = await this.fetchDailyModelPredictions(model)
      }
      return models
    },
    onHover (image) {
      if (!image) return
      const nextInQueue = this.queue.length > 0 ? this.queue[this.queue.length - 1] : null

      // image is already at end of queue
      if (nextInQueue && nextInQueue.id === image.id) return
      // image is already being shown
      if (this.imageShown && this.imageShown.id === image.id) return

      this.queue.push(image)

      if (!this.drawing) {
        this.drawImageFromQueue()
      }
    },
    getNextImage () {
      if (this.queue.length > 4) {
        this.queue.splice(0, this.queue.length - 5)
      }
      return this.queue.shift()
    },
    drawImageFromQueue () {
      if (!this.$refs.image) return
      const canvas = this.$refs.image
      const ctx = canvas.getContext('2d')

      const image = this.getNextImage()

      this.imageError = false
      this.drawing = true
      if (!image) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.imageShown = null
        this.drawing = false
        if (this.queue.length > 0) {
          this.drawImageFromQueue()
        }
      } else {
        this.imageShown = image
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
