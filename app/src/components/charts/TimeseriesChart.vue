<template>
  <highcharts constructor-type="stockChart" :options="chartOptions" ref="chart" class="mt-4"></highcharts>
</template>

<script>
import { variables } from '@/lib/constants'
import { format } from 'd3-format'
const variableAxes = variables.map((variable, i) => {
  return {
    id: variable.id,
    title: {
      text: variable.id
    },
    top: '25%',
    height: '75%',
    alignTicks: true,
    startOnTick: true,
    endOnTick: true,
    type: variable?.axis?.type || 'linear',
    labels: {
      distance: 0,
      y: 4
    }
  }
})
variableAxes.push({
  id: 'SCORE',
  title: {
    text: 'MODEL SCORE'
  },
  top: '25%',
  height: '75%',
  alignTicks: true,
  startOnTick: true,
  endOnTick: true,
  type: 'linear',
  labels: {
    distance: 0,
    y: 4
  }
})

// const variableAxes = ['FLOW_CFS', 'SCORE', 'STAGE_FT'].map((variableId, i) => {
//   return {
//     id: variableId,
//     title: {
//       text: variableId
//     },
//     opposite: i > 0,
//     top: '25%',
//     height: '75%',
//     showLastLabel: true,
//     labels: {
//       distance: 0,
//       y: 4
//     },
//     offset: i === 0 ? 0 : undefined
//   }
// })

export default {
  name: 'TimeseriesChart',
  props: ['series', 'images', 'station', 'play', 'speed', 'scaleValues'],
  data () {
    return {
      imageIndex: 0,
      mode: 'day', // 'day' or 'raw'
      playerTimout: null,
      chartOptions: {
        animation: false,
        chart: {
          zoomType: 'x'
        },
        time: {
          // getTimezoneOffset: (timestamp) => {
          //   if (!timestamp) return 0
          //   return -1 * this.$date(timestamp).tz(this.station.timezone).utcOffset()
          // }
        },
        noData: {
          style: {
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#303030'
          }
        },
        plotOptions: {
          series: {
            animation: false,
            point: {
              events: {
                mouseOver: (e) => {
                  this.clearHover()
                  // console.log('mouseOver', e.target.index)
                  this.imageIndex = e.target.index
                  this.hoverDate(e.target.x)
                }
              }
            }
          }
        },
        legend: {
          enabled: true
        },
        tooltip: {
          animation: false,
          split: false,
          shared: true,
          xDateFormat: '%b %e, %Y',
          hideDelay: 999999999
        },
        navigator: {
          enabled: true,
          series: {
            type: 'line',
            marker: {
              enabled: true
            }
          }
        },
        xAxis: {
          events: {
            // afterSetExtremes: this.afterSetExtremes
          }
        }
      }
    }
  },
  watch: {
    play (val) {
      if (val) {
        this.startPlaying()
      } else {
        this.stopPlaying()
      }
    },
    speed (val) {
      if (this.play) {
        this.stopPlaying()
        this.startPlaying()
      }
    },
    series () {
      this.updateChart()
    },
    scaleValues () {
      this.updateChart()
    }
  },
  async mounted () {
    this.chart = this.$refs.chart.chart
    await this.updateChart()
  },
  methods: {
    async afterSetExtremes () {
      // console.log('afterSetExtremes()')

      const extremes = this.chart.xAxis[0].getExtremes()
      const start = this.$date(extremes.min)
      const end = this.$date(extremes.max)
      const durationDays = end.diff(start, 'days')
      // console.log(`extremes: ${start} to ${end} (${durationDays} days)`)

      // await this.render()
      // let mode = 'daily'
      if (durationDays > 90) {
        if (this.mode === 'day') return

        // switch back to daily
        this.mode = 'day'
        for (const series of this.chart.series) {
          series.setData(series.options.daily, false, false)
        }
        return this.chart.redraw()
      }

      this.chart.showLoading('Loading data...')
      this.mode = 'raw'
      for (const series of this.chart.series) {
        if (series.name === 'Photo') {
          const images = await this.fetchRawImages(this.station.id, start, end)
          const seriesValues = images.map(d => ({ x: d.timestamp.valueOf(), y: 0, image: d }))
          series.setData(seriesValues, false, false)
        } else if (series.options.source === 'FPE') {
          const values = await this.fetchRawData(this.station.id, series.options.variableId, start, end)
          const seriesValues = values.map(d => ([d.timestampUtc.valueOf(), d.value]))
          series.setData(seriesValues, false, false)
        }
      }
      this.chart.render(false)
      this.chart.hideLoading()
    },
    async fetchRawImages (stationId, start, end) {
      const url = `/stations/${stationId}/images`
      const response = await this.$http.public.get(url, {
        params: {
          start: this.$date(start).toISOString(),
          end: this.$date(end).toISOString()
        }
      })
      const images = response.data
      images.forEach(d => {
        d.timestampRaw = d.timestamp
        d.timestamp = this.$date(d.timestamp).tz(this.station.timezone)
        d.timestampUtc = this.$date(d.timestampRaw).add(d.timestamp.utcOffset() / 60, 'hour').toDate()
      })
      return images.filter(d => d.timestamp.isBetween(start, end, null, '[]'))
    },
    async fetchRawData (stationId, variableId, start, end) {
      const url = `/stations/${stationId}/values`
      const response = await this.$http.public.get(url, {
        params: {
          variable: variableId,
          start: this.$date(start).subtract(1, 'day').toISOString(),
          end: this.$date(end).add(1, 'day').toISOString()
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
    updateChart () {
      const seriesVariableIds = this.series.map(d => d.variableId)
      let dataAxes = []
      if (this.scaleValues) {
        dataAxes = [{
          id: 'values',
          title: {
            text: 'Rank Percentile',
            x: -5
          },
          min: 0,
          max: 1,
          type: 'linear',
          top: '25%',
          height: '75%',
          labels: {
            formatter: function () {
              return (this.value * 100).toFixed(0) + '%'
            },
            y: 5,
            x: 0
          },
          opposite: false,
          startOnTick: true,
          endOnTick: true,
          tickAmount: 5,
          showLastLabel: true
        }]
      } else {
        dataAxes = variableAxes.filter(d => seriesVariableIds.includes(d.id))
        dataAxes.forEach((axis, i) => {
          axis.opposite = i > 0
          axis.gridLineWidth = i > 0 ? 0 : 1
        })
      }
      const yAxes = [
        {
          id: 'images',
          title: {
            text: 'Photos',
            x: -10
          },
          labels: {
            enabled: false
          },
          opposite: false,
          endOnTick: false,
          height: '15%'
        },
        ...dataAxes
      ]
      const dailyImages = this.images.map(d => {
        return { x: (new Date(d.date)).valueOf(), y: 0, image: d.image }
      })
      const $date = this.$date
      const timezone = this.station.timezone
      const imagesSeries = {
        name: 'Photo',
        data: dailyImages,
        daily: dailyImages,
        yAxis: 'images',
        showInLegend: false,
        lineWidth: 0,
        marker: {
          enabled: true,
          symbol: 'circle',
          radius: 5,
          lineColor: 'goldenrod',
          lineWidth: 1,
          fillColor: 'white',
          states: {
            normal: {
              opacity: 1
            },
            hover: {
              radiusPlus: 5,
              opacity: 1
            },
            select: {
              opacity: 1
            }
          }
        },
        color: 'goldenrod',
        tooltip: {
          pointFormatter: function () {
            const timestamp = $date(this.image.timestamp).tz(timezone).format('LT z')
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${timestamp}</b><br/>`
          },
          xDateFormat: '%b %e, %Y'
        }
      }

      const variableSeries = this.series.map((series, i) => {
        const dailyValues = series.data.map(d => {
          return [d.dateUtc.valueOf(), this.scaleValues ? d.rank : d.value]
        })
        const s = {
          name: series.name,
          source: series.source,
          variableId: series.variableId,
          data: dailyValues,
          daily: dailyValues,
          yAxis: this.scaleValues ? 'values' : series.variableId,
          gapSize: 2,
          legend: {
            enabled: true
          },
          marker: {
            symbol: 'circle'
          },
          tooltip: {},
          states: {
            hover: {
              lineWidthPlus: 0,
              halo: {
                size: 0
              }
            }
          }
        }
        if (this.scaleValues) {
          s.tooltip.pointFormatter = function () {
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${format('.1%')(this.y)}</b><br/>`
          }
        } else {
          s.tooltip.pointFormatter = function () {
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${format('.1f')(this.y)}</b><br/>`
          }
        }
        return s
      })
      const newSeries = [imagesSeries, ...variableSeries]

      // first clear out chart to reset series and yAxes
      // in case the set of series (variables) has changed
      this.chart.update({
        yAxis: [],
        series: []
      }, true, true, false)
      this.chart.colorCounter = 0
      this.chart.update({
        // time: {
        //   timezone: this.station.timezone
        // },
        yAxis: yAxes,
        series: newSeries
      }, true, true, false)
      // if (variableSeries.length === 0) {
      //   this.chart.showNoData('No observed data or model results available')
      // } else {
      //   this.chart.hideNoData()
      // }
      this.hoverPoint(0)
    },
    clearHover () {
      this.chart.series
        .filter(series => series.visible)
        .forEach(series => {
          series.points.forEach(point => {
            point.setState()
          })
        })
    },
    hoverPoint (index) {
      this.clearHover()
      const x = this.chart.series[0].points[index].x
      // console.log('hoverPoint', index, x, (new Date(x)).toISOString())
      const points = this.chart.series
        .filter(series => series.name !== 'Navigator 1' && series.visible)
        .map(series => series.points.find(d => d.x === x))
        .filter(d => d !== undefined)
      if (points.length > 0) {
        points.forEach(point => {
          point.setState('hover')
        })
        this.chart.tooltip.refresh(points)
        const date = (new Date(points[0].x)).toISOString().slice(0, 10)
        this.hoverDate(date)
      }
    },
    startPlaying () {
      this.playerTimeout = setInterval(async () => {
        const n = this.chart.series[0].points.length
        this.imageIndex += 1
        if (this.imageIndex >= n) {
          this.imageIndex = 0
        }
        this.hoverPoint(this.imageIndex)
      }, 1000 / this.speed)
    },
    stopPlaying () {
      clearTimeout(this.playerTimeout)
    },
    hoverDate (millis) {
      let image
      if (this.mode === 'day') {
        const date = (new Date(millis)).toISOString().slice(0, 10)
        const item = this.images.find(d => d.date === date)
        if (!item || !item.image) return
        image = item.image
        if (image) {
          image.values = this.series.map(series => {
            return {
              variableId: series.variableId,
              value: series.data.find(d => d.date === date)
            }
          })
        }
      } else {
        const item = this.chart.series[0].options.data.find(d => d.x >= millis)
        if (item) {
          image = item.image
        }
      }

      this.$emit('hover', image)
    }
  }
}
</script>
