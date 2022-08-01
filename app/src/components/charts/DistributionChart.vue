<template>
  <div>
    <v-alert
      type="error"
      text
      colored-border
      border="left"
      class="body-2 my-4"
      v-if="distributionValues.length > 0 && !variableId"
    >
      <div class="font-weight-bold body-1">Variable Not Selected</div>
      <div>
        Select a variable from the dropdown above to view the distribution plot.
      </div>
    </v-alert>
    <v-alert
      type="error"
      text
      colored-border
      border="left"
      class="body-2 my-4"
      v-else-if="distributionValues.length == 0"
    >
      <div class="font-weight-bold body-1">No Data Available</div>
      <div>
        A distribution plot cannot be created because there is no data during the selected time window.
      </div>
    </v-alert>
  </div>
</template>

<script>
import * as d3 from 'd3'
import debounce from 'debounce'

import { hasDailyImage, hasDailyValue, lerp } from '@/lib/utils'

export default {
  name: 'DistributionChart',
  props: ['station', 'variable', 'daily', 'instantaneous', 'mode', 'focus', 'hover', 'play', 'speed'],
  data () {
    return {
      ready: false,
      clipId: 'distribution',
      width: 400,
      height: 250,
      margin: {
        left: 60,
        right: 20,
        top: 10,
        bottom: 40,
        images: 10
      },
      player: {
        i: 0,
        timeout: null
      }
    }
  },
  computed: {
    variableId () {
      if (!this.variable || !this.variable.id) return null
      return this.variable.id
    },
    focusUtc () {
      if (!this.focus) return this.focus
      return this.focus.map(d => this.$date.tz(d, this.station.timezone).utc(true))
    },
    xDomain () {
      if (!this.variableId || this.distributionValues.length === 0) return [0, 1]
      const extent = d3.extent(this.distributionValues, d => d.value)
      if (this.variableId === 'FLOW_CFS') {
        extent[0] = extent[0] * 0.9
        extent[1] = extent[1] * 1.1
      } else if (this.variableId === 'STAGE_FT') {
        extent[0] = extent[0] - 0.05 * (extent[1] - extent[0])
        extent[1] = extent[1] + 0.05 * (extent[1] - extent[0])
      }
      return extent
    },
    x () {
      return (this.variableId === 'FLOW_CFS' ? d3.scaleLog() : d3.scaleLinear())
        .domain(this.xDomain)
        .range([this.margin.left, this.width - this.margin.right])
    },
    y () {
      return d3.scaleLinear()
        .domain([0, 1])
        .range([this.height - this.margin.bottom, this.margin.top + this.margin.images])
    },
    focusDaily () {
      if (!this.daily || !this.focusUtc) return []
      return this.daily.filter(d => d.dateUtc.isBetween(this.focusUtc[0], this.focusUtc[1], null, '[]'))
    },
    distributionValues () {
      if (this.mode === 'daily') {
        if (!this.focusDaily || !this.variableId || !this.focusUtc) return []

        return this.focusDaily
          .filter(d => hasDailyValue(d, this.variableId))
          .sort((a, b) => d3.ascending(a.values[this.variableId].mean, b.values[this.variableId].mean))
          .map((d, i, arr) => ({
            p: i / (arr.length + 1),
            value: d.values[this.variableId].mean,
            ...d
          }))
      } else {
        if (!this.instantaneous || !this.variableId || !this.focusUtc) return []
        return this.instantaneous.values.slice()
          .sort((a, b) => d3.ascending(a.value, b.value))
          .map((d, i, arr) => ({
            p: i / (arr.length + 1),
            value: d.value,
            ...d
          }))
      }
    },
    distributionImages () {
      if (this.mode === 'daily') {
        return this.distributionValues.filter(hasDailyImage)
          .map(d => ({
            date: d.date,
            dateUtc: d.dateUtc,
            image: d.image,
            value: d.values[this.variableId],
            p: d.p
          }))
      } else {
        const valueBisector = d3.bisector(d => d.value).left
        const interpolateProbability = (data, value) => {
          if (!data || data.length === 0) return

          if (value < data[0].value || value > data[data.length - 1].value) {
            return null
          }

          const i = valueBisector(data, value)

          const a = data[i - 1]
          const b = data[i]

          if (!a) return b.p
          if (!b) return a.p

          const t = (value - a.value) / (b.value - a.value)
          const p = lerp(a.p, b.p, t)

          return p
        }
        this.instantaneous.images.forEach(d => {
          d.p = interpolateProbability(this.distributionValues, d.value)
        })
        return this.instantaneous.images.slice()
          .filter(d => d.value !== null && d.p !== null)
          .sort((a, b) => d3.ascending(a.value, b.value))
      }
    }
  },
  mounted () {
    this.init()
  },
  beforeDestroy () {
    this.stopAutoplay()
  },
  watch: {
    focus () {
      this.render()
    },
    hover () {
      this.renderHover()
    },
    play () {
      if (this.play) {
        this.startAutoplay()
      } else {
        this.stopAutoplay()
      }
    }
  },
  methods: {
    init () {
      this.width = Math.min(this.$el.offsetWidth, this.width)
      this.svg = d3.select(this.$el)
        .append('svg')
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
          .attr('class', 'no-images'),
        noValues: this.svg.append('g')
          .attr('class', 'no-values'),
        input: this.svg.append('g')
          .attr('class', 'input')
      }

      this.g.noImages
        .append('text')
        .attr('transform', `translate(${this.margin.left + (this.width - this.margin.left - this.margin.right) / 2},${this.height / 2})`)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'middle')
        .text('No Photos Available')
        .attr('display', this.distributionImages.length > 0 ? 'none' : null)

      this.g.noValues
        .append('text')
        .attr('transform', `translate(${this.margin.left + (this.width - this.margin.left - this.margin.right) / 2},${this.height / 2 - 40})`)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'middle')
        .text('No Data Available')

      this.g.input
        .append('rect')
        .attr('pointer-events', 'all')
        .attr('x', 0)
        .attr('y', this.margin.top)
        .attr('width', this.width)
        .attr('height', this.height - this.margin.top - this.margin.bottom)
        .style('fill', 'none')
        .attr('clip-path', `url(#${this.clipId})`)
        .on('mousemove', this.onMousemove)
        // .on('mouseout', this.clearHover)

      this.ready = true
      this.render()
    },
    onMousemove (event) {
      if (this.play) return
      const mouseValue = this.x.invert(event.offsetX)

      if (this.mode === 'daily') {
        if (this.distributionImages.length === 0) return this.emitHover()
        const valueBisector = d3.bisector(d => d.value.mean).left
        const bisectValue = (data, value) => {
          const i = valueBisector(data, value, 1)
          const a = data[i - 1]
          const b = data[i]
          if (!b) return a
          return (value - a.value.mean) > (b.value.mean - value) ? b : a
        }
        const hoveredItem = bisectValue(this.distributionImages, mouseValue)

        this.emitHover({
          mode: this.mode,
          dateUtc: hoveredItem.dateUtc,
          image: hoveredItem.image,
          value: hoveredItem.value,
          p: hoveredItem.p
        })
      } else if (this.mode === 'instantaneous') {
        if (this.distributionImages.length === 0) return this.emitHover()

        const valueBisector = d3.bisector(d => d.value).left
        const bisectValue = (data, value) => {
          const i = valueBisector(data, value, 1)

          const a = data[i - 1]
          const b = data[i]
          if (!b) return a
          const item = (value - a.value) > (b.value - value) ? b : a
          return item
        }
        const hoveredImage = bisectValue(this.distributionImages, mouseValue)

        this.emitHover({
          mode: this.mode,
          timestampUtc: hoveredImage.timestampUtc,
          image: hoveredImage,
          value: hoveredImage.value,
          p: hoveredImage.p
        })
      }
    },
    clearHover () {
      this.g.focus.selectAll('circle').remove()
      this.emitHover()
    },
    emitHover: debounce(function (hover) {
      this.$emit('hover', hover)
    }, 10),
    render () {
      if (!this.ready || !this.focus) return

      if (!this.variableId || this.distributionValues.length === 0) {
        this.svg.attr('display', 'none')
        return
      } else {
        this.svg.attr('display', null)
      }

      // clear existing values and images
      this.g.values.selectAll('path').remove()
      this.g.images.selectAll('circle').remove()

      this.renderAxes()
      if (this.mode === 'instantaneous') {
        this.renderInstantaneous()
      } else {
        this.renderDaily()
      }
    },
    renderAxes () {
      const xAxis = d3.axisBottom(this.x)
        .ticks(5)
        .tickSizeOuter(0)

      this.g.xAxis.call(xAxis)
      const yAxis = d3.axisLeft(this.y)
        .ticks(6)
        .tickFormat(d3.format('.0%'))
      this.g.yAxis.call(yAxis)

      const yLabel = this.g.yAxis.select('text.label')
      if (yLabel.empty()) {
        this.g.yAxis.append('text')
          .attr('class', 'label')
          .attr('transform', `translate(0,${this.margin.top})`)
          .attr('text-anchor', 'end')
          .attr('font-size', 12)
          .attr('fill', 'currentColor')
          .text('Percentile')
      }

      const xLabel = this.g.xAxis.select('text.label')
      if (xLabel.empty()) {
        this.g.xAxis.append('text')
          .attr('class', 'label')
          .attr('transform', `translate(${(this.width - this.margin.right - this.margin.left) / 2 + this.margin.left},30)`)
          .attr('text-anchor', 'middle')
          .attr('font-size', 12)
          .attr('fill', 'currentColor')
      }
      this.g.xAxis.select('text.label')
        .text(
          this.distributionValues.length > 0
            ? `${this.mode === 'daily' ? 'Daily Mean Observed ' : 'Observed '}${this.variable.label} (${this.variable.units})`
            : ''
        )

      this.g.xAxis.selectAll('g.tick')
        .attr('visibility', this.distributionValues.length > 0 ? 'visible' : 'hidden')
      this.g.yAxis.selectAll('g.tick')
        .attr('visibility', this.distributionValues.length > 0 ? 'visible' : 'hidden')
    },
    renderDaily () {
      // this.mode = 'daily'

      if (this.variableId) {
        const line = d3.line()
          .defined(d => hasDailyValue(d, this.variableId))
          .x(d => this.x(d.value))
          .y(d => this.y(d.p))

        this.g.values.selectAll('path.mean')
          .data([this.distributionValues])
          .join('path')
          .attr('class', 'mean')
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', '2px')
          .attr('d', line)

        this.g.images.selectAll('circle')
          .data(this.distributionImages)
          .join('circle')
          .attr('fill', 'gold')
          .attr('stroke', 'goldenrod')
          .attr('opacity', 0.6)
          .attr('cx', d => this.x(d.value.mean))
          .attr('cy', d => this.y(d.p))
          .attr('r', this.margin.images / 2)
      }

      this.g.noValues.attr('visibility', this.distributionValues.length > 0 ? 'hidden' : 'visible')
      this.g.noImages.attr('visibility', this.distributionImages.length > 0 ? 'hidden' : 'visible')
    },
    renderInstantaneous () {
      const line = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => this.x(d.value))
        .y(d => this.y(d.p))

      this.g.values.selectAll('path.value')
        .data([this.distributionValues])
        .join('path')
        .attr('class', 'value')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', '2px')
        .attr('d', line)

      this.g.images.selectAll('circle.image')
        .data(this.distributionImages)
        .join('circle')
        .attr('class', 'image')
        .attr('fill', 'gold')
        .attr('stroke', 'goldenrod')
        .attr('opacity', 0.6)
        .attr('cx', d => this.x(d.value))
        .attr('cy', d => this.y(d.p))
        .attr('r', this.margin.images / 2)

      this.g.noValues.attr('visibility', this.distributionValues.length > 0 ? 'hidden' : 'visible')
      this.g.noImages.attr('visibility', this.distributionImages.length > 0 ? 'hidden' : 'visible')
    },
    renderHover () {
      if (!this.hover) {
        this.g.focus.selectAll('circle').remove()
      } else if (this.mode === 'daily') {
        this.g.focus.selectAll('circle.value')
          .data(this.hover ? [this.hover] : [])
          .join('circle')
          .attr('class', 'value')
          .attr('fill', 'none')
          .attr('stroke', 'orangered')
          .attr('stroke-width', '2px')
          .attr('cx', d => this.x(d.value.mean))
          .attr('cy', d => this.y(d.p))
          .attr('r', 5)
      } else if (this.mode === 'instantaneous') {
        this.g.focus.selectAll('circle.image')
          .data(this.hover ? [this.hover] : [], d => d.id)
          .join('circle')
          .attr('class', 'image')
          .attr('fill', 'none')
          .attr('stroke', 'orangered')
          .attr('stroke-width', '2px')
          .attr('cx', d => this.x(d.value))
          .attr('cy', d => this.y(d.p))
          .attr('r', 5)
      }
    },
    startAutoplay () {
      let i = 0
      if (this.hover) {
        const pBisector = d3.bisector(d => d.p).left
        i = pBisector(this.distributionImages, this.hover.p, 1)
      }
      this.playFrame(i)
    },
    playFrame (i) {
      this.player.i = i
      if (this.mode === 'daily') {
        const row = this.distributionImages[i]
        this.emitHover({
          mode: this.mode,
          dateUtc: row.dateUtc,
          image: row.image,
          value: row.value,
          p: row.p
        })
      } else if (this.mode === 'instantaneous') {
        const row = this.distributionImages[i]
        this.emitHover({
          mode: this.mode,
          timestampUtc: row.timestampUtc,
          image: row,
          value: row.value,
          p: row.p
        })
      }

      this.player.timeout = setTimeout(() => {
        if (i >= (this.distributionImages.length - 1)) {
          this.playFrame(0)
        } else {
          this.playFrame(i + 1)
        }
      }, 1e3 / this.speed)
    },
    stopAutoplay () {
      clearTimeout(this.player.timeout)
    }
  }
}
</script>
