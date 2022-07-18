<template>
  <div></div>
</template>

<script>
import * as d3 from 'd3'

import { hasDailyValue } from '@/lib/utils'

export default {
  name: 'ContextChart',
  props: ['station', 'variable', 'daily'],
  data () {
    return {
      clipId: 'context',
      width: 700,
      margin: {
        left: 60,
        right: 80,
        top: 40,
        bottom: 20
      }
    }
  },
  computed: {
    variableId () {
      if (!this.variable || !this.variable.value) return null
      return this.variable.value
    },
    maxValue () {
      if (!this.values.length === 0 || !this.variableId) return 0
      return d3.max(this.values, d => d.values ? d.values[this.variableId].mean : 0)
    },
    dateExtent () {
      if (this.dailyImages.length === 0) return null
      const dateExtent = d3.extent(this.dailyImages, d => d.dateUtc)
      dateExtent[1] = dateExtent[1].add(1, 'day')
      return dateExtent
    },
    x () {
      return d3.scaleUtc()
        .domain(this.dateExtent)
        .range([this.margin.left, this.width - this.margin.right])
    },
    y () {
      return d3.scaleLinear()
        .domain([0, 1.1 * this.maxValue])
        .range([this.height - this.margin.bottom, this.margin.top])
    },
    dailyImages () {
      return this.daily ? this.daily.filter(d => !!d.images) : []
    },
    imagePeriods () {
      if (!this.daily || this.daily.length === 0) return []

      const imagePeriods = []
      this.dailyImages.forEach((d, i) => {
        if (i === 0) {
          imagePeriods.push([d])
        } else {
          if (d.dateUtc.diff(this.dailyImages[i - 1].dateUtc, 'day') > 1) {
            imagePeriods.push([d])
          } else {
            imagePeriods[imagePeriods.length - 1].push(d)
          }
        }
      })
      return imagePeriods.map(d => {
        return {
          start: d[0].dateUtc,
          end: d[d.length - 1].dateUtc.add(1, 'day')
        }
      })
    },
    values () {
      if (!this.variableId || !this.daily) return []

      const data = [...this.daily]
        .filter(d => hasDailyValue(d, this.variableId))
        .filter(d => d.dateUtc.isBetween(this.dateExtent[0].subtract(1, 'day'), this.dateExtent[1], null, '[]'))
      if (data.length > 0) {
        const lastValue = Object.assign({}, data[data.length - 1])
        lastValue.dateUtc = lastValue.dateUtc.clone().add(1, 'day')
        data.push(lastValue)
      }
      return data
    },
    hasValues () {
      return this.values.length > 0
    },
    height () {
      return this.hasValues ? 100 : 50
    }
  },
  watch: {
    variable () {
      this.render()
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      this.width = this.$el.offsetWidth

      const xAxis = d3.axisBottom(this.x)
        .ticks(this.$vuetify.breakpoint.mobile ? 4 : 8)
        .tickSizeOuter(0)

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
          .attr('transform', `translate(0,${this.height - this.margin.bottom})`)
          .call(xAxis),
        yAxis: this.svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', `translate(${this.margin.left},0)`),
        values: this.svg.append('g')
          .attr('class', 'values')
          .attr('clip-path', `url(#${this.clipId})`),
        images: this.svg.append('g')
          .attr('class', 'images'),
        noImages: this.svg.append('g')
          .attr('class', 'no-images')
          .append('text')
          .attr('transform', `translate(${this.margin.left + (this.width - this.margin.left - this.margin.right) / 2},15)`)
          .attr('fill', 'currentColor')
          .attr('text-anchor', 'middle')
          .text('No Photos Available')
      }
      this.createBrush(true)
      this.render()
    },
    createBrush (init) {
      const that = this
      function brushended ({ selection }) {
        const rangeUtc = selection ? selection.map(that.x.invert, that.x) : that.x.domain()

        d3.select(this)
          .selectAll('path.handle--custom')
          .attr('display', d => selection ? null : 'none')

        const rangeLocal = rangeUtc.map(d => that.$date.utc(d).tz(that.station.timezone, true))
        that.$emit('brush', rangeLocal.map(d => d.toDate()))

        that.brushSelection = selection
      }
      function brushing ({ selection }) {
        d3.select(this)
          .selectAll('path.handle--custom')
          .data([{ type: 'e' }, { type: 'w' }], d => d.type)
          .join(
            enter => enter.append('path')
              .attr('class', 'handle--custom')
              .attr('pointer-events', 'none')
              .attr('stroke', 'black')
              .attr('opacity', 0.5)
              .attr('d', (d) => {
                const e = +(d.type === 'e')
                const x = e ? 1 : -1
                const y0 = that.hasValues ? 27 : 0
                const l = 30
                return 'M' + (0.5 * x) + ',' + y0 +
                'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y0 + 6) +
                'V' + (y0 + l - 6) +
                'A6,6 0 0 ' + e + ' ' + (0.5 * x) + ',' + (l + y0) +
                'Z' +
                'M' + (2.5 * x) + ',' + (l / 2 + 8 + y0) +
                'V' + (y0 + l / 2 - 8) +
                'M' + (4.5 * x) + ',' + (l / 2 + y0 + 8) +
                'V' + (y0 + l / 2 - 8)
              })
          )
          .attr('transform', (d) => `translate(${d.type === 'e' ? selection[1] : selection[0]}, 0)`)
          .attr('display', selection ? null : 'none')
      }
      this.brush = d3.brushX()
        .extent([[this.margin.left, 0.5], [this.width - this.margin.right, this.height - this.margin.bottom + 0.5]])
        .handleSize(10)
        .on('brush', brushing)
        .on('end', brushended)

      if (this.g.brush) {
        this.g.brush.remove()
      }
      this.g.brush = this.svg.append('g')
        .attr('class', 'brush')
        .call(this.brush)
      if (init) {
        brushended({ selection: null })
      } else if (this.brushSelection) {
        this.brush.move(this.g.brush, this.brushSelection)
      }
    },
    renderAxes () {
      if (this.hasValues) {
        this.g.yAxis.attr('display', null)
        const yAxis = d3.axisLeft(this.y)
          .ticks(2)
          .tickFormat(d3.format('.2r'))
          .tickSizeOuter(5)

        const yLabel = this.g.yAxis.select('text.variable')
        if (yLabel.empty()) {
          this.g.yAxis.append('text')
            .attr('class', 'variable')
            .attr('transform', `translate(${-this.margin.left},${this.margin.top - 10})`)
            .attr('text-anchor', 'start')
            .attr('font-size', 12)
            .attr('fill', 'currentColor')
        }
        this.g.yAxis.select('text.variable')
          .text(this.variable.value ? `Obs. Daily Mean ${this.variable.label}` : '')

        this.g.yAxis.call(yAxis)
      } else {
        this.g.yAxis.attr('display', 'none')
      }

      const imagesLabel = this.g.images.select('text.images')
      if (imagesLabel.empty()) {
        this.g.images.append('text')
          .attr('class', 'images')
          .attr('transform', 'translate(0,0)')
          .attr('fill', 'currentColor')
          .attr('dy', '1em')
          .attr('font-size', 12)
          .text('Photos→')
      }
    },
    render () {
      // update height
      this.svg.attr('height', this.height)
      this.svg.select('clipPath').select('rect').attr('height', this.height)
      this.g.xAxis.attr(
        'transform',
        `translate(0,${this.height - this.margin.bottom})`
      )
      // this.g.input.select('rect')
      //   .attr('height', this.height - this.margin.bottom)

      this.createBrush()
      this.renderAxes()

      if (this.hasValues) {
        const area = d3.area()
          .defined(d => hasDailyValue(d, this.variableId))
          .curve(d3.curveStep)
          .x(d => this.x(d.dateUtc))
          .y0(this.y(0))
          .y1(d => this.y(d.values[this.variableId].mean))

        const valueChunks = []
        this.values.forEach((d, i) => {
          if (i === 0) {
            valueChunks.push([d])
          } else {
            if (d.dateUtc.diff(this.values[i - 1].dateUtc, 'day') > 1) {
              valueChunks.push([d])
            } else {
              valueChunks[valueChunks.length - 1].push(d)
            }
          }
        })

        this.g.values.selectAll('path')
          .data(valueChunks)
          .join('path')
          .attr('fill', 'steelblue')
          .attr('opacity', 0.9)
          .attr('d', area)
      } else {
        this.g.values.selectAll('path').remove()
      }

      this.g.images
        .selectAll('rect')
        .data(this.imagePeriods)
        .join('rect')
        .attr('fill', 'gold')
        .attr('stroke', 'goldenrod')
        .attr('x', d => this.x(d.start))
        .attr('y', 2)
        .attr('height', 10)
        .attr('rx', 1)
        .attr('width', d => this.x(d.end) - this.x(d.start))
      this.g.noImages
        .attr('visibility', this.imagePeriods.length > 0 ? 'hidden' : 'visible')

      this.g.xAxis.selectAll('g.tick')
        .attr('visibility', this.values.length > 0 || this.imagePeriods.length > 0 ? 'visible' : 'hidden')

      this.g.brush.attr('display', this.values.length > 0 || this.imagePeriods.length > 0 ? null : 'none')
    }
  }
}
</script>

<style>

</style>
