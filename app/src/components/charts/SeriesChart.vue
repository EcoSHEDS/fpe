<template>
  <div>
    <div v-if="loading" style="position:relative;height:150px">
      <v-overlay absolute color="grey lighten-2">
        <div class="text-h6 text-center grey--text">
          <div>
            Loading Data
          </div>
          <v-progress-circular
            color="grey"
            indeterminate
            size="24"
            width="2"
            class="mt-2"
          ></v-progress-circular>
        </div>
      </v-overlay>
    </div>
    <div v-else-if="error">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Failed to Get Data</div>
        <div>{{ error }}</div>
      </v-alert>
    </div>
    <div ref="chart" v-show="!loading && !error">
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'

import { timeFormat } from '@/lib/utils'

export default {
  name: 'SeriesChart',
  props: {
    series: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      ready: false,
      loading: true,
      error: null,
      height: 150,
      width: 500,
      margin: {
        left: 60,
        right: 80,
        top: 10,
        bottom: 20
      },
      daily: []
    }
  },
  mounted () {
    this.init()
  },
  watch: {
    daily () {
      this.render()
    }
  },
  methods: {
    async fetch () {
      this.loading = true

      try {
        const response = await this.$http.public.get(`/series/${this.series.id}/daily`)
        const data = response.data
        data.forEach(d => {
          d.dateUtc = this.$date.utc(d.date)
        })
        this.daily = Object.freeze(data)
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading = false
      }
    },
    async init () {
      await this.fetch()
      this.width = this.$el.offsetWidth

      this.svg = d3.select(this.$refs.chart)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)

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
      }

      this.ready = true
      this.render()
    },
    render () {
      if (!this.ready) return

      this.g.values.selectAll('path').remove()

      const data = this.daily

      const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.dateUtc))
        .range([this.margin.left, this.width - this.margin.right])

      const yMin = this.series.variableId === 'FLOW_CFS' ? 0 : d3.min(data, d => d.min)
      const yMax = d3.max(data, d => d.max)
      const y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([this.height - this.margin.bottom, this.margin.top])

      const xAxis = d3.axisBottom(x)
        .ticks(5)
        .tickSizeOuter(0)
        .tickFormat(timeFormat)
      this.g.xAxis.call(xAxis)

      const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d3.format('.2r'))
      this.g.yAxis.call(yAxis)

      const line = d3.line()
        .defined(d => isFinite(d.mean))
        .curve(d3.curveStep)
        .x(d => x(d.dateUtc))
        .y(d => y(d.mean))

      const area = d3.area()
        .defined(d => isFinite(d.min) && isFinite(d.max))
        .curve(d3.curveStep)
        .x(d => x(d.dateUtc))
        .y0(d => y(d.min))
        .y1(d => y(d.max))

      this.g.values.selectAll('path.mean')
        .data([data])
        .join('path')
        .attr('class', 'mean')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', '2px')
        .attr('d', line)

      this.g.values.selectAll('path.range')
        .data([data])
        .join('path')
        .attr('class', 'range')
        .attr('fill', 'gray')
        .attr('opacity', 0.5)
        .attr('d', area)

      this.renderLegend()
    },
    renderLegend () {
      this.g.legend.selectAll('path').remove()
      this.g.legend.selectAll('text').remove()

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
  }
}
</script>

<style>

</style>
