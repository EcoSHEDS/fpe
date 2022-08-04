<template>
  <div></div>
</template>

<script>
import * as d3 from 'd3'
import debounce from 'debounce'

import { hasDailyValue, timeFormat } from '@/lib/utils'

export default {
  name: 'TimeseriesChart',
  props: ['station', 'variable', 'daily', 'instantaneous', 'mode', 'focus', 'hover', 'play', 'speed'],
  data () {
    return {
      ready: false,
      clipId: 'focus',
      width: 700,
      imageRadius: 6,
      margin: {
        left: 60,
        right: 80,
        top: 40,
        bottom: 20,
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
    minValue () {
      if (this.dailyValues.length === 0 || !this.variableId || this.variableId === 'FLOW_CFS') return 0
      return d3.min(this.dailyValues, d => d.values ? d.values[this.variableId].min : null)
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
      dateExtent[1] = dateExtent[1].add(1, 'day')
      return dateExtent
    },
    dailyImages () {
      return this.daily.filter(d => !!d.image)
    },
    focusUtc () {
      if (!this.focus) return this.focus
      const focusDates = this.focus.map(d => this.$date(d))
      const utcOffsets = focusDates.map(d => d.tz(this.station.timezone).utcOffset() / 60)
      const focusUtcDates = [focusDates[0].add(utcOffsets[0], 'hour'), focusDates[1].add(utcOffsets[1], 'hour')]
      return focusUtcDates
    },
    focusDaily () {
      if (!this.daily || !this.focusUtc) return []
      return this.daily.filter(d => d.dateUtc.isBetween(this.focusUtc[0], this.focusUtc[1], null, '[]'))
    },
    focusDailyValues () {
      if (!this.variableId) return []
      return this.focusDaily.filter(d => d.values && d.values[this.variableId])
    },
    focusDailyImages () {
      return this.focusDaily.filter(d => !!d.image)
    },
    hasValues () {
      return this.mode === 'daily'
        ? this.focusDailyValues.length > 0
        : this.instantaneous && this.instantaneous.values.length > 0
    },
    height () {
      return this.variableId ? 200 : 50
    },
    x () {
      return d3.scaleUtc()
        .domain(this.focusUtc || [0, 1])
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
      this.clearHover()
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
      this.width = this.$el.offsetWidth

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
        legend: this.svg.append('g')
          .attr(
            'transform',
            `translate(${this.width - this.margin.right + 10},${this.margin.top + (this.height - this.margin.top - this.margin.bottom) / 2})`
          )
          .attr('class', 'legend'),
        values: this.svg.append('g')
          .attr('class', 'values')
          .attr('clip-path', `url(#${this.clipId})`),
        images: this.svg.append('g')
          .attr('transform', 'translate(0,2)')
          .attr('class', 'images')
          .attr('clip-path', `url(#${this.clipId})`),
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
        .attr('transform', `translate(${this.margin.left + 5},${this.imageRadius * 2})`)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 12)
        .text('None')

      this.g.noValues
        .append('text')
        // .attr('transform', `translate(${this.margin.left + (this.width - this.margin.left - this.margin.right) / 2},${this.height / 2})`)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'middle')
        .text('No Data Available')

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
    onMousemove (event) {
      if (this.play) return
      const mouseTimestampUtc = this.$date(this.x.invert(event.offsetX)).utc()

      if (this.mode === 'daily') {
        if (this.focusDailyImages.length === 0) return this.emitHover()
        const dateUtcBisector = d3.bisector(d => d.dateUtc).left
        const bisectDateUtc = (data, dateUtc) => {
          const i = dateUtcBisector(data, dateUtc, 1)
          const a = data[i - 1]
          const b = data[i]
          if (!b) return a
          const item = (dateUtc - a.dateUtc) > (b.dateUtc - dateUtc) ? b : a
          return item
        }
        const hoveredItem = bisectDateUtc(this.focusDailyImages, mouseTimestampUtc)
        const hoveredImage = hoveredItem.image
        const hoveredValue = hasDailyValue(hoveredItem, this.variableId) ? hoveredItem.values[this.variableId] : null

        this.emitHover({
          mode: this.mode,
          dateUtc: hoveredItem.dateUtc,
          image: hoveredImage,
          value: hoveredValue
        })
      } else if (this.mode === 'instantaneous') {
        if (this.instantaneous.images.length === 0) return this.emitHover()
        const timestampUtcBisector = d3.bisector(d => d.timestampUtc).left
        const bisectTimestampUtc = (data, timestampUtc) => {
          const i = timestampUtcBisector(data, timestampUtc, 1)
          const a = data[i - 1]
          const b = data[i]
          if (!b) return a
          const item = (timestampUtc - a.timestampUtc) > (b.timestampUtc - timestampUtc) ? b : a
          return item
        }
        const hoveredImage = bisectTimestampUtc(this.instantaneous.images, mouseTimestampUtc)

        this.emitHover({
          mode: this.mode,
          timestampUtc: hoveredImage.timestampUtc,
          image: hoveredImage,
          value: hoveredImage.value
        })
      }
    },
    emitHover: debounce(function (hover) {
      this.$emit('hover', hover)
    }, 10),
    renderHover () {
      if (!this.hover) {
        this.g.focus.selectAll('circle').remove()
      } else if (this.mode === 'daily') {
        const { image, value, dateUtc } = this.hover
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
          .data([image], d => d.id)
          .join('circle')
          .attr('class', 'image')
          .attr('fill', 'none')
          .attr('stroke', 'orangered')
          .attr('stroke-width', '2px')
          .attr('cx', d => this.x(dateUtc))
          .attr('cy', this.imageRadius + 2)
          .attr('r', this.imageRadius)
      } else if (this.mode === 'instantaneous') {
        const { image, value, timestampUtc } = this.hover
        this.g.focus.selectAll('circle.value')
          .data(value ? [value] : [])
          .join('circle')
          .attr('class', 'value')
          .attr('fill', 'none')
          .attr('stroke', 'orangered')
          .attr('stroke-width', '2px')
          .attr('cx', this.x(timestampUtc))
          .attr('cy', this.y(value))
          .attr('r', 5)
        this.g.focus.selectAll('circle.image')
          .data([image], d => d.id)
          .join('circle')
          .attr('class', 'image')
          .attr('fill', 'none')
          .attr('stroke', 'orangered')
          .attr('stroke-width', '2px')
          .attr('cx', this.x(timestampUtc))
          .attr('cy', this.imageRadius + 2)
          .attr('r', this.imageRadius)
      }
    },
    clearHover () {
      this.g.focus.selectAll('circle').remove()
      this.emitHover()
    },
    render () {
      if (!this.ready || !this.focus) return

      // clear existing values and images
      this.g.values.selectAll('path').remove()
      this.g.images.selectAll('circle').remove()

      // update height
      this.svg.attr('height', this.height)

      this.svg.select('clipPath').select('rect').attr('height', this.height)

      this.g.xAxis.attr(
        'transform',
        `translate(0,${this.height - this.margin.bottom})`
      )
      this.g.legend.attr(
        'transform',
        `translate(${this.width - this.margin.right + 10},${this.margin.top + (this.height - this.margin.top - this.margin.bottom) / 2})`
      )
      this.g.noValues
        .attr('transform', `translate(${this.margin.left + (this.width - this.margin.left - this.margin.right) / 2},${this.height / 2})`)

      this.g.input.select('rect')
        .attr('height', this.height - this.margin.bottom)

      this.renderAxes()
      this.renderLegend()
      if (this.mode === 'daily') {
        this.renderDaily()
      } else if (this.mode === 'instantaneous') {
        this.renderInstantaneous()
      }
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

        if (this.mode === 'daily') {
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
        } else if (this.mode === 'instantaneous') {
          this.g.legend.selectAll('path.instantaneous')
            .data([values])
            .join('path')
            .attr('class', 'instantaneous')
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', '2px')
            .attr('d', line)

          this.g.legend.selectAll('text')
            .data([{ value: -7, text: 'Obs.' }, { value: 7, text: 'Value' }])
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
      }
    },
    renderAxes () {
      const xAxis = d3.axisBottom(this.x)
        .ticks(this.$vuetify.breakpoint.mobile ? 5 : 8)
        .tickSizeOuter(0)
        .tickFormat(timeFormat)
      this.g.xAxis.call(xAxis)

      const imagesLabel = this.g.yAxis.select('text.images')
      if (imagesLabel.empty()) {
        this.g.yAxis.append('text')
          .attr('class', 'images')
          .attr('transform', `translate(${-this.margin.left},${this.imageRadius - 1})`)
          .attr('fill', 'currentColor')
          .attr('dy', '0.5em')
          .attr('font-size', 12)
          .attr('text-anchor', 'start')
          .text('Photos→')
      }

      if (this.variableId) {
        this.g.yAxis.attr('display', null)
        const yAxis = d3.axisLeft(this.y)
          .ticks(6)
          .tickFormat(d3.format('.2r'))
        this.g.yAxis.call(yAxis)

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
          .text(`${this.mode === 'daily' ? 'Daily' : 'Instantaneous'} ${this.variable.label}` + (this.variable.id === 'OTHER' ? '' : ` (${this.variable.units})`))
      } else {
        this.g.yAxis.attr('display', 'none')
      }
    },
    renderDaily () {
      if (this.hasValues) {
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

        const valueChunks = []
        this.focusDailyValues.forEach((d, i) => {
          if (i === 0) {
            valueChunks.push([d])
          } else {
            if (d.dateUtc.diff(this.focusDailyValues[i - 1].dateUtc, 'day') > 1) {
              valueChunks.push([d])
            } else {
              valueChunks[valueChunks.length - 1].push(d)
            }
          }
        })

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
      }

      this.g.images.selectAll('circle')
        .data(this.focusDailyImages)
        .join('circle')
        .attr('fill', 'gold')
        .attr('stroke', 'goldenrod')
        .attr('cx', d => this.x(d.dateUtc))
        .attr('cy', this.imageRadius)
        .attr('r', this.imageRadius)

      this.g.noValues.attr('visibility', !this.variableId || this.focusDailyValues.length > 0 ? 'hidden' : 'visible')
      this.g.noImages.attr('visibility', this.focusDailyImages.length > 0 ? 'hidden' : 'visible')
    },
    renderInstantaneous () {
      const { values, images } = this.instantaneous

      const valueChunks = []
      values.forEach((d, i) => {
        if (i === 0) {
          valueChunks.push([d])
        } else {
          if (d.timestampUtc.diff(values[i - 1].timestampUtc, 'hour') > 1) {
            valueChunks.push([d])
          } else {
            valueChunks[valueChunks.length - 1].push(d)
          }
        }
      })

      const line = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => this.x(d.timestampUtc))
        .y(d => this.y(d.value))

      this.g.values.selectAll('path.value')
        .data(valueChunks)
        .join('path')
        .attr('class', 'value')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', '2px')
        .attr('d', line)

      this.g.images.selectAll('circle.image')
        .data(images)
        .join('circle')
        .attr('class', 'image')
        .attr('fill', 'gold')
        .attr('stroke', 'goldenrod')
        .attr('cx', d => this.x(d.timestampUtc))
        .attr('cy', this.imageRadius)
        .attr('r', this.imageRadius)

      this.g.noValues.attr('visibility', !this.variableId || valueChunks.length > 0 ? 'hidden' : 'visible')
      this.g.noImages.attr('visibility', images.length > 0 ? 'hidden' : 'visible')
    },
    startAutoplay () {
      let i = 0
      if (this.hover) {
        if (this.mode === 'daily') {
          const dateUtcBisector = d3.bisector(d => d.dateUtc).left
          i = dateUtcBisector(this.focusDailyImages, this.hover.dateUtc, 1)
        } else {
          const timestampUtcBisector = d3.bisector(d => d.timestampUtc).left
          i = timestampUtcBisector(this.instantaneous.images, this.hover.timestampUtc, 1)
        }
      }
      this.playFrame(i)
    },
    playFrame (i) {
      this.player.i = i
      if (this.mode === 'daily') {
        const row = this.focusDailyImages[i]
        this.emitHover({
          mode: this.mode,
          dateUtc: row.dateUtc,
          image: row.images.image,
          value: hasDailyValue(row, this.variableId) ? row.values[this.variableId] : null
        })
      } else if (this.mode === 'instantaneous') {
        const image = this.instantaneous.images[i]
        this.emitHover({
          mode: this.mode,
          timestampUtc: image.timestampUtc,
          image: image,
          value: image.value
        })
      }

      this.player.timeout = setTimeout(() => {
        if (this.mode === 'daily') {
          if (i >= (this.focusDailyImages.length - 1)) {
            this.playFrame(0)
          } else {
            this.playFrame(i + 1)
          }
        } else if (this.mode === 'instantaneous') {
          if (i >= (this.instantaneous.images.length - 1)) {
            this.playFrame(0)
          } else {
            this.playFrame(i + 1)
          }
        }
      }, 1e3 / this.speed)
    },
    stopAutoplay () {
      clearTimeout(this.player.timeout)
    }
  }
}
</script>
