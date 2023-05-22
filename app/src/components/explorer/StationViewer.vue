<template>
  <div>
    <div v-if="station.summary.images.count === 0">
      <v-alert
        type="error"
        text
        dense
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">This station does not have any photos</div>
      </v-alert>
    </div>
    <div style="height:200px;position:relative" v-else-if="loading.images">
      <v-overlay color="grey lighten-2" absolute class="text-center" v-if="loading.images">
        <div class="text-h6 mb-8 grey--text">Loading...</div>
        <v-progress-circular
          color="grey"
          indeterminate
          size="32"
          width="4"
        ></v-progress-circular>
      </v-overlay>
    </div>
    <div v-else>
      <!-- PHOTO VIEWER -->
      <v-row align="stretch" style="">
        <v-col cols="12" md="7">
          <div class="text-center">
            <div
              v-if="!hover || !hover.image"
              class="d-flex flex-column justify-center align-center"
              style="width:100%;height:202px;background-color:rgb(0,0,0,0.05)"
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
              style="width:100%;height:200px;background-color:rgb(0,0,0,0.05)"
            >
              <div>
                <v-icon x-large>mdi-image-off-outline</v-icon>
              </div>
              <div class="text-h6 text--secondary mt-4">
                Photo Unavailable
              </div>
            </div>
            <canvas ref="canvas" v-show="!!hover && hover.image && !imageError" @click="showImage(hover.image)" style="cursor:pointer"></canvas>
          </div>
        </v-col>
        <v-col cols="12" md="5" :class="{ 'pl-0': !$vuetify.breakpoint.mobile }" class="mb-0">
          <div v-if="!$vuetify.breakpoint.mobile && hover">
            <v-simple-table dense class="my-0 pl-0 black--text" style="white-space: nowrap">
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
                <tr v-if="variable.selected">
                  <td class="py-2 pl-0">
                    <div class="text-subtitle-2 text--secondary">Obs. Daily Mean {{ variableLabel }}</div>
                    <div v-if="hover.value" class="font-weight-bold">
                      {{ hover.value.mean | d3Format('.3r') }}
                      {{ variable.selected.id !== 'OTHER' ? variable.selected.units : '' }}
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
              </tbody>
            </v-simple-table>
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
                <span class="font-weight-bold">Hover over Daily Timeseries</span> to view photos collected at mid-day on each date.
              </p>
              <p class="mb-0">
                <span class="font-weight-bold">Click on Explore All Photos</span> to explore photos from this station in more detail.
              </p>
            </v-alert>
          </div>
        </v-col>
      </v-row>
      <!-- CHART -->
      <v-divider class="mt-2 mb-4"></v-divider>
      <v-row>
        <v-col cols="12" v-show="loading.values" style="height:200px;position:relative">
          <v-overlay color="grey lighten-2" absolute class="text-center">
            <div class="text-h6 mb-8 grey--text">Loading...</div>
            <v-progress-circular
              color="grey"
              indeterminate
              size="32"
              width="4"
            ></v-progress-circular>
          </v-overlay>
        </v-col>
        <v-col cols="12" v-show="!loading.values">
          <v-row align="end" class="mb-0">
            <v-col cols="7">
              <div class="text-h6 font-weight-bold text--secondary">
              Daily Photos
                <v-tooltip bottom max-width="400px" style="z-index:5002">
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      x-small
                      icon
                      v-bind="attrs"
                      v-on="on"
                      class="mt-n1"
                    >
                      <v-icon small>mdi-help-circle</v-icon>
                    </v-btn>
                  </template>
                  <div class="body-1">
                    <p>
                      Circles show when photos were collected. Only one photo is shown per day (closest to midday). Click 'Explore All Photos' button below to see sub-daily photos.
                    </p>
                    <p>
                      Linechart (if shown) shows daily mean and range of observed variables.
                    </p>
                  </div>
                </v-tooltip>
              </div>
            </v-col>
            <v-col cols="5">
              <v-select
                v-show="variable.options.length > 0"
                :items="variable.options"
                v-model="variable.selected"
                label="Variable"
                hide-details
                item-text="label"
                return-object
                dense
                class="mb-2"
              ></v-select>
            </v-col>
          </v-row>
          <svg ref="svg"></svg>

          <v-alert color="error" dense text colored-border border="left" class="body-2 mb-0 mt-2" v-if="provisional">
            <div class="font-weight-bold body-1 d-flex align-center">
              <v-icon color="error" left>mdi-alert</v-icon>
              <div class="body-2 font-weight-medium">Chart May Contain Provisional Data</div>
              <v-spacer></v-spacer>
              <v-btn xs text color="default" @click="$refs.provisionalDialog.open()">Read More</v-btn>
            </div>
            <!-- Data are provisional and subject to revision until they have been thoroughly reviewed and received final approval. -->
          </v-alert>

          <InfoDialog title="Provisional Data Statement" ref="provisionalDialog">
            <p>Data are provisional and subject to revision until they have been thoroughly reviewed and received final approval. Current condition data relayed by satellite or other telemetry are automatically screened to not display improbable values until they can be verified.</p>

            <p>Provisional data may be inaccurate due to instrument malfunctions or physical changes at the measurement site. Subsequent review based on field inspections and measurements may result in significant revisions to the data.</p>

            <p class="mb-0">Data users are cautioned to consider carefully the provisional nature of the information before using it for decisions that concern personal or public safety or the conduct of business that involves substantial monetary or operational consequences. Information concerning the accuracy and appropriate uses of these data or concerning other hydrologic data may be obtained from the USGS.</p>
          </InfoDialog>
        </v-col>
      </v-row>
      <!-- IMAGE ERROR -->
      <v-row v-if="!!imageError" class="mt-0">
        <v-col>
          <v-alert
            type="error"
            text
            dense
            colored-border
            border="left"
            class="body-2 mb-0 mt-0"
          >
            <div class="font-weight-bold body-1">Failed to Load Image</div>
          </v-alert>
        </v-col>
      </v-row>
      <!-- NO DATA -->
      <v-row v-if="station.summary.values.count === 0 && !station.nwis_id" class="mt-0">
        <v-col>
          <v-alert
            type="warning"
            text
            dense
            colored-border
            border="left"
            class="body-2 mb-0 mt-0"
          >
            <div class="font-weight-bold body-1">This station does not have any observed data</div>
          </v-alert>
        </v-col>
      </v-row>
      <!-- PLAYER -->
      <v-row justify="space-around" align="center">
        <v-col cols="12" xl="6" class="pt-0">
          <v-row class="mt-0">
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
        <v-col cols="12" xl="6" class="pt-0">
          <v-btn
            color="success"
            dark
            block
            large
            :to="{ name: 'explorerStation', params: { stationId: station.id } }"
            class="mt-4"
            :disabled="station.summary.images.count === 0"
          >
            <v-icon left>mdi-image-multiple-outline</v-icon> Explore Sub-Daily Photos<v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-alert
        type="error"
        text
        dense
        colored-border
        border="left"
        class="body-2 mb-0 mt-4"
        v-if="error"
      >
        <div class="font-weight-bold body-1">Failed to Fetch Data</div>
        <div>{{ error }}</div>
      </v-alert>
    </div>

    <ImageDialog ref="imageDialog"></ImageDialog>
  </div>
</template>

<script>
import * as d3 from 'd3'

import ImageDialog from '@/components/ImageDialog'
import InfoDialog from '@/components/InfoDialog'

import nwis from '@/lib/nwis'
import { timeFormat } from '@/lib/utils'
import { variables } from '@/lib/constants'

export default {
  name: 'StationViewer',
  components: {
    ImageDialog,
    InfoDialog
  },
  props: ['station'],
  data () {
    return {
      loading: {
        images: true,
        values: true
      },
      error: null,
      ready: false,
      clipId: 'preview',
      width: 400,
      imageError: false,
      imageRadius: 6,
      margin: {
        left: 60,
        right: 80,
        top: 40,
        bottom: 20,
        images: 2
      },
      variable: {
        selected: null,
        options: []
      },
      hover: null,
      queue: [],
      drawing: false,
      aspectRatio: null,
      player: {
        timeout: null,
        i: 0,
        playing: false,
        speed: 20
      },
      daily: {
        images: [],
        values: [],
        nwis: []
      },
      provisional: false
    }
  },
  computed: {
    hasData () {
      return this.station.summary.values.count > 0 || this.station.nwis_id
    },
    height () {
      return this.hasData ? 150 : 40
    },
    variableId () {
      return this.variable.selected ? this.variable.selected.id : null
    },
    variableLabel () {
      return this.variable.selected ? this.variable.selected.label : null
    },
    variableLabelUnits () {
      if (!this.variable.selected) return ''
      if (this.variable.selected.id === 'OTHER') return this.variable.selected.label
      return `${this.variable.selected.label} (${this.variable.selected.units})`
    },
    nValues () {
      let n = 0
      if (this.daily && this.daily.values) {
        n += this.daily.values.length
      }
      if (this.daily && this.daily.nwis) {
        n += this.daily.nwis.length
      }
      return n
    },
    minValue () {
      if (this.nValues === 0 || this.variableId === 'FLOW_CFS') return 0
      const values = [
        this.daily.values.map(d => d.min),
        this.daily.nwis.map(d => d.mean)
      ].flat()
      return d3.min(values)
    },
    maxValue () {
      if (this.nValues === 0 || !this.variableId) return 0
      const valuesMax = d3.max(this.daily.values, d => d.max)
      const nwisMax = d3.max(this.daily.nwis, d => d.mean)
      return d3.max([valuesMax, nwisMax])
    },
    dateExtent () {
      if (this.dailyImages.length === 0) return null
      const dateExtent = d3.extent(this.dailyImages, d => d.dateUtc)
      return dateExtent
    },
    x () {
      return d3.scaleUtc()
        .domain(this.dateExtent || [0, 1])
        .range([this.margin.left, this.width - this.margin.right])
    },
    y () {
      const domain = [this.minValue, this.maxValue]
      if (this.variableId === 'STAGE_FT') {
        domain[0] = domain[0] - 0.05 * (domain[1] - domain[0])
        domain[1] = domain[1] + 0.05 * (domain[1] - domain[0])
      }
      return d3.scaleLinear()
        .domain(domain)
        .range([this.height - this.margin.bottom, this.margin.top])
    },
    dailyImages () {
      return this.daily.images.filter(d => !!d.image)
    }
  },
  watch: {
    station () {
      this.init()
    },
    hover () {
      this.renderHover()
    },
    async 'variable.selected' () {
      if (!this.ready) return
      this.loading.values = true
      this.error = null
      try {
        await this.fetchDailyValues()
        await this.fetchDailyNwis()
        this.render()
      } catch (err) {
        console.log(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading.values = false
      }
    }
  },
  async mounted () {
    // console.log('StationViewer:mounted', this.station)
    await this.init()
  },
  beforeDestroy () {
    this.stopAutoplay()
  },
  methods: {
    async init () {
      this.width = this.$el.offsetWidth

      if (this.station.summary.values.count === 0) {
        if (this.station.nwis_id) {
          this.variable.options = variables.filter(d => d.id === 'FLOW_CFS')
          this.variable.selected = this.variable.options[0]
        } else {
          this.variable.options = []
          this.variable.selected = null
        }
      } else {
        this.variable.options = variables.filter(d => this.station.summary.values.variables.map(d => d.variable_id).includes(d.id))
        this.variable.selected = this.variable.options.find(d => d.id === this.station.summary.values.variables[0].variable_id)
      }

      await this.fetchDaily()

      this.svg = d3.select(this.$refs.svg)
        .attr('width', this.width)
        .attr('height', this.height)

      this.svg.append('clipPath')
        .attr('id', this.clipId)
        .append('rect')
        .attr('x', this.margin.left)
        .attr('y', 0)
        .attr('height', this.height)
        .attr('width', this.width - this.margin.left - this.margin.right)

      this.g = {
        xAxis: this.svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', `translate(0,${this.height - this.margin.bottom})`),
        yAxis: this.svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', `translate(${this.margin.left},0)`),
        values: this.svg.append('g')
          .attr('class', 'values')
          .attr('clip-path', `url(#${this.clipId})`),
        images: this.svg.append('g')
          .attr('class', 'images'),
        focus: this.svg.append('g')
          .attr('class', 'focus'),
        noImages: this.svg.append('g')
          .attr('transform', `translate(0,${this.imageRadius + 6})`)
          .attr('class', 'no-images'),
        input: this.svg.append('g')
          .attr('class', 'input'),
        legend: this.svg.append('g')
          .attr(
            'transform',
            `translate(${this.width - this.margin.right + 10},60)`
          )
          .attr('class', 'legend')
      }

      this.g.noImages
        .append('text')
        .attr('transform', `translate(${this.margin.left + 5},0)`)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 12)
        .text('None')

      this.g.input
        .append('rect')
        .attr('pointer-events', 'all')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.width)
        .attr('height', this.height - this.margin.bottom)
        .style('fill', 'none')
        .attr('clip-path', `url(#${this.clipId})`)
        .on('mousemove', this.onMousemove)
        // .on('mouseout', this.clearHover)

      this.ready = true
      this.render()
    },
    async fetchDaily () {
      this.loading.images = true
      this.loading.values = true
      this.error = null
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
      if (!this.variable.selected) return
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
      if (!this.variable.selected) return
      const variableId = this.variable.selected.id
      this.daily.nwis = []
      if (this.daily.images.length > 0 && variableId === 'FLOW_CFS' && this.station.nwis_id) {
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
    onMousemove (event) {
      if (this.player.playing) return
      const mouseTimestampUtc = this.$date(this.x.invert(event.offsetX)).utc()

      if (this.dailyImages.length === 0) return this.$emit('hover')
      const dateUtcBisector = d3.bisector(d => d.dateUtc).left
      const bisectDateUtc = (data, dateUtc) => {
        const i = dateUtcBisector(data, dateUtc, 1)
        const a = data[i - 1]
        const b = data[i]
        if (!b) return a
        const item = (dateUtc - a.dateUtc) > (b.dateUtc - dateUtc) ? b : a
        return item
      }
      const hoveredImageItem = bisectDateUtc(this.dailyImages, mouseTimestampUtc)
      const hoveredImage = hoveredImageItem.image

      const hoveredValueItem = this.daily.values.find(d => d.date === hoveredImageItem.date)
      const hoveredValue = hoveredValueItem

      const hoveredNwisItem = this.daily.nwis.find(d => d.date === hoveredImageItem.date)
      const hoveredNwis = hoveredNwisItem
      this.showHover({
        dateUtc: hoveredImageItem.dateUtc,
        image: hoveredImage,
        value: hoveredValue,
        nwis: hoveredNwis
      })
    },
    clearHover () {
      this.g.focus.selectAll('circle').remove()
      this.showHover(null)
    },
    renderHover () {
      const { value, nwis, image, dateUtc } = this.hover || {}
      this.g.focus.selectAll('circle.value')
        .data(value ? [value] : [])
        .join('circle')
        .attr('class', 'value')
        .attr('fill', 'none')
        .attr('stroke', 'orangered')
        .attr('stroke-width', '2px')
        .attr('cx', this.x(dateUtc))
        .attr('cy', d => this.y(d.mean))
        .attr('r', this.imageRadius)
      this.g.focus.selectAll('circle.nwis')
        .data(nwis ? [nwis] : [])
        .join('circle')
        .attr('class', 'nwis')
        .attr('fill', 'none')
        .attr('stroke', 'orangered')
        .attr('stroke-width', '2px')
        .attr('cx', this.x(dateUtc))
        .attr('cy', d => this.y(d.mean))
        .attr('r', this.imageRadius)
      this.g.focus.selectAll('circle.image')
        .data(image ? [image] : [], d => d.id)
        .join('circle')
        .attr('class', 'image')
        .attr('fill', 'none')
        .attr('stroke', 'orangered')
        .attr('stroke-width', '2px')
        .attr('cx', d => this.x(dateUtc))
        .attr('cy', this.imageRadius + this.margin.images)
        .attr('r', this.imageRadius)
    },
    async showHover (hover) {
      const nextInQueue = this.queue.length ? this.queue[this.queue.length - 1] : null

      if (nextInQueue && hover) {
        // hover is already at end of queue
        if (nextInQueue.image.id === hover.image.id) return
      } else if (this.hover && hover) {
        // hover is alredy being shown
        if (this.hover.image.id === hover.image.id) return
      }

      this.queue.push(hover)

      if (!this.drawing) {
        this.drawImage()
      }
    },
    shiftQueue () {
      this.queue.shift()
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
            canvas.setAttribute('width', canvas.parentElement.clientWidth + 'px')
            canvas.setAttribute('height', Math.floor(canvas.parentElement.clientWidth / this.aspectRatio) + 'px')
          }
          ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
          this.hover = hover
          this.shiftQueue()
          if (this.queue.length > 0) {
            this.drawImage()
          } else {
            this.drawing = false
          }
        }
        imageElement.onerror = () => {
          // console.error(err)
          this.hover = hover
          this.imageError = true
          this.shiftQueue()
          // ctx.clearRect(0, 0, canvas.width, canvas.height)
          if (this.queue.length > 0) {
            this.drawImage()
          } else {
            this.drawing = false
          }
        }
        imageElement.src = hover.image.thumb_url
      }
    },
    render () {
      if (!this.ready) return

      // clear existing values and images
      this.g.values.selectAll('path').remove()
      this.g.images.selectAll('circle').remove()

      this.renderAxes()
      this.renderDaily()
    },
    renderLegend () {
      this.g.legend.selectAll('path').remove()
      this.g.legend.selectAll('text').remove()

      if (this.variableId) {
        const line = d3.line()
          .x(d => d)
          .y(d => 0)

        const area = d3.area()
          .x(d => d)
          .y0(d => -20)
          .y1(d => 20)

        const values = [10, 25]
        let nwisOffset = 0

        if (this.daily.values.length > 0) {
          nwisOffset = 60
          this.g.legend.selectAll('path.mean.values')
            .data([values])
            .join('path')
            .attr('class', 'mean')
            .attr('class', 'values')
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', '2px')
            .attr('d', line)

          this.g.legend.selectAll('path.range.values')
            .data([values])
            .join('path')
            .attr('class', 'range')
            .attr('class', 'values')
            .attr('fill', 'gray')
            .attr('opacity', 0.25)
            .attr('d', area)

          this.g.legend.selectAll('text')
            .data([{ value: -20, text: 'Max' }, { value: 0, text: 'Mean' }, { value: 20, text: 'Min' }])
            .join('text')
            .attr('font-size', 12)
            .attr('font-family', 'sans-serif')
            .attr('text-anchor', 'start')
            .attr('fill', 'currentColor')
            .attr('x', values[1] + 5)
            .attr('y', d => d.value)
            .attr('dy', '0.3em')
            .text(d => d.text)

          this.g.legend
            .append('text')
            .attr('font-size', 12)
            .attr('font-family', 'sans-serif')
            .attr('text-anchor', 'start')
            .attr('text-decoration', 'underline')
            .attr('fill', 'currentColor')
            .attr('x', 10)
            .attr('y', -40)
            .attr('dy', '0.3em')
            .text('Obs. Daily')
        }

        if (this.daily.nwis && this.daily.nwis.length > 0) {
          this.g.legend.selectAll('path.mean.nwis')
            .data([values])
            .join('path')
            .attr('class', 'mean')
            .attr('class', 'nwis')
            .attr('fill', 'none')
            .attr('stroke', 'deepskyblue')
            .attr('stroke-width', '2px')
            .attr('d', line)
            .attr('transform', `translate(0,${nwisOffset + 20})`)

          this.g.legend
            .append('text')
            .attr('class', 'nwis')
            .attr('font-size', 12)
            .attr('font-family', 'sans-serif')
            .attr('text-anchor', 'start')
            .attr('text-decoration', 'underline')
            .attr('fill', 'currentColor')
            .attr('x', 10)
            .attr('y', nwisOffset)
            .attr('dy', '0.3em')
            .text('NWIS')
          this.g.legend
            .append('text')
            .attr('class', 'nwis')
            .attr('font-size', 12)
            .attr('font-family', 'sans-serif')
            .attr('text-anchor', 'start')
            .attr('fill', 'currentColor')
            .attr('x', 30)
            .attr('y', nwisOffset + 20)
            .attr('dy', '0.3em')
            .text('Mean')
        } else {
          this.g.legend.selectAll('path.mean.nwis').remove()
          this.g.legend.selectAll('text.nwis').remove()
        }
      }
    },
    renderAxes () {
      const xAxis = d3.axisBottom(this.x)
        .ticks(5)
        .tickSizeOuter(0)
        .tickFormat(timeFormat)
      this.g.xAxis.call(xAxis)

      if (this.hasData) {
        const yAxis = d3.axisLeft(this.y)
          .ticks(6)
          .tickFormat(d3.format('.2r'))
        this.g.yAxis.call(yAxis)
      }

      const imagesLabel = this.g.yAxis.select('text.images')
      if (imagesLabel.empty()) {
        this.g.yAxis.append('text')
          .attr('class', 'images')
          .attr('transform', `translate(${-this.margin.left},${this.imageRadius})`)
          .attr('fill', 'currentColor')
          .attr('dy', '0.5em')
          .attr('font-size', 12)
          .attr('text-anchor', 'start')
          .text('Photos→')
      }

      const yLabel = this.g.yAxis.select('text.variable')
      if (yLabel.empty()) {
        this.g.yAxis.append('text')
          .attr('class', 'variable')
          .attr('transform', `translate(${-this.margin.left},${this.margin.top - 10})`)
          .attr('text-anchor', 'start')
          .attr('fill', 'currentColor')
          .attr('font-size', 12)
      }
      this.g.yAxis.select('text.variable')
        .text(`Observed Daily Mean ${this.variableLabel}`)
        .attr('visibility', !this.hasData ? 'hidden' : 'visible')

      this.g.yAxis.selectAll('g.tick')
        .attr('visibility', !this.hasData ? 'hidden' : 'visible')
      this.g.yAxis.selectAll('g.tick')
        .attr('visibility', !this.hasData ? 'hidden' : 'visible')
    },
    renderDaily () {
      this.renderDailyImages()
      this.renderDailyValues()
    },
    renderDailyValues () {
      const valueChunks = []
      this.daily.values.forEach((d, i) => {
        if (i === 0) {
          valueChunks.push([d])
        } else {
          if (d.dateUtc.diff(this.daily.values[i - 1].dateUtc, 'day') > 1) {
            valueChunks.push([d])
          } else {
            valueChunks[valueChunks.length - 1].push(d)
          }
        }
      })

      const nwisChunks = []
      this.daily.nwis.forEach((d, i) => {
        if (i === 0) {
          nwisChunks.push([d])
        } else {
          if (d.dateUtc.diff(this.daily.nwis[i - 1].dateUtc, 'day') > 1) {
            nwisChunks.push([d])
          } else {
            nwisChunks[nwisChunks.length - 1].push(d)
          }
        }
      })

      const line = d3.line()
        .curve(d3.curveStep)
        .x(d => this.x(d.dateUtc))
        .y(d => this.y(d.mean))

      const area = d3.area()
        .curve(d3.curveStep)
        .x(d => this.x(d.dateUtc))
        .y0(d => this.y(d.min))
        .y1(d => this.y(d.max))

      this.g.values.selectAll('path.mean.values')
        .data(valueChunks)
        .join('path')
        .attr('class', 'mean')
        .attr('class', 'values')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', '2px')
        .attr('d', line)

      this.g.values.selectAll('path.range.values')
        .data(valueChunks)
        .join('path')
        .attr('class', 'range')
        .attr('class', 'values')
        .attr('fill', 'gray')
        .attr('opacity', 0.5)
        .attr('d', area)

      this.g.values.selectAll('path.mean.nwis')
        .data(nwisChunks)
        .join('path')
        .attr('class', 'mean')
        .attr('class', 'nwis')
        .attr('fill', 'none')
        .attr('stroke', 'deepskyblue')
        .attr('stroke-width', '2px')
        .attr('d', line)
      this.renderLegend()
    },
    renderDailyImages () {
      this.g.images.selectAll('circle')
        .data(this.dailyImages)
        .join('circle')
        .attr('fill', 'gold')
        .attr('stroke', 'goldenrod')
        .attr('opacity', 0.5)
        .attr('cx', d => this.x(d.dateUtc))
        .attr('cy', this.imageRadius + this.margin.images)
        .attr('r', this.imageRadius)

      this.g.noImages.attr('visibility', this.dailyImages.length > 0 ? 'hidden' : 'visible')
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
    autoplay () {
      if (!this.player.playing) {
        this.startAutoplay()
      } else {
        this.stopAutoplay()
      }
    },
    startAutoplay () {
      this.player.playing = true

      let i = 0
      if (this.hover) {
        const dateUtcBisector = d3.bisector(d => d.dateUtc).left
        i = dateUtcBisector(this.dailyImages, this.hover.dateUtc, 1)
      }
      this.playFrame(i)
    },
    playFrame (i) {
      this.player.i = i
      const dailyImage = this.dailyImages[i]
      const dailyValue = this.daily.values.find(d => d.date === dailyImage.date)
      const dailyNwis = this.daily.nwis.find(d => d.date === dailyImage.date)
      this.showHover({
        dateUtc: dailyImage.dateUtc,
        image: dailyImage.image,
        value: dailyValue,
        nwis: dailyNwis
      })

      this.player.timeout = setTimeout(() => {
        if (i >= (this.dailyImages.length - 1)) {
          this.playFrame(0)
        } else {
          this.playFrame(i + 1)
        }
      }, 1e3 / this.player.speed)
    },
    stopAutoplay () {
      clearTimeout(this.player.timeout)
      this.queue = []
      this.player.playing = false
    }
  }
}
</script>
