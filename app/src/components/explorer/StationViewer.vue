<template>
  <div>
    <v-row v-if="station.summary.images.count > 0 && station.provisional && !loading">
      <v-col class="my-0 pb-0">
        <v-alert type="error" dense text colored-border border="left" class="body-2">
          <div class="font-weight-bold body-1">Station Contains Provisional Data</div>
          <div>
            <v-btn class="float-right" xs text color="default" @click="$refs.provisionalDialog.open()">Read More</v-btn>
            Data are provisional and subject to revision until they have been thoroughly reviewed and received final approval.
          </div>
        </v-alert>

        <InfoDialog title="Provisional Data Statement" ref="provisionalDialog">
          <p>Data are provisional and subject to revision until they have been thoroughly reviewed and received final approval. Current condition data relayed by satellite or other telemetry are automatically screened to not display improbable values until they can be verified.</p>

          <p>Provisional data may be inaccurate due to instrument malfunctions or physical changes at the measurement site. Subsequent review based on field inspections and measurements may result in significant revisions to the data.</p>

          <p class="mb-0">Data users are cautioned to consider carefully the provisional nature of the information before using it for decisions that concern personal or public safety or the conduct of business that involves substantial monetary or operational consequences. Information concerning the accuracy and appropriate uses of these data or concerning other hydrologic data may be obtained from the USGS.</p>
        </InfoDialog>
      </v-col>
    </v-row>
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
    <div style="height:200px;position:relative" v-else-if="loading">
      <v-overlay color="grey lighten-2" absolute class="text-center" v-if="loading">
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
              style="width:265;height:202px;background-color:rgb(0,0,0,0.05)"
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
              style="width:265;height:202px;background-color:rgb(0,0,0,0.05)"
            >
              <div>
                <v-icon x-large>mdi-image-off-outline</v-icon>
              </div>
              <div class="text-h6 text--secondary mt-4">
                Photo Unavailable
              </div>
            </div>
            <canvas ref="canvas" width="265" height="195" v-show="!!hover && hover.image && !imageError" @click="showImage(hover.image)" style="cursor:pointer"></canvas>
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
                <tr v-if="hover.value">
                  <td class="py-2 pl-0">
                    <div class="text-subtitle-2 text--secondary">Daily Mean {{ variableLabel}} (Observed)</div>
                    <div class="font-weight-bold">
                      {{ hover.value.mean | d3Format('.3r') }}
                      {{ variable.selected ? variable.selected.units : '' }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-divider></v-divider>
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
      <v-row>
        <v-col cols="12">
          <v-row align="end" class="mb-0">
            <v-col cols="6">
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
            <v-col cols="6">
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
      <v-row v-if="station.summary.values.count === 0" class="mt-0">
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
      <v-row>
        <v-col cols="12" class="pt-0">
          <v-row class="mt-2">
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
      <!-- EXPLORE BUTTON -->
      <v-btn
        color="success"
        dark
        block
        large
        :to="{ name: 'explorerStation', params: { stationId: station.id } }"
        class="mt-4"
        :disabled="station.summary.images.count === 0"
      >
        <v-icon left>mdi-earth</v-icon> Explore All Photos
      </v-btn>
    </div>

    <ImageDialog ref="imageDialog"></ImageDialog>
  </div>
</template>

<script>
import * as d3 from 'd3'

import ImageDialog from '@/components/ImageDialog'
import InfoDialog from '@/components/InfoDialog'

import { hasDailyValue, timeFormat } from '@/lib/utils'
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
      loading: true,
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
      }
    }
  },
  computed: {
    hasData () {
      return this.station.summary.values.count > 0
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
      return this.variable.selected ? `${this.variable.selected.label} (${this.variable.selected.units})` : null
    },
    minValue () {
      if (this.dailyValues.length === 0 || this.variableId === 'FLOW_CFS') return 0
      return d3.min(this.daily, d => d.values ? d.values[this.variableId].min : null)
    },
    maxValue () {
      if (this.dailyValues.length === 0 || !this.variableId) return 0
      return d3.max(this.dailyValues, d => d.values ? d.values[this.variableId].max : 0)
    },
    dailyValues () {
      if (!this.daily || !this.variableId) return []
      return this.daily
        .filter(d => hasDailyValue(d, this.variableId))
        .filter(d => d.dateUtc.isBetween(this.dateExtent[0].subtract(1, 'day'), this.dateExtent[1], null, '[]'))
    },
    dateExtent () {
      if (this.dailyImages.length === 0) return null
      const dateExtent = d3.extent(this.dailyImages, d => d.dateUtc)
      // dateExtent[1] = dateExtent[1].add(1, 'day')
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
      return this.daily.filter(d => !!d.image)
    }
  },
  watch: {
    station () {
      this.init()
    },
    hover () {
      this.renderHover()
    },
    'variable.selected' () {
      this.render()
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
      const data = await this.fetchDaily()
      this.daily = Object.freeze(data)

      if (this.station.summary.values.count === 0) {
        this.variable.options = []
        this.variable.selected = null
      } else {
        this.variable.options = variables.filter(d => this.station.summary.values.variables.map(d => d.variable_id).includes(d.id))
        this.variable.selected = this.variable.options.find(d => d.id === this.station.summary.values.variables[0].variable_id)
      }

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
            `translate(${this.width - this.margin.right + 10},${this.margin.top + (this.height - this.margin.top - this.margin.bottom) / 2})`
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
      this.loading = true
      this.error = null

      try {
        const url = `/stations/${this.station.id}/daily`
        const response = await this.$http.public.get(url)
        const data = response.data
        data.forEach(d => {
          d.dateUtc = this.$date.utc(d.date)
          d.dateLocal = this.$date.tz(d.date, this.station.utczone)
        })
        return data
      } catch (err) {
        console.error(err)
        this.error = err.message || err.toString()
      } finally {
        this.loading = false
      }
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
      const hoveredItem = bisectDateUtc(this.dailyImages, mouseTimestampUtc)
      const hoveredImage = hoveredItem.image
      const hoveredValue = hasDailyValue(hoveredItem, this.variableId) ? hoveredItem.values[this.variableId] : null
      // this.g.focus.selectAll('circle.value')
      //   .data(hoveredValue ? [hoveredValue] : [])
      //   .join('circle')
      //   .attr('class', 'value')
      //   .attr('fill', 'none')
      //   .attr('stroke', 'orangered')
      //   .attr('stroke-width', '2px')
      //   .attr('cx', this.x(hoveredItem.dateUtc))
      //   .attr('cy', d => this.y(d.mean))
      //   .attr('r', this.imageRadius)
      // this.g.focus.selectAll('circle.image')
      //   .data([hoveredImage], d => d.id)
      //   .join('circle')
      //   .attr('class', 'image')
      //   .attr('fill', 'none')
      //   .attr('stroke', 'orangered')
      //   .attr('stroke-width', '2px')
      //   .attr('cx', d => this.x(hoveredItem.dateUtc))
      //   .attr('cy', this.imageRadius + this.margin.images)
      //   .attr('r', this.imageRadius)

      this.showHover({
        dateUtc: hoveredItem.dateUtc,
        image: hoveredImage,
        value: hoveredValue
      })
    },
    clearHover () {
      this.g.focus.selectAll('circle').remove()
      this.showHover(null)
    },
    renderHover () {
      const { value, image, dateUtc } = this.hover || {}
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
            canvas.height = canvas.width / this.aspectRatio
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
      this.renderLegend()
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

        this.g.legend.selectAll('path.mean')
          .data([values])
          .join('path')
          .attr('class', 'mean')
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', '2px')
          .attr('d', line)

        this.g.legend.selectAll('path.range')
          .data([values])
          .join('path')
          .attr('class', 'range')
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
        .text(`Observed Daily Mean ${this.variableLabelUnits}`)
        .attr('visibility', !this.hasData ? 'hidden' : 'visible')

      this.g.yAxis.selectAll('g.tick')
        .attr('visibility', !this.hasData ? 'hidden' : 'visible')
      this.g.yAxis.selectAll('g.tick')
        .attr('visibility', !this.hasData ? 'hidden' : 'visible')
    },
    renderDaily () {
      // if (this.variable.selected) {
      const valueChunks = []
      this.dailyValues.forEach((d, i) => {
        if (i === 0) {
          valueChunks.push([d])
        } else {
          if (d.dateUtc.diff(this.dailyValues[i - 1].dateUtc, 'day') > 1) {
            valueChunks.push([d])
          } else {
            valueChunks[valueChunks.length - 1].push(d)
          }
        }
      })

      const line = d3.line()
        .defined(d => hasDailyValue(d, this.variableId))
        .curve(d3.curveStep)
        .x(d => this.x(d.dateUtc))
        .y(d => this.y(d.values[this.variableId].mean))

      const area = d3.area()
        .defined(d => hasDailyValue(d, this.variableId))
        .curve(d3.curveStep)
        .x(d => this.x(d.dateUtc))
        .y0(d => this.y(d.values[this.variableId].min))
        .y1(d => this.y(d.values[this.variableId].max))

      this.g.values.selectAll('path.mean')
        .data(valueChunks)
        .join('path')
        .attr('class', 'mean')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', '2px')
        .attr('d', line)

      this.g.values.selectAll('path.range')
        .data(valueChunks)
        .join('path')
        .attr('class', 'range')
        .attr('fill', 'gray')
        .attr('opacity', 0.5)
        .attr('d', area)
      // }

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
      const row = this.dailyImages[i]
      this.showHover({
        dateUtc: row.dateUtc,
        image: row.image,
        value: hasDailyValue(row, this.variableId) ? row.values[this.variableId] : null
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
