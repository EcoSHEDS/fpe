<template>
  <v-row class="justify-center mt-4">
    <v-col cols="12" md="8">
      <highcharts :options="chartOptions" ref="chart"></highcharts>
    </v-col>
    <v-col cols="12" md="4">
      <v-sheet class="text-body-2 px-4">
        <div class="text-subtitle-1">About This Chart</div>
        <v-divider class="mb-2"></v-divider>
        <p>
          The Distribution Chart shows the cumulative distribution of daily mean values for each variable.
        </p>
        <p>
          The x-axis represents the percentile rank, and the y-axis represents the daily mean value of each date.
        </p>
        <p>
          Hover over the chart to see the photo associated with each daily point, which is the photo taken closest to noon on that date.
        </p>
        <p>
          Note that the <code>Show as Rank Percentile</code> option does not affect this chart since the x-axis is already in rank percentile.
        </p>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { variables } from '@/lib/constants'
import { format } from 'd3-format'
import { utcFormat } from 'd3-time-format'
const variableAxes = variables.map((variable, i) => {
  return {
    id: variable.id,
    title: {
      text: variable.id
    },
    alignTicks: true,
    startOnTick: true,
    endOnTick: true,
    type: variable?.axis?.type || 'linear'
  }
})
variableAxes.push({
  id: 'SCORE',
  title: {
    text: 'MODEL SCORE'
  },
  alignTicks: true,
  startOnTick: true,
  endOnTick: true,
  type: 'linear'
})

export default {
  name: 'DistributionChart',
  props: ['series', 'images', 'station', 'play', 'speed'],
  data () {
    return {
      points: [],
      imageIndex: 0,
      playerTimout: null,
      chartOptions: {
        animation: false,
        chart: {
          type: 'scatter',
          zoomType: 'xy',
          height: '400px'
        },
        title: {
          text: null
        },
        plotOptions: {
          series: {
            animation: false,
            turboThreshold: 0,
            tooltip: {
              headerFormat: '<b>{series.name}</b><br>',
              pointFormatter: function () {
                const date = utcFormat('%B %d, %Y')(new Date(this.date))
                return `Date: <b>${date}</b><br>Rank: <b>${format('.1%')(this.x)}</b><br>Value: <b>${format('.1f')(this.y)}</b>`
              }
            },
            point: {
              events: {
                mouseOver: (e) => {
                  this.$emit('hover', e.target.image)
                }
              }
            }
          }
        },
        xAxis: {
          title: {
            text: 'Rank Percentile'
          },
          min: 0,
          max: 1,
          labels: {
            formatter: function () {
              return (this.value * 100).toFixed(0) + '%'
            }
          },
          gridLineWidth: 1
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
    }
  },
  async mounted () {
    this.chart = this.$refs.chart.chart
    await this.updateChart()
  },
  methods: {
    generatePoints () {
      if (!this.images) {
        return []
      }

      const points = this.images.map(image => {
        const date = image.date
        const values = this.series.map((series, i) => {
          const value = series.data.find(d => d.date === date)
          return {
            seriesIndex: i,
            variableId: series.variableId,
            name: series.name,
            date,
            value: value ? value.value : null,
            rank: value ? value.rank : null
          }
        })
        return {
          date: image.date,
          image: image.image,
          values
        }
      })

      return points
    },
    updateChart () {
      this.points = this.generatePoints()
      const pointSeries = this.series.map((series, i) => {
        return {
          name: series.name,
          data: this.points.map((d, j) => {
            return {
              x: d.values[i] ? d.values[i].rank : null,
              y: d.values[i] ? d.values[i].value : null,
              date: d.date,
              image: d.image,
              index: i
            }
          }).filter(d => d.x !== null && d.y !== null),
          marker: {
            symbol: 'circle',
            radius: 3,
            lineWidth: 1,
            states: {
              hover: {
                radiusPlus: 5
              }
            }
          },
          yAxis: series.variableId
        }
      })

      const seriesVariableIds = this.series.map(d => d.variableId)
      const yAxes = [
        ...variableAxes.filter(d => seriesVariableIds.includes(d.id))
      ]
      yAxes.forEach((d, i) => {
        d.opposite = i > 0
        d.gridLineWidth = i > 0 ? 0 : 1
      })

      // first clear out chart to reset series and yAxes
      // in case the set of series (variables) has changed
      this.chart.update({
        yAxis: [],
        series: []
      }, true, true, false)
      this.chart.update({
        yAxis: yAxes,
        series: pointSeries
      }, true, true, false)
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
      const points = this.chart.series
        .filter(series => series.name !== 'Navigator 1' && series.visible)
        .map(series => series.points.find(d => d.x === x))
        .filter(d => d !== undefined)
      if (points.length > 0) {
        points.forEach(point => {
          point.setState('hover')
        })
        this.chart.tooltip.refresh(points)
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
    }
  }
}
</script>
